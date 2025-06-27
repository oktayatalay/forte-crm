<?php
// UTF-8 encoding ayarları
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

// Session token kontrolü
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (strpos($authHeader, 'Bearer ') === 0) {
    $sessionToken = substr($authHeader, 7);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Session'ı doğrula
    $stmt = $db->prepare("
        SELECT a.id, a.role 
        FROM admin_sessions s 
        JOIN admin_users a ON s.admin_id = a.id 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND a.is_active = 1
    ");
    $stmt->execute([$sessionToken]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz session']);
        exit;
    }
    
    // İstatistikleri topla
    
    // Toplam kullanıcı sayısı
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users");
    $stmt->execute();
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Toplam admin sayısı
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM admin_users WHERE is_active = 1");
    $stmt->execute();
    $totalAdmins = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Toplam departman sayısı
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM departments WHERE is_active = 1");
    $stmt->execute();
    $totalDepartments = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Son 24 saatteki giriş sayısı (normal kullanıcılar)
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT user_id) as total 
        FROM sessions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $stmt->execute();
    $recentLogins = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stats = [
        'total_users' => (int)$totalUsers,
        'total_admins' => (int)$totalAdmins,
        'total_departments' => (int)$totalDepartments,
        'recent_logins' => (int)$recentLogins
    ];
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}
?>