<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    
    // Bearer token'ı ayıkla
    if (strpos($token, 'Bearer ') === 0) {
        $token = substr($token, 7);
    }
    
    $stmt = $db->prepare("
        SELECT au.id, au.email, au.full_name, au.role 
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
    
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $admin = verifyAdminSession($db, $authHeader);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Yetki yok']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Sadece POST metodu desteklenir']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input['smtp_host'] || !$input['smtp_port'] || !$input['smtp_username']) {
        http_response_code(400);
        echo json_encode(['error' => 'SMTP bilgileri eksik']);
        exit;
    }
    
    // SMTP bağlantısını test et
    $host = $input['smtp_host'];
    $port = intval($input['smtp_port']);
    $username = $input['smtp_username'];
    $password = $input['smtp_password'] ?? '';
    $ssl = $input['smtp_ssl'] ?? 1;
    
    // Basit bağlantı testi
    $context = stream_context_create();
    
    if ($ssl) {
        $connection = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
    } else {
        $connection = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
    }
    
    if (!$connection) {
        echo json_encode([
            'success' => false,
            'error' => "Bağlantı kurulamadı: {$errstr} ({$errno})"
        ]);
        exit;
    }
    
    // Bağlantı başarılı
    fclose($connection);
    
    echo json_encode([
        'success' => true,
        'message' => 'SMTP bağlantısı başarılı'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>