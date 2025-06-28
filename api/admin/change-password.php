<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

// Admin session doğrulama fonksiyonu
function verifyAdminSession($db, $token) {
    if (!$token) {
        return false;
    }
    
    if (strpos($token, 'Bearer ') === 0) {
        $token = substr($token, 7);
    }
    
    $stmt = $db->prepare("
        SELECT au.id, au.email, au.full_name, au.role, au.password_hash
        FROM admin_users au 
        JOIN admin_sessions ases ON au.id = ases.admin_id 
        WHERE ases.session_token = ? AND ases.expires_at > NOW() AND au.is_active = 1
    ");
    $stmt->execute([$token]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Sadece POST metodu desteklenir']);
        exit;
    }
    
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $admin = verifyAdminSession($db, $authHeader);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Yetki yok']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input['current_password'] || !$input['new_password']) {
        http_response_code(400);
        echo json_encode(['error' => 'Mevcut şifre ve yeni şifre gerekli']);
        exit;
    }
    
    // Mevcut şifreyi doğrula
    if (!password_verify($input['current_password'], $admin['password_hash'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Mevcut şifre yanlış']);
        exit;
    }
    
    // Yeni şifre uzunluk kontrolü
    if (strlen($input['new_password']) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Şifre en az 6 karakter olmalıdır']);
        exit;
    }
    
    // Yeni şifreyi hash'le ve güncelle
    $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("
        UPDATE admin_users 
        SET password_hash = ?, updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$newPasswordHash, $admin['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Şifre başarıyla güncellendi'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>