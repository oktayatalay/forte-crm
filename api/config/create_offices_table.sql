-- Create offices table for forte_crm
CREATE TABLE IF NOT EXISTS offices (
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (code),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
);

-- Insert initial office data
INSERT INTO offices (code, name, address, phone, sort_order, is_active) VALUES
('istanbul', 'Istanbul Office', 'Istanbul, Turkey', '+90-212-XXX-XXXX', 1, TRUE),
('dubai', 'Dubai Office', 'Dubai, UAE', '+971-4-XXX-XXXX', 2, TRUE),
('athens', 'Athens Office', 'Athens, Greece', '+30-210-XXX-XXXX', 3, TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    address = VALUES(address),
    phone = VALUES(phone),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;