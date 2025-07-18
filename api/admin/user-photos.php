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
    
    // Verify admin session using existing session system
    $stmt = $conn->prepare("
        SELECT a.id, a.email, a.full_name, a.role, a.is_active 
        FROM admin_sessions s 
        JOIN admin_users a ON s.admin_id = a.id 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND a.is_active = 1
    ");
    $stmt->execute([$token]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['message' => 'Geçersiz veya süresi dolmuş session']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all departments with their hierarchy info
        $stmt = $conn->prepare("
            SELECT 
                d.id as department_id,
                d.name as department_name,
                d.parent_id,
                parent.name as parent_name,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.title as user_title,
                u.user_image
            FROM departments d
            LEFT JOIN departments parent ON d.parent_id = parent.id
            LEFT JOIN users u ON d.id = u.department_id
            WHERE d.is_active = 1
            ORDER BY d.parent_id IS NULL DESC, d.name ASC, u.name ASC
        ");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build department hierarchy
        $allDepartments = [];
        $departmentMap = [];
        
        // First, collect all departments with their basic info
        foreach ($results as $row) {
            $deptId = $row['department_id'];
            
            if (!isset($departmentMap[$deptId])) {
                $departmentMap[$deptId] = [
                    'id' => $deptId,
                    'name' => $row['department_name'],
                    'parent_id' => $row['parent_id'],
                    'parent_name' => $row['parent_name'],
                    'users' => [],
                    'subdepartments' => []
                ];
            }
            
            // Add user if exists
            if ($row['user_id']) {
                $departmentMap[$deptId]['users'][] = [
                    'id' => $row['user_id'],
                    'name' => $row['user_name'],
                    'email' => $row['user_email'],
                    'title' => $row['user_title'],
                    'department_id' => $deptId,
                    'user_image' => $row['user_image']
                ];
            }
        }
        
        // Now build the hierarchy - parent departments with their subdepartments
        $departments = [];
        
        foreach ($departmentMap as $deptId => $dept) {
            if (!$dept['parent_id']) {
                // This is a parent department
                $parentDept = $dept;
                $parentDept['subdepartments'] = [];
                
                // Find all subdepartments
                foreach ($departmentMap as $subDeptId => $subDept) {
                    if ($subDept['parent_id'] == $deptId) {
                        $parentDept['subdepartments'][] = $subDept;
                    }
                }
                
                // Only include if there are users in parent or subdepartments
                $totalUsers = count($parentDept['users']);
                foreach ($parentDept['subdepartments'] as $subDept) {
                    $totalUsers += count($subDept['users']);
                }
                
                if ($totalUsers > 0) {
                    $departments[] = $parentDept;
                }
            }
        }
        
        // Also include standalone departments (those without parents and no children)
        foreach ($departmentMap as $deptId => $dept) {
            if (!$dept['parent_id'] && count($dept['users']) > 0) {
                $hasChildren = false;
                foreach ($departmentMap as $otherDept) {
                    if ($otherDept['parent_id'] == $deptId) {
                        $hasChildren = true;
                        break;
                    }
                }
                
                if (!$hasChildren) {
                    // This department is already added above, skip
                    continue;
                }
            }
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