<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Tüm kullanıcıları getir (kendisi hariç)
    $stmt = $db->prepare("
        SELECT id, email, name, title, mobile_phone_1, offices 
        FROM users 
        WHERE name IS NOT NULL 
        AND name != ''
        ORDER BY name ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $colleagues = [];
    foreach ($users as $user) {
        $offices = [];
        if ($user['offices']) {
            $offices = json_decode($user['offices'], true) ?: [];
        }
        
        $colleagues[] = [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'title' => $user['title'],
            'mobile_phone_1' => $user['mobile_phone_1'],
            'offices' => $offices
        ];
    }
    
    echo json_encode([
        'success' => true,
        'colleagues' => $colleagues
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>