<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config/database.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database config error: ' . $e->getMessage()]);
    exit;
}

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

// Input validation
$name = trim($input['name'] ?? '');
$title = trim($input['title'] ?? '');
$mobile_phone_1 = trim($input['mobile_phone_1'] ?? '');
$mobile_phone_2 = trim($input['mobile_phone_2'] ?? '');
$offices = $input['offices'] ?? [];
$gender = trim($input['gender'] ?? '');
$birth_date = trim($input['birth_date'] ?? '');
$city = trim($input['city'] ?? '');
$address = trim($input['address'] ?? '');
$department_id = $input['department_id'] ?? null;

// Validate gender
if ($gender && !in_array($gender, ['male', 'female', 'other'])) {
    $gender = null;
}

// Validate birth_date
if ($birth_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birth_date)) {
    $birth_date = null;
}

// Validate department_id
if ($department_id && !is_numeric($department_id)) {
    $department_id = null;
}

// Debug logging
error_log("Received offices: " . json_encode($offices));

// Offices validation - veritabanından geçerli ofisleri al
$valid_offices = [];
$offices_stmt = $db->prepare("SELECT code FROM offices WHERE is_active = TRUE");
$offices_stmt->execute();
while ($office_row = $offices_stmt->fetch(PDO::FETCH_ASSOC)) {
    $valid_offices[] = $office_row['code'];
}

$offices = array_filter($offices, function($office) use ($valid_offices) {
    return in_array($office, $valid_offices);
});
$offices_json = !empty($offices) ? json_encode(array_values($offices)) : null;

error_log("Filtered offices: " . json_encode($offices));
error_log("Final offices JSON: " . $offices_json);

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
    
    // Profil bilgilerini güncelle
    $update_stmt = $db->prepare("
        UPDATE users 
        SET name = ?, title = ?, mobile_phone_1 = ?, mobile_phone_2 = ?, offices = ?, 
            gender = ?, birth_date = ?, city = ?, address = ?, department_id = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    if ($update_stmt->execute([$name, $title, $mobile_phone_1, $mobile_phone_2, $offices_json, 
                              $gender, $birth_date, $city, $address, $department_id, $user_id])) {
        // Güncellenmiş kullanıcı bilgilerini getir
        $user_stmt = $db->prepare("
            SELECT u.id, u.email, u.name, u.title, u.mobile_phone_1, u.mobile_phone_2, 
                   u.offices, u.gender, u.birth_date, u.city, u.address, u.department_id, u.user_image,
                   d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        ");
        $user_stmt->execute([$user_id]);
        $updated_user = $user_stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Profil bilgileri güncellendi',
            'user' => $updated_user
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Profil güncellenemedi']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>