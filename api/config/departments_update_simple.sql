-- Basit departments tablo güncelleme (mevcut tabloyu bozmadan)

-- 1. Eksik kolonları tek tek ekle (hata verirse devam et)
ALTER TABLE departments ADD COLUMN description TEXT AFTER name;
ALTER TABLE departments ADD COLUMN director_id INT NULL AFTER description;  
ALTER TABLE departments ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER director_id;
ALTER TABLE departments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER is_active;

-- 2. Unique key ekle
ALTER TABLE departments ADD UNIQUE KEY unique_name (name);

-- 3. Foreign key ekle
ALTER TABLE departments ADD CONSTRAINT departments_director_fk FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. users tablosuna department_id ekle
ALTER TABLE users ADD COLUMN department_id INT NULL AFTER offices;
ALTER TABLE users ADD CONSTRAINT users_department_fk FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- 5. Mevcut veriler için is_active güncelle
UPDATE departments SET is_active = 1 WHERE is_active IS NULL;

-- 6. Örnek departmanlar ekle (sadece yoksa)
INSERT IGNORE INTO departments (name, description, director_id, is_active) VALUES
('İnsan Kaynakları', 'Personel işleri ve İK süreçleri', NULL, 1),
('Bilgi İşlem', 'IT altyapı ve yazılım geliştirme', NULL, 1),
('Muhasebe', 'Mali işler ve muhasebe süreçleri', NULL, 1),
('Pazarlama', 'Pazarlama ve reklam faaliyetleri', NULL, 1),
('Satış', 'Satış operasyonları ve müşteri ilişkileri', NULL, 1),
('Operasyon', 'Günlük operasyonel işlemler', NULL, 1);