<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$headers = getallheaders();
$session_token = $headers['Authorization'] ?? '';

// Bearer token format kontrolü
if (strpos($session_token, 'Bearer ') === 0) {
    $session_token = substr($session_token, 7);
}

if (empty($session_token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Session'ı doğrula
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.name, u.title, u.mobile_phone_1, u.mobile_phone_2, u.offices,
               u.gender, u.birth_date, u.city, u.address, u.department_id, 
               d.name as department_name, s.expires_at 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE s.session_token = ? AND s.expires_at > NOW()
    ");
    $stmt->execute([$session_token]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz veya süresi dolmuş session']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $result['id'],
            'email' => $result['email'],
            'name' => $result['name'],
            'title' => $result['title'],
            'mobile_phone_1' => $result['mobile_phone_1'],
            'mobile_phone_2' => $result['mobile_phone_2'],
            'offices' => $result['offices'],
            'gender' => $result['gender'],
            'birth_date' => $result['birth_date'],
            'city' => $result['city'],
            'address' => $result['address'],
            'department_id' => $result['department_id'],
            'department_name' => $result['department_name']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>