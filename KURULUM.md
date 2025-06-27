# Forte Panel Kurulum Rehberi

## 📦 Paket İçeriği
Bu paket dinamik ofis yönetimi sistemi ile güncellenmiş tam sürümdür.

### Yeni Özellikler
- ✅ Dinamik ofis yönetimi (database tablosu)
- ✅ Mail imzası generator (güncel ofis bilgileri)
- ✅ Mail avatar generator
- ✅ Profil yönetimi (ofis seçimi)

## 🚀 Kurulum Adımları

### 1. Dosyaları Upload Et
- `out/` klasörünün içindeki tüm dosyaları `corporate.forte.works` dizinine kopyala
- `api/` klasörünü ana dizine kopyala
- `run_sql.php` dosyasını ana dizine kopyala

### 2. Database Yapılandırması

#### A) Database bilgilerini güncelle:
`api/config/database.php` dosyasını düzenle:
```php
private $host = "localhost";          // DB host
private $db_name = "forte_panel";     // DB adı
private $username = "root";           // DB kullanıcı
private $password = "";               // DB şifre
```

#### B) Email yapılandırması:
`api/config/email.php` dosyasını düzenle:
```php
define('SMTP_HOST', 'mail.forte.works');
define('SMTP_USERNAME', 'corporate@forte.works');
define('SMTP_PASSWORD', 'ForteTourism2025');
```

### 3. Database Tablolarını Oluştur

#### Yöntem 1: run_sql.php (Önerilen)
1. Tarayıcıda `corporate.forte.works/run_sql.php` adresine git
2. Tüm işlemlerin başarılı olduğunu kontrol et
3. **GÜVENLİK:** İşlem bittikten sonra bu dosyayı sil!

#### Yöntem 2: phpMyAdmin
1. cPanel → phpMyAdmin
2. SQL sekmesi → `database_offices_table_fixed.sql` içeriğini kopyala yapıştır
3. Go butonuna bas

### 4. Test Et
1. `corporate.forte.works` adresine git
2. @fortetourism.com email ile giriş yap
3. Dashboard → Profile → Ofis seçimi yap
4. Mail İmzası → Ofislerin doğru görüntülendiğini kontrol et

## 📁 Dizin Yapısı
```
corporate.forte.works/
├── index.html              # Ana sayfa
├── dashboard/               # Dashboard sayfaları
├── api/                     # PHP API endpoints
├── assets/                  # Font dosyaları
├── _next/                   # Next.js static dosyalar
├── run_sql.php             # Database kurulum scripti (silinecek)
└── database_offices_table_fixed.sql  # Yedek SQL dosyası
```

## 🏢 Ofis Yönetimi
- İstanbul, Dubai, Atina ofisleri otomatik eklenir
- Yeni ofis eklemek için `offices` tablosuna insert yapın
- Kullanıcılar profil sayfasından ofislerini seçebilir

## 🔧 Sorun Giderme

### Database Bağlantı Hatası
- `api/config/database.php` bilgilerini kontrol et
- cPanel'de database kullanıcısının yetkilerini kontrol et

### Email Gönderilmiyor
- `api/config/email.php` bilgilerini kontrol et
- SMTP şifresinin `ForteTourism2025` olduğunu kontrol et

### 404 Hataları
- `.htaccess` dosyasının upload edildiğini kontrol et
- Apache rewrite module'ının aktif olduğunu kontrol et

## 📞 Destek
Herhangi bir sorun için sistem yöneticisine başvurun.