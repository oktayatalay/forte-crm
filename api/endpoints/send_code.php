<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../config/email.php';
require_once '../phpmailer/PHPMailer.php';
require_once '../phpmailer/SMTP.php';
require_once '../phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

// Email format kontrolü
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçerli bir email adresi giriniz']);
    exit;
}

// @fortetourism.com domain kontrolü
if (!str_ends_with(strtolower($email), '@fortetourism.com')) {
    http_response_code(400);
    echo json_encode(['error' => 'Sadece @fortetourism.com uzantılı email adresleri kabul edilir']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Eski kodları temizle (expired olanları)
    $cleanup = $db->prepare("DELETE FROM auth_codes WHERE expires_at < NOW()");
    $cleanup->execute();
    
    // Son 1 dakika içinde kod gönderilmiş mi kontrol et (rate limiting)
    $check_recent = $db->prepare("SELECT COUNT(*) FROM auth_codes WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)");
    $check_recent->execute([$email]);
    
    if ($check_recent->fetchColumn() > 0) {
        http_response_code(429);
        echo json_encode(['error' => 'Çok sık kod istemi yapıyorsunuz. 1 dakika bekleyiniz.']);
        exit;
    }
    
    // 6 haneli kod oluştur
    $code = sprintf('%06d', mt_rand(100000, 999999));
    
    // Kodu veritabanına kaydet (5 dakika geçerli)
    $stmt = $db->prepare("INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))");
    $stmt->execute([$email, $code]);
    
    // Email gönderme işlemi
    $subject = "Forte Panel - Giriş Kodu";
    $message = "
    <html>
    <body style='font-family: Arial, sans-serif;'>
        <h3>Forte Panel Giriş Kodu</h3>
        <p>Merhaba,</p>
        <p>Forte Panel'e giriş yapabilmek için doğrulama kodunuz:</p>
        <h2 style='color: #b80728; font-size: 24px; letter-spacing: 3px;'>{$code}</h2>
        <p>Bu kod <strong>5 dakika</strong> geçerlidir.</p>
        <br>
        <p>Saygılarımızla,<br>Forte Tourism</p>
    </body>
    </html>";
    
    // PHPMailer ile email gönder
    $mail = new PHPMailer(true);
    $emailSent = false;
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $_ENV['SMTP_HOST'] ?? 'localhost';
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['SMTP_USER'] ?? '';
        $mail->Password   = $_ENV['SMTP_PASS'] ?? '';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        // Recipients
        $mail->setFrom($_ENV['SMTP_USER'] ?? 'noreply@domain.com', 'Forte Tourism');
        $mail->addAddress($email);
        
        // Content
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body    = $message;
        
        $mail->send();
        $emailSent = true;
    } catch (Exception $e) {
        error_log("PHPMailer Error: {$mail->ErrorInfo}");
        $emailSent = false;
    }
    
    if ($emailSent) {
        echo json_encode([
            'success' => true, 
            'message' => 'Doğrulama kodu email adresinize gönderildi'
        ]);
    } else {
        // Email gönderilemedi, kodu veritabanından sil
        $delete_stmt = $db->prepare("DELETE FROM auth_codes WHERE email = ? AND code = ?");
        $delete_stmt->execute([$email, $code]);
        
        http_response_code(500);
        echo json_encode(['error' => 'Email gönderilemedi. Lütfen tekrar deneyiniz.']);
    }
    
} catch (Exception $e) {
    // Log the actual error for debugging
    error_log("Send code error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode(['error' => 'Bir sunucu hatası oluştu. Lütfen tekrar deneyiniz.']);
}
?>