<?php
// UTF-8 encoding ayarları
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

header('Content-Type: text/html; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

$slug = $_GET['slug'] ?? '';

if (empty($slug)) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 - vCard Not Found</h1></body></html>';
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Slug oluşturma fonksiyonu (Türkçe karakter desteği ile)
    function createSlugFromName($name) {
        $turkishChars = ['ç', 'Ç', 'ğ', 'Ğ', 'ı', 'I', 'İ', 'i', 'ö', 'Ö', 'ş', 'Ş', 'ü', 'Ü'];
        $englishChars = ['c', 'C', 'g', 'G', 'i', 'I', 'I', 'i', 'o', 'O', 's', 'S', 'u', 'U'];
        
        $slug = str_replace($turkishChars, $englishChars, $name);
        $slug = strtolower($slug);
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        return trim($slug, '-');
    }

    // Tüm kullanıcıları al ve slug karşılaştırması yap
    $stmt = $db->prepare("SELECT id, email, name, title, mobile_phone_1, mobile_phone_2 FROM users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $user = null;
    foreach ($users as $userData) {
        // İsimden slug oluştur
        if ($userData['name']) {
            $nameSlug = createSlugFromName($userData['name']);
            if (strtolower($nameSlug) === strtolower($slug)) {
                $user = $userData;
                break;
            }
        }
        
        // Email'den slug oluştur
        if (strpos($userData['email'], '@fortetourism.com')) {
            $localPart = explode('@', $userData['email'])[0];
            $parts = explode('.', $localPart);
            if (count($parts) >= 2) {
                $emailName = ucfirst($parts[0]) . ' ' . ucfirst($parts[1]);
                $emailSlug = createSlugFromName($emailName);
                if (strtolower($emailSlug) === strtolower($slug)) {
                    $user = $userData;
                    break;
                }
            }
        }
    }
    
    // Fallback: Eski sistem ile dene
    if (!$user) {
        $stmt = $db->prepare("
            SELECT id, email, name, title, mobile_phone_1, mobile_phone_2 
            FROM users 
            WHERE LOWER(REPLACE(REPLACE(name, ' ', '-'), 'ü', 'u')) = LOWER(?) 
               OR LOWER(REPLACE(REPLACE(CONCAT(
                   SUBSTRING_INDEX(SUBSTRING_INDEX(email, '@', 1), '.', 1), 
                   ' ', 
                   SUBSTRING_INDEX(SUBSTRING_INDEX(email, '@', 1), '.', -1)
               ), ' ', '-'), 'ü', 'u')) = LOWER(?)
        ");
        $stmt->execute([$slug, $slug]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if (!$user) {
        http_response_code(404);
        echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 - vCard Not Found</h1></body></html>';
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
        http_response_code(404);
        echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 - vCard Not Found</h1></body></html>';
        exit;
    }
    
    $initials = generateInitials($displayName);
    $title = $user['title'] ?: 'SPECIALIST';
    $phone1 = $user['mobile_phone_1'] ?: '';
    $phone2 = $user['mobile_phone_2'] ?: '';
    $email = $user['email'];
    $vcardFileName = $slug . '.vcf';
    
    // Font dosyasını base64'e çevir (Mail Avatar Generator ile aynı sistem)
    function loadCopperplateFont() {
        $fontPath = '../../public/assets/Copperplate-Bold-03.ttf';
        if (!file_exists($fontPath)) {
            return null;
        }
        
        $fontData = file_get_contents($fontPath);
        if ($fontData === false) {
            return null;
        }
        
        // Binary safe base64 encoding (JavaScript ile aynı)
        return base64_encode($fontData);
    }
    
    // Avatar SVG oluşturma (mail-avatar ile aynı sistem)
    function generateAvatarSVG($initials) {
        $backgroundColor = '#C6162A'; // Forte kırmızısı
        $fontBase64 = loadCopperplateFont();
        
        // Her zaman Copperplate kullan (Mail Avatar Generator gibi)
        $fontFamily = $fontBase64 ? 'CopperplateBold, Arial, sans-serif' : 'Arial, sans-serif';
        
        return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 600 600">
            <defs>
                ' . ($fontBase64 ? '
                <style>
                    @font-face {
                        font-family: \'CopperplateBold\';
                        src: url(data:font/truetype;charset=utf-8;base64,' . $fontBase64 . ') format(\'truetype\');
                        font-weight: bold;
                        font-style: normal;
                    }
                </style>
                ' : '') . '
                <clipPath id="clip-path">
                    <circle cx="300" cy="300" r="300" fill="' . $backgroundColor . '"/>
                </clipPath>
            </defs>
            
            <!-- Multiple Border Rings (Outer to Inner) -->
            <!-- Outer Ring -->
            <path d="M561.423,279.043c0,156.431-126.619,283.243-282.811,283.243S-4.2,435.474-4.2,279.043,122.419-4.2,278.611-4.2,561.423,122.612,561.423,279.043Zm-11.144,0c0-150.266-121.629-272.081-271.667-272.081S6.944,128.776,6.944,279.043,128.574,551.124,278.611,551.124,550.278,429.309,550.278,279.043Z" transform="translate(21.03 20.957)" fill="#fff"/>
            
            <!-- Middle Ring -->
            <path d="M562.756,281.707c0,155.693-126.022,281.907-281.478,281.907S-.2,437.4-.2,281.707,125.822-.2,281.278-.2,562.756,126.014,562.756,281.707Zm-8.477,0c0-151-122.227-273.417-273-273.417s-273,122.413-273,273.417,122.227,273.417,273,273.417S554.278,432.711,554.278,281.707Z" transform="translate(18.252 18.293)" fill="#fff"/>
            
            <!-- Inner Ring -->
            <path d="M540.634,270.732c0,149.521-121.025,270.732-270.317,270.732S0,420.253,0,270.732,121.025,0,270.317,0,540.634,121.211,540.634,270.732Zm-2.922,0c0-147.9-119.717-267.8-267.395-267.8S2.922,122.827,2.922,270.732s119.717,267.8,267.395,267.8S537.712,418.636,537.712,270.732Z" transform="translate(30.215 29.269)" fill="#fff"/>
            
            <!-- Main Circle -->
            <ellipse cx="300" cy="300" rx="299.541" ry="300" fill="' . $backgroundColor . '"/>
            
            <!-- Outermost Border -->
            <path d="M558.757,273.714c0,157.906-127.813,285.914-285.478,285.914S-12.2,431.62-12.2,273.714,115.613-12.2,273.279-12.2,558.757,115.808,558.757,273.714Zm-16.478,0c0-148.791-120.435-269.41-269-269.41s-269,120.619-269,269.41,120.435,269.41,269,269.41S542.278,422.505,542.278,273.714Z" transform="translate(26.19 26.286)" fill="#fff"/>
            
            <!-- Forte Logo (F harfi) with Clipping -->
            <g clip-path="url(#clip-path)">
                <path d="M89.516,50.09c0,17.014,11.871,28.449,29.549,28.449,17.613,0,29.916-12.758,29.916-31.019C148.981,19.542,127.476,0,96.686,0c-41.06,0-67,29.863-67.7,77.972V96.485H0v9.2H28.984V276.25H0v9.2H126.285v-9.2h-33.8V105.687h38.89v-9.2H97.418c-33.219,0-50.064-13.757-50.064-40.89C47.354,28.712,68.1,9.2,96.686,9.2c15.935,0,28.856,6.218,36.259,16.435a26.053,26.053,0,0,0-14.615-4.36c-16.966,0-28.814,11.851-28.814,28.815" transform="translate(225.613 377.169)" fill="#fff"/>
            </g>
            
            <!-- Custom Initials Text -->
            <text x="300" y="255" 
                  text-anchor="middle" 
                  dominant-baseline="central"
                  font-family="' . $fontFamily . '"
                  font-size="193" 
                  font-weight="bold" 
                  fill="#fff">
                <tspan x="300" y="255">' . htmlspecialchars($initials, ENT_QUOTES, 'UTF-8') . '</tspan>
            </text>
        </svg>';
    }
    
    $avatarSVG = generateAvatarSVG($initials);
    
    // HTML sayfası oluştur
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($displayName) . ' vCard</title>
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
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .avatar svg {
            width: 100%;
            height: 100%;
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
            <div class="avatar">' . $avatarSVG . '</div>
            <h2 class="name">' . htmlspecialchars($displayName) . '</h2>
            <p class="title">' . htmlspecialchars(strtoupper($title)) . '</p>
            
            <div class="vcard-actions">' .
                ($phone1 ? '<a href="tel:' . htmlspecialchars($phone1) . '" class="action-btn">📞 Call</a>' : '') .
                '<a href="mailto:' . htmlspecialchars($email) . '?subject=From my vCard" class="action-btn">📧 Email</a>
            </div>
        </div>
        
        <div class="vcard-body">' .
            ($phone1 ? '
            <div class="contact-item">
                <div class="contact-icon">📞</div>
                <div class="contact-info">
                    <h4><a href="tel:' . htmlspecialchars($phone1) . '">' . htmlspecialchars($phone1) . '</a></h4>
                    <small>Mobile</small>
                </div>
            </div>' : '') .
            
            '<div class="contact-item">
                <div class="contact-icon">📧</div>
                <div class="contact-info">
                    <h4><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></h4>
                    <small>Email</small>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">🏢</div>
                <div class="contact-info">
                    <h4>Forte Tourism</h4>
                    <small>' . htmlspecialchars(strtoupper($title)) . '</small>
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
                    <h4><a href="tel:' . htmlspecialchars($phone2) . '">' . htmlspecialchars($phone2) . '</a></h4>
                    <small>Secondary</small>
                </div>
            </div>' : '') . '
        </div>
        
        <div class="download-section">
            <a href="/api/endpoints/vcard_download.php?slug=' . urlencode($slug) . '&file=' . urlencode($vcardFileName) . '" class="download-btn" download onclick="downloadVCard(event)">
                📥 Download vCard
            </a>
        </div>
    </div>
    
    <script>
    function downloadVCard(event) {
        // Mobil tarayıcılar için alternatif indirme yöntemi
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            event.preventDefault();
            
            fetch("/api/endpoints/vcard_download.php?slug=' . urlencode($slug) . '&file=' . urlencode($vcardFileName) . '")
                .then(response => {
                    if (!response.ok) throw new Error("Dosya bulunamadı");
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "' . htmlspecialchars($vcardFileName) . '";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                })
                .catch(error => {
                    alert("İndirme başarısız: " + error.message);
                    // Fallback: normal link davranışı
                    window.open("/api/endpoints/vcard_download.php?slug=' . urlencode($slug) . '&file=' . urlencode($vcardFileName) . '", "_blank");
                });
        }
        // Desktop tarayıcılar normal link davranışını kullanır
    }
    </script>
</body>
</html>';
    
} catch (Exception $e) {
    http_response_code(500);
    echo '<!DOCTYPE html><html><head><title>500 Error</title></head><body><h1>500 - Server Error</h1></body></html>';
}
?>