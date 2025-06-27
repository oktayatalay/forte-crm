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
$token = $input['token'] ?? '';
$password = $input['password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

if (empty($token) || empty($password) || empty($confirmPassword)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tüm alanlar gerekli']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'Şifreler eşleşmiyor']);
    exit;
}

// Güçlü şifre kontrolleri
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Şifre en az 8 karakter olmalıdır']);
    exit;
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Token'ı kontrol et
    $stmt = $db->prepare("
        SELECT apr.id, apr.admin_id, au.email, au.full_name 
        FROM admin_password_resets apr
        JOIN admin_users au ON apr.admin_id = au.id
        WHERE apr.reset_token = ? AND apr.expires_at > NOW() AND au.is_active = 1
    ");
    $stmt->execute([$token]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['error' => 'Geçersiz veya süresi dolmuş token']);
        exit;
    }
    
    // Şifreyi hash'le
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Admin şifresini güncelle
    $stmt = $db->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$passwordHash, $reset['admin_id']]);
    
    // Reset token'ını sil
    $stmt = $db->prepare("DELETE FROM admin_password_resets WHERE id = ?");
    $stmt->execute([$reset['id']]);
    
    // Tüm admin session'larını sonlandır (güvenlik için)
    $stmt = $db->prepare("DELETE FROM admin_sessions WHERE admin_id = ?");
    $stmt->execute([$reset['admin_id']]);
    
    // Log kaydı
    $logEntry = date('Y-m-d H:i:s') . " - Password reset completed for: {$reset['email']}\n";
    file_put_contents('../logs/password_resets.log', $logEntry, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => true,
        'message' => 'Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>