<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Session token kontrolü
$headers = getallheaders();
$session_token = $headers['Authorization'] ?? '';

if (strpos($session_token, 'Bearer ') === 0) {
    $session_token = substr($session_token, 7);
}

if (empty($session_token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['image_data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Görsel verisi gerekli']);
    exit;
}

$imageData = $input['image_data'];

// Validate base64 image
if (!str_starts_with($imageData, 'data:image/')) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz görsel formatı']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Session'ı doğrula ve user_id al
    $session_stmt = $db->prepare("
        SELECT u.id, u.email 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.session_token = ? AND s.expires_at > NOW()
    ");
    $session_stmt->execute([$session_token]);
    $session_result = $session_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session_result) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz session']);
        exit;
    }
    
    $user_id = $session_result['id'];
    
    // Kullanıcının fotoğrafını güncelle
    $update_stmt = $db->prepare("UPDATE users SET user_image = ? WHERE id = ?");
    
    if ($update_stmt->execute([$imageData, $user_id])) {
        echo json_encode([
            'success' => true,
            'message' => 'Profil fotoğrafı başarıyla güncellendi'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Fotoğraf güncellenemedi']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>