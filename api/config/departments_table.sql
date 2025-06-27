-- Mevcut departments tablosunu kontrol et ve eksik kolonları ekle

-- 1. Tabloyu kontrol et ve oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Eksik kolonları ekle (eğer yoklarsa)
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS description TEXT AFTER name,
ADD COLUMN IF NOT EXISTS director_id INT NULL AFTER description,
ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER director_id,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER is_active;

-- 3. İndeksler ve kısıtlamaları ekle
ALTER TABLE departments 
ADD UNIQUE KEY IF NOT EXISTS unique_name (name);

-- 4. Foreign key ekle (eğer yoksa)
-- Önce foreign key'in var olup olmadığını kontrol et
SET @fk_exists = (SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'departments' 
    AND CONSTRAINT_NAME = 'departments_director_fk');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE departments ADD CONSTRAINT departments_director_fk FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. users tablosuna department_id ekle (eğer yoksa)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id INT NULL AFTER offices;

-- 6. users tablosu foreign key ekle
SET @fk_exists2 = (SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND CONSTRAINT_NAME = 'users_department_fk');

SET @sql2 = IF(@fk_exists2 = 0, 
    'ALTER TABLE users ADD CONSTRAINT users_department_fk FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
    'SELECT "Users foreign key already exists" as message');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 7. Örnek departmanlar ekle (sadece tablo boşsa)
INSERT IGNORE INTO departments (name, description, director_id, is_active) VALUES
('İnsan Kaynakları', 'Personel işleri ve İK süreçleri', NULL, 1),
('Bilgi İşlem', 'IT altyapı ve yazılım geliştirme', NULL, 1),
('Muhasebe', 'Mali işler ve muhasebe süreçleri', NULL, 1),
('Pazarlama', 'Pazarlama ve reklam faaliyetleri', NULL, 1),
('Satış', 'Satış operasyonları ve müşteri ilişkileri', NULL, 1),
('Operasyon', 'Günlük operasyonel işlemler', NULL, 1);

-- 8. Mevcut departments tablosundaki veriler için is_active değerini güncelle
UPDATE departments SET is_active = 1 WHERE is_active IS NULL;