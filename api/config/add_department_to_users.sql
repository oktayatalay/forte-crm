-- Users tablosuna department_id kolonu ekle
ALTER TABLE users ADD COLUMN department_id INT NULL AFTER title;

-- Foreign key kısıtlaması ekle (opsiyonel, departman silinirse kullanıcının department_id'si NULL olur)
ALTER TABLE users ADD CONSTRAINT fk_users_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Mevcut kolonları kontrol et
DESCRIBE users;