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
            // Profil bilgilerini getir
            $stmt = $db->prepare("
                SELECT id, email, full_name, role, is_active, created_at, last_login 
                FROM admin_users 
                WHERE id = ?
            ");
            $stmt->execute([$admin['id']]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$profile) {
                http_response_code(404);
                echo json_encode(['error' => 'Profil bulunamadı']);
                exit;
            }
            
            echo json_encode([
                'success' => true,
                'profile' => $profile
            ]);
            break;
            
        case 'PUT':
            // Profil güncelle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['email'] || !$input['full_name']) {
                http_response_code(400);
                echo json_encode(['error' => 'E-posta ve ad soyad gerekli']);
                exit;
            }
            
            // E-posta benzersizlik kontrolü (mevcut kullanıcı hariç)
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ? AND id != ?");
            $stmt->execute([$input['email'], $admin['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu e-posta adresi zaten kullanılıyor']);
                exit;
            }
            
            // Profil güncelle
            $stmt = $db->prepare("
                UPDATE admin_users 
                SET email = ?, full_name = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([
                $input['email'],
                $input['full_name'],
                $admin['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Profil başarıyla güncellendi'
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