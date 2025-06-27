<?php
// Database Migration Runner
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

// Auth check
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);
$expectedToken = $_ENV['MIGRATION_TOKEN'] ?? '';

if (!$expectedToken || !hash_equals($expectedToken, $token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Create migrations table if not exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Get executed migrations
    $stmt = $db->query("SELECT filename FROM migrations");
    $executedMigrations = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $migrationsPath = __DIR__ . '/../../database/migrations';
    $migrationFiles = glob($migrationsPath . '/*.sql');
    
    $newMigrations = [];
    
    foreach ($migrationFiles as $file) {
        $filename = basename($file);
        
        if (!in_array($filename, $executedMigrations)) {
            $sql = file_get_contents($file);
            
            // Execute migration
            $db->exec($sql);
            
            // Mark as executed
            $stmt = $db->prepare("INSERT INTO migrations (filename) VALUES (?)");
            $stmt->execute([$filename]);
            
            $newMigrations[] = $filename;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => count($newMigrations) . ' migrations executed',
        'migrations' => $newMigrations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Migration failed: ' . $e->getMessage()
    ]);
}
?>