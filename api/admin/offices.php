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
            // Ofisleri getir
            $stmt = $db->prepare("
                SELECT id, code, name, address, phone, is_active, sort_order, created_at, updated_at 
                FROM offices 
                ORDER BY sort_order ASC, name ASC
            ");
            $stmt->execute();
            $offices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'offices' => $offices
            ]);
            break;
            
        case 'POST':
            // Yeni ofis ekle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['name'] || !$input['code']) {
                http_response_code(400);
                echo json_encode(['error' => 'Ofis adı ve kodu gerekli']);
                exit;
            }
            
            // Kod benzersizlik kontrolü
            $stmt = $db->prepare("SELECT id FROM offices WHERE code = ?");
            $stmt->execute([$input['code']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu ofis kodu zaten kullanılıyor']);
                exit;
            }
            
            // Sıralama değeri ayarla
            if (!isset($input['sort_order']) || $input['sort_order'] === '') {
                $stmt = $db->prepare("SELECT MAX(sort_order) as max_order FROM offices");
                $stmt->execute();
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $input['sort_order'] = ($result['max_order'] ?? 0) + 1;
            }
            
            $stmt = $db->prepare("
                INSERT INTO offices (code, name, address, phone, is_active, sort_order) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['code'],
                $input['name'],
                $input['address'] ?? '',
                $input['phone'] ?? '',
                $input['is_active'] ?? 1,
                $input['sort_order']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Ofis başarıyla eklendi',
                'office_id' => $db->lastInsertId()
            ]);
            break;
            
        case 'PUT':
            // Ofis güncelle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id'] || !$input['name'] || !$input['code']) {
                http_response_code(400);
                echo json_encode(['error' => 'Ofis ID, adı ve kodu gerekli']);
                exit;
            }
            
            // Kod benzersizlik kontrolü (mevcut ofis hariç)
            $stmt = $db->prepare("SELECT id FROM offices WHERE code = ? AND id != ?");
            $stmt->execute([$input['code'], $input['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu ofis kodu zaten kullanılıyor']);
                exit;
            }
            
            $stmt = $db->prepare("
                UPDATE offices 
                SET code = ?, name = ?, address = ?, phone = ?, is_active = ?, sort_order = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([
                $input['code'],
                $input['name'],
                $input['address'] ?? '',
                $input['phone'] ?? '',
                $input['is_active'] ?? 1,
                $input['sort_order'] ?? 0,
                $input['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Ofis başarıyla güncellendi'
            ]);
            break;
            
        case 'DELETE':
            // Ofis sil
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Ofis ID gerekli']);
                exit;
            }
            
            // Ofisi kullanan kullanıcı var mı kontrol et
            $stmt = $db->prepare("
                SELECT COUNT(*) as user_count 
                FROM users 
                WHERE JSON_CONTAINS(offices, JSON_QUOTE(?))
            ");
            $stmt->execute([$input['code'] ?? '']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['user_count'] > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Bu ofis kullanıcılar tarafından kullanılıyor, silemezsiniz']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM offices WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Ofis başarıyla silindi'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Ofis bulunamadı']);
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