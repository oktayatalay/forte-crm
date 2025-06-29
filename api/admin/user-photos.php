<?php
require_once '../config/cors.php';
require_once '../config/database.php';

header('Content-Type: application/json');

// Verify admin session
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
    http_response_code(401);
    echo json_encode(['message' => 'Token gerekli']);
    exit;
}

$token = substr($authHeader, 7);

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Verify admin token
    $stmt = $conn->prepare("SELECT * FROM admin_users WHERE session_token = ? AND is_active = 1");
    $stmt->execute([$token]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['message' => 'Geçersiz token']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all departments with users
        $stmt = $conn->prepare("
            SELECT 
                d.id as department_id,
                d.name as department_name,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.title as user_title,
                u.user_image
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id
            WHERE u.id IS NOT NULL
            ORDER BY d.name ASC, u.name ASC
        ");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group users by department
        $departments = [];
        $departmentMap = [];
        
        foreach ($results as $row) {
            $deptId = $row['department_id'];
            
            if (!isset($departmentMap[$deptId])) {
                $departmentMap[$deptId] = count($departments);
                $departments[] = [
                    'id' => $deptId,
                    'name' => $row['department_name'],
                    'users' => []
                ];
            }
            
            $deptIndex = $departmentMap[$deptId];
            $departments[$deptIndex]['users'][] = [
                'id' => $row['user_id'],
                'name' => $row['user_name'],
                'email' => $row['user_email'],
                'title' => $row['user_title'],
                'department_id' => $deptId,
                'user_image' => $row['user_image']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'departments' => $departments
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>