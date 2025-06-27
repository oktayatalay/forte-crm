<?php
require_once 'database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // SQL dosyasını oku
    $sql = file_get_contents(__DIR__ . '/create_admin_tables.sql');
    
    // SQL komutlarını ayır ve çalıştır
    $statements = explode(';', $sql);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement) && !strpos($statement, '$2y$10$YourHashWillBeGeneratedByPHP')) {
            $db->exec($statement);
        }
    }
    
    // Şifreyi doğru şekilde hash'le ve süperadmini ekle
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
            role = 'superadmin',
            is_active = 1
    ");
    
    $stmt->execute([$email, $passwordHash]);
    
    // Doğrulama yapalım
    $stmt = $db->prepare("SELECT id, email, password_hash, full_name, role FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        echo "✅ Admin tabloları başarıyla oluşturuldu!\n";
        echo "✅ Süperadmin kullanıcısı eklendi: $email\n";
        echo "✅ Şifre: $password\n";
        echo "✅ Şifre doğrulaması başarılı!\n";
        echo "✅ Sistem ayarları ve departmanlar eklendi!\n";
    } else {
        echo "❌ Şifre doğrulaması başarısız!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
}
?>