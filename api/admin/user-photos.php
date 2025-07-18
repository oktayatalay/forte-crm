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
        
        // Build 3-level hierarchy: Level 1 (hidden) -> Level 2 (cards) -> Level 3 (sections)
        $departments = [];
        
        // Function to recursively build department hierarchy
        function buildDepartmentHierarchy($departmentMap, $parentId = null) {
            $children = [];
            foreach ($departmentMap as $deptId => $dept) {
                if ($dept['parent_id'] == $parentId) {
                    $dept['subdepartments'] = buildDepartmentHierarchy($departmentMap, $deptId);
                    $children[] = $dept;
                }
            }
            return $children;
        }
        
        // Get all Level 1 departments (root level)
        $level1Departments = buildDepartmentHierarchy($departmentMap, null);
        
        // For user photos page, we want to show Level 1 and Level 2 as cards, Level 3 as sections
        foreach ($level1Departments as $level1Dept) {
            // First, add Level 1 department as a card if it has users
            if (count($level1Dept['users']) > 0) {
                $departments[] = [
                    'id' => $level1Dept['id'],
                    'name' => $level1Dept['name'],
                    'parent_id' => $level1Dept['parent_id'],
                    'parent_name' => $level1Dept['parent_name'],
                    'users' => $level1Dept['users'],
                    'subdepartments' => [] // Level 1 departments don't have subdepartments in card view
                ];
            }
            
            // Then, for each Level 1 department, get its Level 2 children as cards
            foreach ($level1Dept['subdepartments'] as $level2Dept) {
                // Level 2 becomes a card
                $cardDepartment = [
                    'id' => $level2Dept['id'],
                    'name' => $level2Dept['name'],
                    'parent_id' => $level2Dept['parent_id'],
                    'parent_name' => $level2Dept['parent_name'],
                    'users' => $level2Dept['users'],
                    'subdepartments' => $level2Dept['subdepartments'] // Level 3 departments become sections
                ];
                
                // Only include if there are users in Level 2 or its Level 3 subdepartments
                $totalUsers = count($cardDepartment['users']);
                foreach ($cardDepartment['subdepartments'] as $level3Dept) {
                    $totalUsers += count($level3Dept['users']);
                }
                
                if ($totalUsers > 0) {
                    $departments[] = $cardDepartment;
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