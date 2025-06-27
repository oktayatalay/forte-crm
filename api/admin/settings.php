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
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Ayarları getir
            $stmt = $db->prepare("SELECT setting_key, setting_value FROM system_settings");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            
            echo json_encode([
                'success' => true,
                'settings' => $settings
            ]);
            break;
            
        case 'POST':
            // Ayarları kaydet
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['type']) {
                http_response_code(400);
                echo json_encode(['error' => 'Ayar tipi gerekli']);
                exit;
            }
            
            $type = $input['type'];
            unset($input['type']);
            
            // Her ayar için upsert işlemi yap
            $stmt = $db->prepare("
                INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at) 
                VALUES (?, ?, NOW(), NOW()) 
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            
            foreach ($input as $key => $value) {
                $stmt->execute([$key, $value]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Ayarlar başarıyla kaydedildi'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Desteklenmeyen HTTP metodu']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>