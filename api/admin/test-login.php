<?php
require_once '../config/database.php';

// Test için şifre hash'ini oluştur
$testPassword = 'fortepanel';
$testHash = password_hash($testPassword, PASSWORD_DEFAULT);

echo "🔐 Test Şifre: $testPassword\n";
echo "🔒 Test Hash: $testHash\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Mevcut admin kullanıcısını kontrol et
    $stmt = $db->prepare("SELECT id, email, password_hash, full_name, role FROM admin_users WHERE email = ?");
    $stmt->execute(['oktay.atalay@fortetourism.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "👤 Kullanıcı bulundu:\n";
        echo "   ID: " . $user['id'] . "\n";
        echo "   E-posta: " . $user['email'] . "\n";
        echo "   Ad: " . $user['full_name'] . "\n";
        echo "   Rol: " . $user['role'] . "\n";
        echo "   Hash: " . $user['password_hash'] . "\n\n";
        
        // Şifre doğrulaması
        if (password_verify($testPassword, $user['password_hash'])) {
            echo "✅ Şifre doğrulaması BAŞARILI!\n";
        } else {
            echo "❌ Şifre doğrulaması BAŞARISIZ!\n";
            echo "🔧 Şifreyi güncelliyorum...\n";
            
            // Şifreyi güncelle
            $updateStmt = $db->prepare("UPDATE admin_users SET password_hash = ? WHERE email = ?");
            $updateStmt->execute([$testHash, 'oktay.atalay@fortetourism.com']);
            
            echo "✅ Şifre güncellendi!\n";
            echo "✅ Yeni giriş bilgileri:\n";
            echo "   E-posta: oktay.atalay@fortetourism.com\n";
            echo "   Şifre: fortepanel\n";
        }
    } else {
        echo "❌ Kullanıcı bulunamadı, oluşturuluyor...\n";
        
        // Kullanıcıyı oluştur
        $createStmt = $db->prepare("
            INSERT INTO admin_users (email, password_hash, full_name, role) 
            VALUES (?, ?, 'Oktay Atalay', 'superadmin')
        ");
        $createStmt->execute(['oktay.atalay@fortetourism.com', $testHash]);
        
        echo "✅ Süperadmin oluşturuldu!\n";
        echo "✅ Giriş bilgileri:\n";
        echo "   E-posta: oktay.atalay@fortetourism.com\n";
        echo "   Şifre: fortepanel\n";
    }
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
}
?>