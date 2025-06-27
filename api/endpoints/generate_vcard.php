<?php
// UTF-8 encoding ayarları
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Session token kontrolü
$headers = getallheaders();
$session_token = $headers['Authorization'] ?? '';

if (strpos($session_token, 'Bearer ') === 0) {
    $session_token = substr($session_token, 7);
}

if (empty($session_token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Session token gerekli']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$user_id = $input['user_id'] ?? null;

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Session'ı doğrula
    $session_stmt = $db->prepare("
        SELECT u.id, u.email, u.name, u.title, u.mobile_phone_1, u.mobile_phone_2 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.id = ?
    ");
    $session_stmt->execute([$session_token, $user_id]);
    $user = $session_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Geçersiz session veya kullanıcı']);
        exit;
    }
    
    // Email'den ad-soyad çıkarma
    function extractNameFromEmail($email) {
        if (!strpos($email, '@fortetourism.com')) {
            return ['firstName' => '', 'lastName' => ''];
        }
        
        $localPart = explode('@', $email)[0];
        $parts = explode('.', $localPart);
        
        if (count($parts) >= 2) {
            $firstName = ucfirst($parts[0]);
            $lastName = ucfirst($parts[1]);
            return ['firstName' => $firstName, 'lastName' => $lastName];
        }
        
        return ['firstName' => $localPart, 'lastName' => ''];
    }
    
    // Slug oluşturma (Türkçe karakter desteği ile)
    function createSlug($name) {
        // Türkçe karakterleri İngilizce'ye çevir
        $turkishChars = ['ç', 'Ç', 'ğ', 'Ğ', 'ı', 'I', 'İ', 'i', 'ö', 'Ö', 'ş', 'Ş', 'ü', 'Ü'];
        $englishChars = ['c', 'C', 'g', 'G', 'i', 'I', 'I', 'i', 'o', 'O', 's', 'S', 'u', 'U'];
        
        $slug = str_replace($turkishChars, $englishChars, $name);
        $slug = strtolower($slug);
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        return trim($slug, '-');
    }
    
    // Avatar initials oluşturma (Türkçe karakter desteği)
    function generateInitials($name) {
        // UTF-8 safe string operations
        $names = explode(' ', trim($name));
        if (count($names) >= 2) {
            $first = mb_substr($names[0], 0, 1, 'UTF-8');
            $last = mb_substr(end($names), 0, 1, 'UTF-8');
            return mb_strtoupper($first . $last, 'UTF-8');
        }
        return mb_strtoupper(mb_substr($names[0], 0, 1, 'UTF-8'), 'UTF-8');
    }
    
    // Eğer name yoksa email'den çıkar
    $displayName = $user['name'];
    if (empty($displayName)) {
        $nameData = extractNameFromEmail($user['email']);
        if ($nameData['firstName'] && $nameData['lastName']) {
            $displayName = $nameData['firstName'] . ' ' . $nameData['lastName'];
        }
    }
    
    if (empty($displayName)) {
        http_response_code(400);
        echo json_encode(['error' => 'İsim bilgisi eksik. Lütfen profilinizi güncelleyin.']);
        exit;
    }
    
    $slug = createSlug($displayName);
    $initials = generateInitials($displayName);
    $vcardFileName = $slug . '.vcf';
    
    // vCard içeriği oluştur
    $vcardContent = "BEGIN:VCARD\n";
    $vcardContent .= "VERSION:3.0\n";
    $vcardContent .= "PRODID:-//Forte Tourism//EN\n";
    
    // İsim (N: LastName;FirstName;;;)
    $names = explode(' ', trim($displayName));
    $firstName = $names[0];
    $lastName = count($names) > 1 ? end($names) : '';
    $vcardContent .= "N:$lastName;$firstName;;;\n";
    $vcardContent .= "FN:$displayName\n";
    
    // Şirket bilgileri
    $vcardContent .= "ORG:Forte Tourism;\n";
    if ($user['title']) {
        $vcardContent .= "TITLE:" . $user['title'] . "\n";
    }
    
    // İletişim bilgileri
    $vcardContent .= "EMAIL;TYPE=PREF,INTERNET:" . $user['email'] . "\n";
    if ($user['mobile_phone_1']) {
        $vcardContent .= "TEL;TYPE=CELL,voice:" . $user['mobile_phone_1'] . "\n";
    }
    if ($user['mobile_phone_2']) {
        $vcardContent .= "TEL;TYPE=WORK,voice:" . $user['mobile_phone_2'] . "\n";
    }
    
    // Website
    $vcardContent .= "URL:https://www.fortemeetingsevents.com/\n";
    
    // Adres (boş bırakıyoruz)
    $vcardContent .= "ADR;TYPE=WORK;type=pref:;; ;;;;\n";
    
    $vcardContent .= "REV:" . date('c') . "\n";
    $vcardContent .= "END:VCARD\n";
    
    // Avatar SVG oluştur (basit versiyonu)
    $avatarSvg = generateAvatarSvg($initials);
    
    // HTML sayfası oluştur
    $htmlContent = generateVCardHTML($user, $displayName, $slug, $vcardFileName, $initials);
    
    // Slug güvenlik kontrolü
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        throw new Exception('Geçersiz slug formatı');
    }
    
    // Dosya yolları (updated for production deployment)
    $baseDir = realpath('../../vcard/');
    if (!$baseDir) {
        // Create vcard directory if it doesn't exist
        $vcardBaseDir = '../../vcard/';
        if (!file_exists($vcardBaseDir)) {
            mkdir($vcardBaseDir, 0755, true);
        }
        $baseDir = realpath($vcardBaseDir);
    }
    $vcardDir = $baseDir . '/' . $slug;
    $vcardIndexPath = $vcardDir . '/index.html';
    $vcardFilePath = $vcardDir . '/' . $vcardFileName;
    $avatarPath = $vcardDir . '/avatar.svg';
    
    // Dizin oluştur
    if (!file_exists($vcardDir)) {
        mkdir($vcardDir, 0755, true);
    }
    
    // Path traversal kontrolü (after directory creation)
    $realVcardDir = realpath($vcardDir);
    if (!$realVcardDir || strpos($realVcardDir, $baseDir) !== 0) {
        throw new Exception('Güvenlik ihlali: Geçersiz dosya yolu');
    }
    
    // Dosyaları yaz
    file_put_contents($vcardIndexPath, $htmlContent);
    file_put_contents($vcardFilePath, $vcardContent);
    file_put_contents($avatarPath, $avatarSvg);
    
    echo json_encode([
        'success' => true,
        'message' => 'vCard başarıyla oluşturuldu',
        'data' => [
            'url' => "https://corporate.forte.works/vcard/$slug/",
            'slug' => $slug,
            'vcf_filename' => $vcardFileName,
            'name' => $displayName
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}

function generateAvatarSvg($initials) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="60" fill="#C6162A"/>
        <text x="60" y="60" text-anchor="middle" dominant-baseline="central" 
              font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">
            ' . htmlspecialchars($initials, ENT_QUOTES, 'UTF-8') . '
        </text>
    </svg>';
}

function generateVCardHTML($user, $displayName, $slug, $vcardFileName, $initials) {
    $title = $user['title'] ?: 'SPECIALIST';
    $phone1 = $user['mobile_phone_1'] ?: '';
    $phone2 = $user['mobile_phone_2'] ?: '';
    $email = $user['email'];
    
    return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $displayName . ' vCard</title>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: "Poppins", sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .vcard-container {
            max-width: 400px;
            margin: 20px auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .vcard-header {
            background: linear-gradient(135deg, #C6162A, #B0111F);
            color: white;
            padding: 40px 20px;
            text-align: center;
            position: relative;
        }
        
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            border: 3px solid rgba(255,255,255,0.3);
        }
        
        .name { font-size: 22px; font-weight: 600; margin-bottom: 5px; }
        .title { font-size: 14px; opacity: 0.9; font-weight: 300; }
        
        .vcard-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .action-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        
        .vcard-body {
            padding: 30px 20px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }
        
        .contact-item:last-child { border-bottom: none; }
        
        .contact-icon {
            width: 40px;
            height: 40px;
            background: #f8f8f8;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 18px;
        }
        
        .contact-info h4 {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 2px;
        }
        
        .contact-info small {
            color: #666;
            font-size: 12px;
        }
        
        .contact-info a {
            color: #333;
            text-decoration: none;
        }
        
        .download-section {
            padding: 20px;
            text-align: center;
            background: #f8f8f8;
        }
        
        .download-btn {
            background: #C6162A;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 500;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .download-btn:hover {
            background: #B0111F;
            transform: translateY(-2px);
        }
        
        @media (max-width: 480px) {
            .vcard-container { margin: 10px; }
            .vcard-actions { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="vcard-container">
        <div class="vcard-header">
            <div class="avatar">' . $initials . '</div>
            <h2 class="name">' . $displayName . '</h2>
            <p class="title">' . strtoupper($title) . '</p>
            
            <div class="vcard-actions">' .
                ($phone1 ? '<a href="tel:' . $phone1 . '" class="action-btn">📞 Call</a>' : '') .
                '<a href="mailto:' . $email . '?subject=From my vCard" class="action-btn">📧 Email</a>
            </div>
        </div>
        
        <div class="vcard-body">' .
            ($phone1 ? '
            <div class="contact-item">
                <div class="contact-icon">📞</div>
                <div class="contact-info">
                    <h4><a href="tel:' . $phone1 . '">' . $phone1 . '</a></h4>
                    <small>Mobile</small>
                </div>
            </div>' : '') .
            
            '<div class="contact-item">
                <div class="contact-icon">📧</div>
                <div class="contact-info">
                    <h4><a href="mailto:' . $email . '">' . $email . '</a></h4>
                    <small>Email</small>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">🏢</div>
                <div class="contact-info">
                    <h4>Forte Tourism</h4>
                    <small>' . strtoupper($title) . '</small>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">🌐</div>
                <div class="contact-info">
                    <h4><a href="https://www.fortemeetingsevents.com/" target="_blank">fortemeetingsevents.com</a></h4>
                    <small>Website</small>
                </div>
            </div>' .
            
            ($phone2 ? '
            <div class="contact-item">
                <div class="contact-icon">📱</div>
                <div class="contact-info">
                    <h4><a href="tel:' . $phone2 . '">' . $phone2 . '</a></h4>
                    <small>Secondary</small>
                </div>
            </div>' : '') . '
        </div>
        
        <div class="download-section">
            <a href="' . $vcardFileName . '" class="download-btn" download>
                📥 Download vCard
            </a>
        </div>
    </div>
</body>
</html>';
}
?>