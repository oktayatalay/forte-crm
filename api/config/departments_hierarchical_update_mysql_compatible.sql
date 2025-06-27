-- Departmanlar için hiyerarşik yapı güncellenmesi
-- MySQL uyumlu versiyon

-- 1. Önce parent_id kolonunun var olup olmadığını kontrol et
SELECT COUNT(*) as column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'departments' 
AND COLUMN_NAME = 'parent_id';

-- 2. Eğer parent_id kolonu yoksa ekle
-- Bu sorguyu sadece yukarıdaki sonuç 0 ise çalıştırın:
ALTER TABLE departments ADD COLUMN parent_id INT NULL AFTER director_id;

-- 3. Parent_id için foreign key constraint ekle
ALTER TABLE departments 
ADD CONSTRAINT departments_parent_fk 
FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;

-- 4. İndeks ekle performans için
CREATE INDEX idx_parent_id ON departments(parent_id);

-- 5. Örnek hiyerarşik departman yapısı - sadece gerekirse
-- (Mevcut departmanlarınız varsa bu kısmı atlayın)

-- Ana departmanlar güncelle (parent_id = NULL olarak ayarla)
UPDATE departments SET parent_id = NULL WHERE name IN ('Finans ve Muhasebe', 'Genel Müdürlük', 'İnsan Kaynakları', 'Operasyon', 'Pazarlama');

-- Alt departman örnekleri (opsiyonel)
-- INSERT INTO departments (name, description, parent_id, director_id, is_active) VALUES
-- ('Muhasebe', 'Muhasebe alt departmanı', (SELECT id FROM (SELECT * FROM departments) AS d WHERE d.name = 'Finans ve Muhasebe'), NULL, 1),
-- ('Bordro', 'Bordro alt departmanı', (SELECT id FROM (SELECT * FROM departments) AS d WHERE d.name = 'İnsan Kaynakları'), NULL, 1);

-- 6. Null değerleri düzelt
UPDATE departments SET parent_id = NULL WHERE parent_id = 0;