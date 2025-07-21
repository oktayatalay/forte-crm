<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Test 1: Basic PHP
    $response = [
        'php_version' => PHP_VERSION,
        'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'current_dir' => __DIR__,
        'parent_dir' => dirname(__DIR__),
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown'
    ];
    
    // Test headers
    $headers = getallheaders();
    $response['headers'] = array_keys($headers);
    $response['auth_header'] = $headers['Authorization'] ?? 'NOT_PROVIDED';
    
    // Test 2: File exists
    $config_path = '../config/database.php';
    $response['config_exists'] = file_exists($config_path);
    
    // Test 3: Env file
    $env_path = '../config/env.php';
    $response['env_exists'] = file_exists($env_path);
    
    // Test 4: Load env
    if (file_exists($env_path)) {
        require_once $env_path;
        $response['env_loaded'] = true;
        $response['db_host'] = $_ENV['DB_HOST'] ?? 'NOT_SET';
        $response['db_name'] = $_ENV['DB_NAME'] ?? 'NOT_SET';
        $response['db_user'] = $_ENV['DB_USER'] ?? 'NOT_SET';
    } else {
        $response['env_loaded'] = false;
    }
    
    // Test 5: Try database connection
    if ($response['config_exists'] && $response['env_loaded']) {
        try {
            require_once $config_path;
            $database = new Database();
            $db = $database->getConnection();
            $response['db_connection'] = 'SUCCESS';
        } catch (Exception $e) {
            $response['db_connection'] = 'ERROR: ' . $e->getMessage();
        }
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>