-- Departmanlar için hiyerarşik yapı güncellenmesi
-- parent_id alanı eklenerek nested departman yapısı oluşturulacak

-- 1. parent_id kolonunu ekle (eğer yoksa)
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS parent_id INT NULL AFTER director_id;

-- 2. parent_id için foreign key constraint ekle
SET @fk_exists = (SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'departments' 
    AND CONSTRAINT_NAME = 'departments_parent_fk');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE departments ADD CONSTRAINT departments_parent_fk FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL',
    'SELECT "Parent foreign key already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. İndeks ekle performans için
ALTER TABLE departments 
ADD INDEX IF NOT EXISTS idx_parent_id (parent_id);

-- 4. Örnek hiyerarşik departman yapısı ekle (sadece mevcut departmanlar boşsa)
-- Ana departmanlar (parent_id = NULL)
INSERT IGNORE INTO departments (name, description, director_id, parent_id, is_active) VALUES
('Genel Müdürlük', 'Şirket genel yönetimi', NULL, NULL, 1),
('İnsan Kaynakları', 'Personel işleri ve İK süreçleri', NULL, NULL, 1),
('Bilgi İşlem', 'IT altyapı ve yazılım geliştirme', NULL, NULL, 1),
('Mali İşler', 'Finansal yönetim ve muhasebe', NULL, NULL, 1),
('Operasyon', 'Günlük operasyonel işlemler', NULL, NULL, 1);

-- Alt departmanlar için parent_id'leri güncelle
UPDATE departments SET parent_id = (
    SELECT id FROM (SELECT * FROM departments) AS d2 WHERE d2.name = 'Mali İşler'
) WHERE name = 'Muhasebe';

UPDATE departments SET parent_id = (
    SELECT id FROM (SELECT * FROM departments) AS d2 WHERE d2.name = 'Operasyon'
) WHERE name = 'Pazarlama';

UPDATE departments SET parent_id = (
    SELECT id FROM (SELECT * FROM departments) AS d2 WHERE d2.name = 'Operasyon'
) WHERE name = 'Satış';

-- 5. Mevcut departments tablosundaki null değerleri düzelt
UPDATE departments SET parent_id = NULL WHERE parent_id = 0;