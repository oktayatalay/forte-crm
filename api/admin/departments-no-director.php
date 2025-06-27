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
            // Mevcut kolon yapısını kontrol et
            $stmt = $db->prepare("SHOW COLUMNS FROM departments");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $hasDirectorId = false;
            $hasIsActive = false;
            $hasDescription = false;
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'director_id') $hasDirectorId = true;
                if ($column['Field'] === 'is_active') $hasIsActive = true;
                if ($column['Field'] === 'description') $hasDescription = true;
            }
            
            // Dinamik sorgu oluştur
            $selectFields = "d.id, d.name";
            
            if ($hasDescription) {
                $selectFields .= ", d.description";
            } else {
                $selectFields .= ", '' as description";
            }
            
            if ($hasDirectorId) {
                $selectFields .= ", d.director_id, u.name as director_name, u.email as director_email";
                $joinClause = "LEFT JOIN users u ON d.director_id = u.id";
            } else {
                $selectFields .= ", NULL as director_id, NULL as director_name, NULL as director_email";
                $joinClause = "";
            }
            
            if ($hasIsActive) {
                $selectFields .= ", d.is_active";
            } else {
                $selectFields .= ", 1 as is_active";
            }
            
            $selectFields .= ", d.created_at";
            
            // Çalışan sayısı için subquery (department_id kolonu varsa)
            $stmt2 = $db->prepare("SHOW COLUMNS FROM users LIKE 'department_id'");
            $stmt2->execute();
            $hasUserDeptId = $stmt2->rowCount() > 0;
            
            if ($hasUserDeptId) {
                $selectFields .= ", (SELECT COUNT(*) FROM users WHERE department_id = d.id) as employee_count";
            } else {
                $selectFields .= ", 0 as employee_count";
            }
            
            $query = "SELECT {$selectFields} FROM departments d {$joinClause} ORDER BY d.name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Potansiyel direktörler listesi
            $availableDirectors = [];
            if ($hasUserDeptId) {
                $stmt = $db->prepare("
                    SELECT id, name, email, title 
                    FROM users 
                    WHERE department_id IS NULL OR department_id = 0
                    ORDER BY name ASC
                ");
                $stmt->execute();
                $availableDirectors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode([
                'success' => true,
                'departments' => $departments,
                'available_directors' => $availableDirectors,
                'table_info' => [
                    'has_director_id' => $hasDirectorId,
                    'has_is_active' => $hasIsActive,
                    'has_description' => $hasDescription,
                    'has_user_dept_id' => $hasUserDeptId
                ]
            ]);
            break;
            
        case 'POST':
            // Yeni departman ekle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['name']) {
                http_response_code(400);
                echo json_encode(['error' => 'Departman adı gerekli']);
                exit;
            }
            
            // Mevcut kolonları kontrol et
            $stmt = $db->prepare("SHOW COLUMNS FROM departments");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $availableColumns = [];
            foreach ($columns as $column) {
                $availableColumns[] = $column['Field'];
            }
            
            // Dinamik INSERT sorgusu
            $insertFields = ['name'];
            $insertValues = [$input['name']];
            $placeholders = ['?'];
            
            if (in_array('description', $availableColumns) && isset($input['description'])) {
                $insertFields[] = 'description';
                $insertValues[] = $input['description'];
                $placeholders[] = '?';
            }
            
            if (in_array('director_id', $availableColumns) && isset($input['director_id'])) {
                $insertFields[] = 'director_id';
                $insertValues[] = $input['director_id'] ?: null;
                $placeholders[] = '?';
            }
            
            if (in_array('is_active', $availableColumns)) {
                $insertFields[] = 'is_active';
                $insertValues[] = $input['is_active'] ?? 1;
                $placeholders[] = '?';
            }
            
            $query = "INSERT INTO departments (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $placeholders) . ")";
            
            $stmt = $db->prepare($query);
            $stmt->execute($insertValues);
            
            echo json_encode([
                'success' => true,
                'message' => 'Departman başarıyla eklendi',
                'department_id' => $db->lastInsertId()
            ]);
            break;
            
        case 'PUT':
            // Departman güncelle
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id'] || !$input['name']) {
                http_response_code(400);
                echo json_encode(['error' => 'Departman ID ve adı gerekli']);
                exit;
            }
            
            // Mevcut kolonları kontrol et
            $stmt = $db->prepare("SHOW COLUMNS FROM departments");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $availableColumns = [];
            foreach ($columns as $column) {
                $availableColumns[] = $column['Field'];
            }
            
            // Dinamik UPDATE sorgusu
            $updateParts = ['name = ?'];
            $updateValues = [$input['name']];
            
            if (in_array('description', $availableColumns)) {
                $updateParts[] = 'description = ?';
                $updateValues[] = $input['description'] ?? null;
            }
            
            if (in_array('director_id', $availableColumns)) {
                $updateParts[] = 'director_id = ?';
                $updateValues[] = $input['director_id'] ?: null;
            }
            
            if (in_array('is_active', $availableColumns)) {
                $updateParts[] = 'is_active = ?';
                $updateValues[] = $input['is_active'] ?? 1;
            }
            
            $updateValues[] = $input['id'];
            
            $query = "UPDATE departments SET " . implode(', ', $updateParts) . " WHERE id = ?";
            
            $stmt = $db->prepare($query);
            $stmt->execute($updateValues);
            
            echo json_encode([
                'success' => true,
                'message' => 'Departman başarıyla güncellendi'
            ]);
            break;
            
        case 'DELETE':
            // Departman sil
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Departman ID gerekli']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM departments WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Departman başarıyla silindi'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Departman bulunamadı']);
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