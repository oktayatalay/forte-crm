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

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Token gerekli']);
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
    
    echo json_encode([
        'success' => true,
        'message' => 'Token geçerli',
        'admin_email' => $reset['email']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>