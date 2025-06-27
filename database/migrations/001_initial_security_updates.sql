-- Initial security updates migration
-- File: 001_initial_security_updates.sql

-- Update any existing weak passwords (if needed)
-- UPDATE users SET password = PASSWORD('new_secure_password') WHERE password = PASSWORD('weak_password');

-- Add security columns if they don't exist (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'failed_login_attempts') = 0,
  'ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0',
  'SELECT "failed_login_attempts column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'locked_until') = 0,
  'ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL',
  'SELECT "locked_until column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'last_login') = 0,
  'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL',
  'SELECT "last_login column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'password_changed_at') = 0,
  'ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'SELECT "password_changed_at column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create sessions table for better session management (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'user_sessions') = 0,
  'CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )',
  'SELECT "user_sessions table already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create audit log table (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'audit_logs') = 0,
  'CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )',
  'SELECT "audit_logs table already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for performance (MySQL compatible)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'user_sessions' 
   AND INDEX_NAME = 'idx_sessions_user_id') = 0,
  'CREATE INDEX idx_sessions_user_id ON user_sessions(user_id)',
  'SELECT "idx_sessions_user_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'user_sessions' 
   AND INDEX_NAME = 'idx_sessions_expires') = 0,
  'CREATE INDEX idx_sessions_expires ON user_sessions(expires_at)',
  'SELECT "idx_sessions_expires already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'audit_logs' 
   AND INDEX_NAME = 'idx_audit_user_id') = 0,
  'CREATE INDEX idx_audit_user_id ON audit_logs(user_id)',
  'SELECT "idx_audit_user_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'audit_logs' 
   AND INDEX_NAME = 'idx_audit_created_at') = 0,
  'CREATE INDEX idx_audit_created_at ON audit_logs(created_at)',
  'SELECT "idx_audit_created_at already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;