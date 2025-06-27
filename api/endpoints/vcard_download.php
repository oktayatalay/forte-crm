<?php
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

$slug = $_GET['slug'] ?? '';
$file = $_GET['file'] ?? '';

if (empty($slug) || empty($file) || !str_ends_with($file, '.vcf')) {
    http_response_code(404);
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
    
    if (!$user) {
        http_response_code(404);
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
        exit;
    }
    
    // İsim (N: LastName;FirstName;;;)
    $names = explode(' ', trim($displayName));
    $firstName = $names[0];
    $lastName = count($names) > 1 ? end($names) : '';
    
    // vCard içeriği oluştur
    $vcardContent = "BEGIN:VCARD\n";
    $vcardContent .= "VERSION:3.0\n";
    $vcardContent .= "PRODID:-//Forte Tourism//EN\n";
    $vcardContent .= "N:$lastName;$firstName;;;\n";
    $vcardContent .= "FN:$displayName\n";
    $vcardContent .= "ORG:Forte Tourism;\n";
    
    if ($user['title']) {
        $vcardContent .= "TITLE:" . $user['title'] . "\n";
    }
    
    $vcardContent .= "EMAIL;TYPE=PREF,INTERNET:" . $user['email'] . "\n";
    
    if ($user['mobile_phone_1']) {
        $vcardContent .= "TEL;TYPE=CELL,voice:" . $user['mobile_phone_1'] . "\n";
    }
    if ($user['mobile_phone_2']) {
        $vcardContent .= "TEL;TYPE=WORK,voice:" . $user['mobile_phone_2'] . "\n";
    }
    
    $vcardContent .= "URL:https://www.fortemeetingsevents.com/\n";
    $vcardContent .= "ADR;TYPE=WORK;type=pref:;; ;;;;\n";
    $vcardContent .= "REV:" . date('c') . "\n";
    $vcardContent .= "END:VCARD\n";
    
    // vCard dosyası header'ları
    header('Content-Type: text/vcard; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $file . '"');
    header('Content-Length: ' . strlen($vcardContent));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
    
    echo $vcardContent;
    
} catch (Exception $e) {
    http_response_code(500);
    exit;
}
?>