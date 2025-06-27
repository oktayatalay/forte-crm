-- Mevcut departments tablosunun yapısını kontrol et
DESCRIBE departments;

-- Hangi kolonların var olduğunu göster
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'departments';

-- Mevcut verileri göster
SELECT * FROM departments LIMIT 5;