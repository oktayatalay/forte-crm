<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$code = trim($input['code'] ?? '');

// Input validation
if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email ve kod alanları gereklidir']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçerli bir email adresi giriniz']);
    exit;
}

if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Kod 6 haneli olmalıdır']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Kodu doğrula
    $stmt = $db->prepare("
        SELECT id FROM auth_codes 
        WHERE email = ? AND code = ? AND expires_at > NOW() AND used = FALSE
    ");
    $stmt->execute([$email, $code]);
    $auth_record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$auth_record) {
        http_response_code(400);
        echo json_encode(['error' => 'Geçersiz veya süresi dolmuş kod']);
        exit;
    }
    
    // Kodu kullanıldı olarak işaretle
    $mark_used = $db->prepare("UPDATE auth_codes SET used = TRUE WHERE id = ?");
    $mark_used->execute([$auth_record['id']]);
    
    // Kullanıcıyı bul veya oluştur
    $user_stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $user_stmt->execute([$email]);
    $user = $user_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Yeni kullanıcı oluştur
        $create_user = $db->prepare("INSERT INTO users (email) VALUES (?)");
        $create_user->execute([$email]);
        $user_id = $db->lastInsertId();
        
        $user = [
            'id' => $user_id,
            'email' => $email,
            'name' => null,
            'title' => null,
            'mobile_phone_1' => null,
            'mobile_phone_2' => null
        ];
    }
    
    // Session token oluştur
    $session_token = bin2hex(random_bytes(32));
    
    // Eski session'ları temizle
    $cleanup_sessions = $db->prepare("DELETE FROM sessions WHERE user_id = ? OR expires_at < NOW()");
    $cleanup_sessions->execute([$user['id']]);
    
    // Yeni session oluştur (24 saat geçerli)
    $create_session = $db->prepare("
        INSERT INTO sessions (user_id, session_token, expires_at) 
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
    ");
    $create_session->execute([$user['id'], $session_token]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Giriş başarılı',
        'session_token' => $session_token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'title' => $user['title'],
            'mobile_phone_1' => $user['mobile_phone_1'],
            'mobile_phone_2' => $user['mobile_phone_2']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>