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
            // Tüm kullanıcıları getir - departman bilgisi ile birlikte
            $stmt = $db->prepare("
                SELECT 
                    u.id, 
                    u.email, 
                    u.name, 
                    u.title, 
                    u.mobile_phone_1, 
                    u.mobile_phone_2, 
                    u.offices, 
                    u.department_id,
                    d.name as department_name,
                    u.gender,
                    u.birth_date,
                    u.city,
                    u.address,
                    u.created_at
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                ORDER BY u.name ASC
            ");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // offices JSON string'ini array'e çevir
            foreach ($users as &$user) {
                if ($user['offices']) {
                    $user['offices'] = json_decode($user['offices'], true);
                }
            }
            
            // Departmanları da getir dropdown için
            $stmt = $db->prepare("SELECT id, name FROM departments WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'users' => $users,
                'departments' => $departments
            ]);
            break;
            
        case 'POST':
            // Yeni kullanıcı ekle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['email']) {
                http_response_code(400);
                echo json_encode(['error' => 'E-posta adresi gerekli']);
                exit;
            }
            
            // E-posta benzersizlik kontrolü
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu e-posta adresi zaten kullanımda']);
                exit;
            }
            
            $stmt = $db->prepare("
                INSERT INTO users (
                    email, 
                    name, 
                    title, 
                    mobile_phone_1, 
                    mobile_phone_2, 
                    offices,
                    department_id,
                    gender,
                    birth_date,
                    city,
                    address
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $offices = isset($input['offices']) ? json_encode($input['offices']) : null;
            
            $stmt->execute([
                $input['email'],
                $input['name'] ?? null,
                $input['title'] ?? null,
                $input['mobile_phone_1'] ?? null,
                $input['mobile_phone_2'] ?? null,
                $offices,
                $input['department_id'] ?? null,
                $input['gender'] ?? null,
                $input['birth_date'] ?? null,
                $input['city'] ?? null,
                $input['address'] ?? null
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Kullanıcı başarıyla eklendi',
                'user_id' => $db->lastInsertId()
            ]);
            break;
            
        case 'PUT':
            // Kullanıcı güncelle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id'] || !$input['email']) {
                http_response_code(400);
                echo json_encode(['error' => 'Kullanıcı ID ve e-posta adresi gerekli']);
                exit;
            }
            
            // E-posta benzersizlik kontrolü (kendi ID'si hariç)
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$input['email'], $input['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu e-posta adresi zaten kullanımda']);
                exit;
            }
            
            $stmt = $db->prepare("
                UPDATE users SET 
                    email = ?, 
                    name = ?, 
                    title = ?, 
                    mobile_phone_1 = ?, 
                    mobile_phone_2 = ?, 
                    offices = ?,
                    department_id = ?,
                    gender = ?,
                    birth_date = ?,
                    city = ?,
                    address = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            
            $offices = isset($input['offices']) ? json_encode($input['offices']) : null;
            
            $stmt->execute([
                $input['email'],
                $input['name'] ?? null,
                $input['title'] ?? null,
                $input['mobile_phone_1'] ?? null,
                $input['mobile_phone_2'] ?? null,
                $offices,
                $input['department_id'] ?? null,
                $input['gender'] ?? null,
                $input['birth_date'] ?? null,
                $input['city'] ?? null,
                $input['address'] ?? null,
                $input['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Kullanıcı başarıyla güncellendi'
            ]);
            break;
            
        case 'DELETE':
            // Kullanıcı sil
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Kullanıcı ID gerekli']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Kullanıcı başarıyla silindi'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Kullanıcı bulunamadı']);
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