-- Migration to add session_token column to admin_users table
-- This column will store admin session tokens for authentication

ALTER TABLE admin_users 
ADD COLUMN session_token VARCHAR(255) NULL,
ADD INDEX idx_session_token (session_token);

-- Update existing records with NULL session_token (they will need to login again)
UPDATE admin_users SET session_token = NULL;