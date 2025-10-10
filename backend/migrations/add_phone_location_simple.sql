-- ============================================================================
-- SIMPLE VERSION: Add phone and location columns to team_members table
-- Run this if you prefer a straightforward approach
-- NOTE: This will show an error if columns already exist (which is safe to ignore)
-- ============================================================================

-- Add phone column
ALTER TABLE team_members 
ADD COLUMN phone VARCHAR(50) DEFAULT NULL COMMENT 'Contact phone number' 
AFTER email;

-- Add location column
ALTER TABLE team_members 
ADD COLUMN location VARCHAR(255) DEFAULT NULL COMMENT 'Geographic location or office' 
AFTER phone;

-- Verify columns were added
DESCRIBE team_members;

-- Show current data
SELECT id, name, email, phone, location FROM team_members LIMIT 5;
