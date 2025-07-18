-- Migration to add user_image column to users table
-- This column will store base64 encoded images (600x600px)

-- Check if column exists before adding
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'user_image';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN user_image LONGTEXT NULL COMMENT "Base64 encoded user profile image (600x600px)"',
    'SELECT "Column user_image already exists" as result'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;