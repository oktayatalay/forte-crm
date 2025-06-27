-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
('site_title', 'Forte Tourism Panel'),
('site_description', 'Forte Tourism Panel'),
('admin_email', 'admin@forteturizm.com'),
('timezone', 'Europe/Istanbul'),
('session_timeout', '60'),
('max_login_attempts', '5'),
('require_strong_password', '1'),
('enable_two_factor', '0'),
('smtp_host', ''),
('smtp_port', '587'),
('smtp_username', ''),
('smtp_password', ''),
('smtp_ssl', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Show table structure
DESCRIBE system_settings;