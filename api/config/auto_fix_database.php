<?php
// Otomatik database fix sistemi - sadece boş bilgiler varsa çalışır

$config_file = __DIR__ . '/database.php';
$config_content = file_get_contents($config_file);

// Eğer database bilgileri boşsa otomatik doldur
if (strpos($config_content, "private \$username = '';") !== false && 
    strpos($config_content, "private \$password = '';") !== false) {
    
    $fixed_content = '<?php
class Database {
    private $host = \'localhost\';
    private $db_name = \'fortetou_corporate\';
    private $username = \'fortetou_corporate\';
    private $password = \'ForteTourism2025\';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }
}
?>';
    
    file_put_contents($config_file, $fixed_content);
    echo "✓ Database configuration auto-fixed!<br>";
} else {
    echo "✓ Database configuration already set<br>";
}
?>