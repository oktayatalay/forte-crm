<?php
require_once 'database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Şifreyi doğru şekilde hash'le
    $email = 'oktay.atalay@fortetourism.com';
    $password = 'fortepanel';
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "📧 E-posta: $email\n";
    echo "🔐 Şifre: $password\n";
    echo "🔒 Hash: $passwordHash\n\n";
    
    // Admin kullanıcısını güncelle veya ekle
    $stmt = $db->prepare("
        INSERT INTO admin_users (email, password_hash, full_name, role) 
        VALUES (?, ?, 'Oktay Atalay', 'superadmin')
        ON DUPLICATE KEY UPDATE 
            password_hash = VALUES(password_hash),
            role = VALUES(role),
            is_active = 1
    ");
    
    if ($stmt->execute([$email, $passwordHash])) {
        echo "✅ Süperadmin kullanıcısı başarıyla güncellendi!\n";
        echo "✅ Giriş bilgileri:\n";
        echo "   E-posta: $email\n";
        echo "   Şifre: $password\n";
        
        // Doğrulama yapalım
        $stmt = $db->prepare("SELECT id, email, password_hash, full_name, role FROM admin_users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            echo "✅ Şifre doğrulaması başarılı!\n";
        } else {
            echo "❌ Şifre doğrulaması başarısız!\n";
        }
        
    } else {
        echo "❌ Kullanıcı güncellenemedi!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
}
?>