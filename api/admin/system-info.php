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
    
    // Sistem bilgilerini topla
    $info = [];
    
    // PHP sürümü
    $info['php_version'] = phpversion();
    
    // MySQL sürümü
    try {
        $stmt = $db->query("SELECT VERSION() as version");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $info['db_version'] = 'MySQL ' . $result['version'];
    } catch (Exception $e) {
        $info['db_version'] = 'Bilinmiyor';
    }
    
    // Sunucu zamanı
    $info['server_time'] = date('Y-m-d H:i:s');
    
    // Toplam kullanıcı sayısı
    try {
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $info['total_users'] = $result['count'];
    } catch (Exception $e) {
        $info['total_users'] = 0;
    }
    
    // Toplam admin sayısı
    try {
        $stmt = $db->query("SELECT COUNT(*) as count FROM admin_users WHERE is_active = 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $info['total_admins'] = $result['count'];
    } catch (Exception $e) {
        $info['total_admins'] = 0;
    }
    
    // Toplam departman sayısı
    try {
        $stmt = $db->query("SELECT COUNT(*) as count FROM departments WHERE is_active = 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $info['total_departments'] = $result['count'];
    } catch (Exception $e) {
        $info['total_departments'] = 0;
    }
    
    echo json_encode([
        'success' => true,
        'info' => $info
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>