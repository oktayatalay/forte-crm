<?php
// Ana başlatma dosyası - tüm endpoint'lerde kullanılmalı
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/security.php';
require_once __DIR__ . '/config/https.php';

// HTTPS zorlaması
enforceHTTPS();

// CORS başlıkları
setCorsHeaders();

// Güvenlik başlıkları
setSecurityHeaders();

// Content-Type belirleme
header('Content-Type: application/json; charset=utf-8');
?>