-- Add user profile fields migration
-- File: 002_add_user_profile_fields.sql

-- Add new columns to users table (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'gender') = 0,
  'ALTER TABLE users ADD COLUMN gender ENUM(''male'', ''female'', ''other'') NULL',
  'SELECT "gender column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'birth_date') = 0,
  'ALTER TABLE users ADD COLUMN birth_date DATE NULL',
  'SELECT "birth_date column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'city') = 0,
  'ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL',
  'SELECT "city column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'address') = 0,
  'ALTER TABLE users ADD COLUMN address TEXT NULL',
  'SELECT "address column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'department_id') = 0,
  'ALTER TABLE users ADD COLUMN department_id INT NULL',
  'SELECT "department_id column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "updated_at column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for department_id in users table
-- (Only if the constraint doesn't already exist)
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND CONSTRAINT_NAME = 'fk_users_department'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE users ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
    'SELECT "Foreign key constraint already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes for better performance (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND INDEX_NAME = 'idx_users_department_id') = 0,
  'CREATE INDEX idx_users_department_id ON users(department_id)',
  'SELECT "idx_users_department_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND INDEX_NAME = 'idx_users_city') = 0,
  'CREATE INDEX idx_users_city ON users(city)',
  'SELECT "idx_users_city already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND INDEX_NAME = 'idx_users_gender') = 0,
  'CREATE INDEX idx_users_gender ON users(gender)',
  'SELECT "idx_users_gender already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND INDEX_NAME = 'idx_users_birth_date') = 0,
  'CREATE INDEX idx_users_birth_date ON users(birth_date)',
  'SELECT "idx_users_birth_date already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;