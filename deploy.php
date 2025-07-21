<?php
// GitHub Webhook deployment script
// Bu dosyayı hosting'e koyun ve GitHub webhook'u bu URL'e yönlendirin

// Güvenlik için secret token kontrol edin
$secret = $_ENV['WEBHOOK_SECRET'] ?? 'your-webhook-secret';
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');

if (!hash_equals('sha256=' . hash_hmac('sha256', $payload, $secret), $signature)) {
    http_response_code(403);
    exit('Forbidden');
}

// Log dosyası
$logFile = __DIR__ . '/deploy.log';

function writeLog($message) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
}

try {
    writeLog('Deployment started');
    
    // Git pull
    $output = shell_exec('cd ' . __DIR__ . ' && git pull origin master 2>&1');
    writeLog('Git pull output: ' . $output);
    
    // Composer install (eğer gerekirse)
    // $output = shell_exec('cd ' . __DIR__ . ' && composer install --no-dev 2>&1');
    // writeLog('Composer output: ' . $output);
    
    // Static build for cPanel hosting (commented out for webhook)
    // Next.js build should be done locally and committed to git
    // $output = shell_exec('cd ' . __DIR__ . ' && npm ci && npm run build 2>&1');
    // writeLog('NPM build output: ' . $output);
    
    // Cache temizleme
    if (function_exists('opcache_reset')) {
        opcache_reset();
    }
    
    writeLog('Deployment completed successfully');
    echo json_encode(['status' => 'success', 'message' => 'Deployment completed']);
    
} catch (Exception $e) {
    writeLog('Deployment failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>