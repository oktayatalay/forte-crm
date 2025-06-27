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
    
    // E-posta gönderme simülasyonu (gerçek ortamda mail fonksiyonu kullanılacak)
    $emailSubject = "Forte Tourism - Şifre Sıfırlama";
    $emailBody = "
Merhaba {$admin['full_name']},

Forte Tourism Admin Panel şifre sıfırlama talebiniz alınmıştır.

Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
{$resetUrl}

Bu bağlantı 1 saat boyunca geçerlidir.

Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

İyi çalışmalar,
Forte Tourism IT Ekibi
    ";
    
    // E-posta gönderimi
    $headers = [
        'From: noreply@forte.works',
        'Reply-To: noreply@forte.works',
        'X-Mailer: PHP/' . phpversion(),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8'
    ];
    
    $emailSent = mail($email, $emailSubject, $emailBody, implode("\r\n", $headers));
    
    // Log dosyasına da yaz
    $logEntry = date('Y-m-d H:i:s') . " - Password reset requested for: {$email}\n";
    $logEntry .= "Reset URL: {$resetUrl}\n";
    $logEntry .= "Expires at: {$expiresAt}\n";
    $logEntry .= "Email sent: " . ($emailSent ? 'YES' : 'NO') . "\n\n";
    file_put_contents('../logs/password_resets.log', $logEntry, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => true,
        'message' => $emailSent ? 
            'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' : 
            'E-posta gönderildi ancak doğrulama yapılamadı. Lütfen gelen kutunuzu kontrol edin.',
        // Geliştirme amaçlı (üretimde kaldırılacak)
        'debug_info' => [
            'reset_url' => $resetUrl,
            'expires_at' => $expiresAt,
            'email_sent' => $emailSent
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>