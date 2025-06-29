-- Migration to add user_image column to users table
-- This column will store base64 encoded images (600x600px)

ALTER TABLE users 
ADD COLUMN user_image LONGTEXT NULL 
COMMENT 'Base64 encoded user profile image (600x600px)';

-- Optional: Add index for faster queries (if needed)
-- CREATE INDEX idx_users_has_image ON users ((CASE WHEN user_image IS NOT NULL THEN 1 ELSE 0 END));