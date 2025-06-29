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
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['user_id']) || !isset($input['image_data'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Kullanıcı ID ve görsel verisi gerekli']);
            exit;
        }
        
        $userId = (int)$input['user_id'];
        $imageData = $input['image_data'];
        
        // Validate base64 image
        if (!str_starts_with($imageData, 'data:image/')) {
            http_response_code(400);
            echo json_encode(['message' => 'Geçersiz görsel formatı']);
            exit;
        }
        
        // Check if user exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['message' => 'Kullanıcı bulunamadı']);
            exit;
        }
        
        // Update user image
        $stmt = $conn->prepare("UPDATE users SET user_image = ? WHERE id = ?");
        $stmt->execute([$imageData, $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Kullanıcı fotoğrafı başarıyla güncellendi'
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