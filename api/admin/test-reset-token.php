<?php
header('Content-Type: application/json');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Mevcut tokenları kontrol et
    $stmt = $db->prepare("
        SELECT apr.*, au.email, au.full_name,
               NOW() as now_time,
               apr.expires_at,
               (apr.expires_at > NOW()) as is_valid
        FROM admin_password_resets apr
        JOIN admin_users au ON apr.admin_id = au.id
        ORDER BY apr.id DESC
        LIMIT 5
    ");
    $stmt->execute();
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Yeni token oluştur
    $email = 'oktay.atalay@fortetourism.com';
    $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        // Eski tokenları temizle
        $stmt = $db->prepare("DELETE FROM admin_password_resets WHERE admin_id = ?");
        $stmt->execute([$admin['id']]);
        
        // Yeni token oluştur
        $newToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $stmt = $db->prepare("
            INSERT INTO admin_password_resets (admin_id, reset_token, expires_at) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$admin['id'], $newToken, $expiresAt]);
        
        echo json_encode([
            'success' => true,
            'old_tokens' => $tokens,
            'new_token' => $newToken,
            'expires_at' => $expiresAt,
            'current_time' => date('Y-m-d H:i:s'),
            'reset_url' => "http://corporate.forte.works/admin/reset-password?token=" . $newToken
        ], JSON_PRETTY_PRINT);
    } else {
        echo json_encode(['error' => 'Admin bulunamadı']);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>