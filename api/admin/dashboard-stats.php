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
    
    // Departman istatistikleri
    $stmt = $db->prepare("
        SELECT 
            d.id,
            d.name,
            COUNT(u.id) as user_count,
            ROUND((COUNT(u.id) * 100.0 / (SELECT COUNT(*) FROM users)), 1) as percentage
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        WHERE d.is_active = 1
        GROUP BY d.id, d.name
        HAVING user_count > 0
        ORDER BY user_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $departmentStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Haftalık giriş istatistikleri
    $stmt = $db->prepare("
        SELECT 
            DATE(created_at) as login_date,
            COUNT(DISTINCT user_id) as login_count
        FROM sessions 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY login_date ASC
    ");
    $stmt->execute();
    $weeklyStatsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Haftalık veriyi düzenle
    $weeklyStats = [];
    $daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $dayOfWeek = date('N', strtotime($date)) - 1;
        $dayName = $daysOfWeek[$dayOfWeek];
        
        $count = 0;
        foreach ($weeklyStatsRaw as $stat) {
            if ($stat['login_date'] === $date) {
                $count = (int)$stat['login_count'];
                break;
            }
        }
        
        $weeklyStats[] = [
            'day' => $dayName,
            'count' => $count,
            'percentage' => $count > 0 ? min(100, ($count * 4)) : 0
        ];
    }
    
    // Son aktiviteler (sample data - gerçek aktivite tablosu olsaydı)
    $recentActivities = [
        [
            'id' => 1,
            'activity_type' => 'user_login',
            'user_email' => 'ahmet.kaya@forte.works',
            'description' => 'Kullanıcı sisteme giriş yaptı',
            'created_at' => date('Y-m-d H:i:s', strtotime('-2 minutes'))
        ],
        [
            'id' => 2,
            'activity_type' => 'profile_update',
            'user_email' => 'mehmet.yilmaz@forte.works',
            'description' => 'Profil bilgileri güncellendi',
            'created_at' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
        ],
        [
            'id' => 3,
            'activity_type' => 'signature_created',
            'user_email' => 'ayse.demir@forte.works',
            'description' => 'Mail imzası oluşturuldu',
            'created_at' => date('Y-m-d H:i:s', strtotime('-12 minutes'))
        ]
    ];
    
    $stats = [
        'total_users' => (int)$totalUsers,
        'total_admins' => (int)$totalAdmins,
        'total_departments' => (int)$totalDepartments,
        'recent_logins' => (int)$recentLogins,
        'department_stats' => $departmentStats,
        'weekly_stats' => $weeklyStats,
        'recent_activities' => $recentActivities
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