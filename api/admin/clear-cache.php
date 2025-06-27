<?php
// Cache clearing endpoint
require_once __DIR__ . '/../config/env.php';

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
    $cleared = [];
    
    // Clear OPCache
    if (function_exists('opcache_reset')) {
        opcache_reset();
        $cleared[] = 'OPCache';
    }
    
    // Clear file cache if exists
    $cacheDir = __DIR__ . '/../cache';
    if (is_dir($cacheDir)) {
        $files = glob($cacheDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        $cleared[] = 'File Cache';
    }
    
    // Clear session files if needed
    if (function_exists('session_destroy')) {
        session_start();
        session_destroy();
        $cleared[] = 'Sessions';
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Cache cleared successfully',
        'cleared' => $cleared
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Cache clear failed: ' . $e->getMessage()
    ]);
}
?>