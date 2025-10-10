-- ============================================================================
-- Add phone and location columns to 'team' table
-- Simple version - Run this in phpMyAdmin or MySQL client
-- ============================================================================

-- Add phone column (if it doesn't exist)
ALTER TABLE team 
ADD COLUMN phone VARCHAR(50) DEFAULT NULL COMMENT 'Contact phone number' 
AFTER email;

-- Add location column (if it doesn't exist)
ALTER TABLE team 
ADD COLUMN location VARCHAR(255) DEFAULT NULL COMMENT 'Geographic location or office' 
AFTER phone;

-- Verify columns were added
DESCRIBE team;

-- Show updated structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team'
  AND COLUMN_NAME IN ('email', 'phone', 'location')
ORDER BY ORDINAL_POSITION;

-- Show sample data
SELECT id, name, email, phone, location FROM team LIMIT 5;
