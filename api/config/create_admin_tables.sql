-- Admin kullanıcıları tablosu
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Admin oturumları tablosu
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Şifre sıfırlama tokenları tablosu
CREATE TABLE IF NOT EXISTS admin_password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    reset_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Departmanlar tablosu
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sistem ayarları tablosu
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Süperadmin kullanıcısını ekle (şifre: fortepanel)
-- Hash: password_hash('fortepanel', PASSWORD_DEFAULT)
INSERT INTO admin_users (email, password_hash, full_name, role) 
VALUES ('oktay.atalay@fortetourism.com', '$2y$10$YourHashWillBeGeneratedByPHP', 'Oktay Atalay', 'superadmin')
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    role = 'superadmin',
    is_active = 1;

-- Varsayılan sistem ayarları
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company_name', 'Forte Tourism', 'Şirket adı'),
('company_address', 'İstanbul, Türkiye', 'Şirket adresi'),
('company_phone', '+90 212 XXX XX XX', 'Şirket telefonu'),
('company_email', 'info@fortetourism.com', 'Şirket e-posta adresi'),
('company_website', 'https://www.fortemeetingsevents.com/', 'Şirket web sitesi')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Varsayılan departmanlar
INSERT INTO departments (name, description) VALUES
('Genel Müdürlük', 'Genel yönetim departmanı'),
('İnsan Kaynakları', 'İK departmanı'),
('Pazarlama', 'Pazarlama ve satış departmanı'),
('Operasyon', 'Operasyon departmanı'),
('Finans', 'Muhasebe ve finans departmanı')
ON DUPLICATE KEY UPDATE name = VALUES(name);