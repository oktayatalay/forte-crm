<?php
require_once __DIR__ . '/env.php';

// Email SMTP konfigürasyonu
define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'localhost');
define('SMTP_PORT', $_ENV['SMTP_PORT'] ?? 587);
define('SMTP_USERNAME', $_ENV['SMTP_USER'] ?? '');
define('SMTP_PASSWORD', $_ENV['SMTP_PASS'] ?? '');
define('SMTP_FROM_EMAIL', $_ENV['SMTP_USER'] ?? '');
define('SMTP_FROM_NAME', 'Forte Tourism Corporate');

// Email gönderme fonksiyonu
function sendEmail($to, $subject, $body) {
    $headers = array(
        'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . '>',
        'Reply-To: ' . SMTP_FROM_EMAIL,
        'Content-Type: text/html; charset=UTF-8',
        'MIME-Version: 1.0'
    );
    
    // SMTP kullanarak email gönder
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $body
        ]
    ]);
    
    try {
        // SSL/TLS bağlantısı ile SMTP (Port 465 için)
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        $socket = stream_socket_client(
            "ssl://" . SMTP_HOST . ":" . SMTP_PORT,
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            $context
        );
        
        if (!$socket) {
            throw new Exception("SMTP SSL connection failed: $errstr ($errno)");
        }
        
        // SMTP komutları
        fgets($socket); // Sunucu yanıtı
        fputs($socket, "EHLO " . SMTP_HOST . "\r\n");
        fgets($socket);
        
        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket);
        fputs($socket, base64_encode(SMTP_USERNAME) . "\r\n");
        fgets($socket);
        fputs($socket, base64_encode(SMTP_PASSWORD) . "\r\n");
        fgets($socket);
        
        fputs($socket, "MAIL FROM:<" . SMTP_FROM_EMAIL . ">\r\n");
        fgets($socket);
        fputs($socket, "RCPT TO:<$to>\r\n");
        fgets($socket);
        
        fputs($socket, "DATA\r\n");
        fgets($socket);
        
        $email_content = "Subject: $subject\r\n";
        $email_content .= implode("\r\n", $headers) . "\r\n\r\n";
        $email_content .= $body . "\r\n.\r\n";
        
        fputs($socket, $email_content);
        fgets($socket);
        
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
        
    } catch (Exception $e) {
        error_log("Email send error: " . $e->getMessage());
        
        // Fallback: PHP mail() fonksiyonu
        $header_string = implode("\r\n", $headers);
        return mail($to, $subject, $body, $header_string);
    }
}
?>