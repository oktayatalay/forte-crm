<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'E-posta adresi gerekli']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Admin kullanıcıyı kontrol et
    $stmt = $db->prepare("SELECT id, email, full_name FROM admin_users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        // Güvenlik için gerçek durumu belirtmiyoruz
        echo json_encode([
            'success' => true,
            'message' => 'Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.'
        ]);
        exit;
    }
    
    // Eski reset token'larını temizle
    $stmt = $db->prepare("DELETE FROM admin_password_resets WHERE admin_id = ?");
    $stmt->execute([$admin['id']]);
    
    // Yeni reset token oluştur
    $resetToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $stmt = $db->prepare("
        INSERT INTO admin_password_resets (admin_id, reset_token, expires_at) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$admin['id'], $resetToken, $expiresAt]);
    
    // Reset URL'i oluştur
    $resetUrl = "http://corporate.forte.works/admin/reset-password?token=" . $resetToken;
    
    // HTML E-posta içeriği
    $emailSubject = "Forte Tourism - Şifre Sıfırlama";
    $emailBody = "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Şifre Sıfırlama</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <h2 style='color: #2c5aa0;'>Forte Tourism Admin Panel</h2>
        <h3>Şifre Sıfırlama Talebi</h3>
        
        <p>Merhaba {$admin['full_name']},</p>
        
        <p>Forte Tourism Admin Panel için şifre sıfırlama talebiniz alınmıştır.</p>
        
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        
        <div style='text-align: center; margin: 30px 0;'>
            <a href='{$resetUrl}' style='background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Şifreyi Sıfırla</a>
        </div>
        
        <p>Eğer buton çalışmıyorsa, aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
        <p style='word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;'>{$resetUrl}</p>
        
        <p><strong>Bu bağlantı 1 saat boyunca geçerlidir.</strong></p>
        
        <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        
        <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
        
        <p style='font-size: 12px; color: #666;'>
            İyi çalışmalar,<br>
            Forte Tourism IT Ekibi<br>
            <a href='http://corporate.forte.works'>corporate.forte.works</a>
        </p>
    </div>
</body>
</html>";

    // E-posta headers (HTML)
    $headers = [
        'From: Forte Tourism <noreply@forte.works>',
        'Reply-To: noreply@forte.works',
        'X-Mailer: PHP/' . phpversion(),
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8'
    ];
    
    // E-posta gönder
    $emailSent = mail($email, $emailSubject, $emailBody, implode("\r\n", $headers));
    
    // Log dosyasına yaz
    $logEntry = date('Y-m-d H:i:s') . " - Password reset requested for: {$email}\n";
    $logEntry .= "Reset URL: {$resetUrl}\n";
    $logEntry .= "Expires at: {$expiresAt}\n";
    $logEntry .= "Email sent: " . ($emailSent ? 'YES' : 'NO') . "\n\n";
    
    // Logs klasörü yoksa oluştur
    $logDir = '../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    file_put_contents($logDir . '/password_resets.log', $logEntry, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => true,
        'message' => $emailSent ? 
            'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' : 
            'E-posta gönderilmeye çalışıldı. Lütfen gelen/spam kutunuzu kontrol edin.',
        // Geliştirme amaçlı
        'debug_info' => [
            'reset_url' => $resetUrl,
            'expires_at' => $expiresAt,
            'email_sent' => $emailSent
        ]
    ]);
    
} catch (Exception $e) {
    // Hata logla
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası oluştu']);
}
?>