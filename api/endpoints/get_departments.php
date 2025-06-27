<?php
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
    
    // Get all active departments
    $stmt = $db->prepare("
        SELECT 
            id,
            name,
            description
        FROM departments 
        WHERE id IS NOT NULL
        ORDER BY name ASC
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