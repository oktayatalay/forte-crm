-- ADIM ADIM HİYERARŞİK DEPARTMAN KURULUMU
-- Bu komutları tek tek çalıştırın

-- ADIM 1: parent_id kolonu var mı kontrol et
SELECT COUNT(*) as parent_id_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'departments' 
AND COLUMN_NAME = 'parent_id';

-- ADIM 2: Eğer yukarıdaki sonuç 0 ise bu komutu çalıştırın
ALTER TABLE departments ADD COLUMN parent_id INT NULL AFTER director_id;

-- ADIM 3: Foreign key constraint ekle
ALTER TABLE departments 
ADD CONSTRAINT departments_parent_fk 
FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ADIM 4: İndeks ekle
CREATE INDEX idx_parent_id ON departments(parent_id);

-- ADIM 5: Mevcut departmanları ana departman olarak ayarla
UPDATE departments SET parent_id = NULL;

-- ADIM 6: Kontrol - tablo yapısını göster
DESCRIBE departments;

-- ADIM 7: Test - departmanları listele
SELECT id, name, parent_id, director_id FROM departments;