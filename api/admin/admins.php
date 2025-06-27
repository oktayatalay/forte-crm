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
    
    // Sadece süperadmin admin yönetimi yapabilir
    if ($admin['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Bu işlem için süperadmin yetkisi gerekli']);
        exit;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Tüm adminleri getir
            $stmt = $db->prepare("
                SELECT 
                    id, 
                    email, 
                    full_name, 
                    role, 
                    is_active, 
                    created_at, 
                    last_login 
                FROM admin_users 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'admins' => $admins
            ]);
            break;
            
        case 'POST':
            // Yeni admin ekle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['email'] || !$input['password']) {
                http_response_code(400);
                echo json_encode(['error' => 'E-posta ve şifre gerekli']);
                exit;
            }
            
            // E-posta benzersizlik kontrolü
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu e-posta adresi zaten kullanımda']);
                exit;
            }
            
            // Şifreyi hash'le
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            
            $stmt = $db->prepare("
                INSERT INTO admin_users (
                    email, 
                    full_name, 
                    password_hash, 
                    role, 
                    is_active
                ) VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['email'],
                $input['full_name'] ?? '',
                $passwordHash,
                $input['role'] ?? 'admin',
                $input['is_active'] ?? 1
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Admin başarıyla eklendi',
                'admin_id' => $db->lastInsertId()
            ]);
            break;
            
        case 'PUT':
            // Admin güncelle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id'] || !$input['email']) {
                http_response_code(400);
                echo json_encode(['error' => 'Admin ID ve e-posta adresi gerekli']);
                exit;
            }
            
            // E-posta benzersizlik kontrolü (kendi ID'si hariç)
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ? AND id != ?");
            $stmt->execute([$input['email'], $input['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu e-posta adresi zaten kullanımda']);
                exit;
            }
            
            // Şifre güncelleme kontrolü
            if (!empty($input['password'])) {
                $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $db->prepare("
                    UPDATE admin_users SET 
                        email = ?, 
                        full_name = ?, 
                        password_hash = ?, 
                        role = ?, 
                        is_active = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $input['email'],
                    $input['full_name'] ?? '',
                    $passwordHash,
                    $input['role'] ?? 'admin',
                    $input['is_active'] ?? 1,
                    $input['id']
                ]);
            } else {
                $stmt = $db->prepare("
                    UPDATE admin_users SET 
                        email = ?, 
                        full_name = ?, 
                        role = ?, 
                        is_active = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $input['email'],
                    $input['full_name'] ?? '',
                    $input['role'] ?? 'admin',
                    $input['is_active'] ?? 1,
                    $input['id']
                ]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Admin başarıyla güncellendi'
            ]);
            break;
            
        case 'DELETE':
            // Admin sil
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Admin ID gerekli']);
                exit;
            }
            
            // Kendi kendini silmeyi engelle
            if ($input['id'] == $admin['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Kendi hesabınızı silemezsiniz']);
                exit;
            }
            
            // İlgili session'ları temizle
            $stmt = $db->prepare("DELETE FROM admin_sessions WHERE admin_id = ?");
            $stmt->execute([$input['id']]);
            
            // Admin'i sil
            $stmt = $db->prepare("DELETE FROM admin_users WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Admin başarıyla silindi'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Admin bulunamadı']);
            }
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