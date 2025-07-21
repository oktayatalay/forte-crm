<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../init.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get all active departments with hierarchy information
    $stmt = $db->prepare("
        SELECT 
            d.id,
            d.name,
            d.description,
            d.parent_id,
            parent_dept.name as parent_name,
            parent_dept.parent_id as grandparent_id,
            grandparent_dept.name as grandparent_name
        FROM departments d
        LEFT JOIN departments parent_dept ON d.parent_id = parent_dept.id
        LEFT JOIN departments grandparent_dept ON parent_dept.parent_id = grandparent_dept.id
        WHERE d.id IS NOT NULL
        ORDER BY d.parent_id IS NULL DESC, parent_dept.name ASC, d.name ASC
    ");
    
    $stmt->execute();
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'departments' => $departments
    ]);
    
} catch (Exception $e) {
    error_log("Get departments error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode(['error' => 'Departmanlar alınırken bir hata oluştu.']);
}
?>