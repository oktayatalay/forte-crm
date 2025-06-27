<?php
// UTF-8 encoding ayarları
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Session token kontrolü
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (strpos($authHeader, 'Bearer ') === 0) {
    $sessionToken = substr($authHeader, 7);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Session'ı doğrula
    $stmt = $db->prepare("
        SELECT a.id, a.email, a.full_name, a.role, a.is_active 
        FROM admin_sessions s 
        JOIN admin_users a ON s.admin_id = a.id 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND a.is_active = 1
    ");
    $stmt->execute([$sessionToken]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz veya süresi dolmuş session']);
        exit;
    }
    
    // Session süresini uzat
    $newExpiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
    $stmt = $db->prepare("UPDATE admin_sessions SET expires_at = ? WHERE session_token = ?");
    $stmt->execute([$newExpiresAt, $sessionToken]);
    
    echo json_encode([
        'success' => true,
        'admin' => $admin,
        'expires_at' => $newExpiresAt
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>