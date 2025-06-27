<?php
// UTF-8 encoding ayarları
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'E-posta ve şifre gerekli']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Admin kullanıcıyı bul
    $stmt = $db->prepare("
        SELECT id, email, password_hash, full_name, role, is_active 
        FROM admin_users 
        WHERE email = ? AND is_active = 1
    ");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz e-posta veya şifre']);
        exit;
    }
    
    // Session token oluştur
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Eski session'ları temizle
    $stmt = $db->prepare("DELETE FROM admin_sessions WHERE admin_id = ?");
    $stmt->execute([$admin['id']]);
    
    // Yeni session ekle
    $stmt = $db->prepare("
        INSERT INTO admin_sessions (admin_id, session_token, expires_at) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$admin['id'], $sessionToken, $expiresAt]);
    
    // Son giriş zamanını güncelle
    $stmt = $db->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$admin['id']]);
    
    // Şifre hash'ini response'dan çıkar
    unset($admin['password_hash']);
    
    echo json_encode([
        'success' => true,
        'token' => $sessionToken,
        'admin' => $admin,
        'expires_at' => $expiresAt
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>