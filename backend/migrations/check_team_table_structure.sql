-- ============================================================================
-- Check current team_members table structure
-- Use this to verify what columns exist before making changes
-- ============================================================================

-- Show all columns in team_members table
SELECT 
    ORDINAL_POSITION AS 'Position',
    COLUMN_NAME AS 'Column',
    DATA_TYPE AS 'Type',
    CHARACTER_MAXIMUM_LENGTH AS 'Length',
    IS_NULLABLE AS 'Nullable',
    COLUMN_DEFAULT AS 'Default',
    COLUMN_COMMENT AS 'Comment'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team_members'
ORDER BY ORDINAL_POSITION;

-- Alternative: Simple DESCRIBE command
-- DESCRIBE team_members;

-- Check if phone and location columns exist
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - Column exists' 
        ELSE 'NO - Column does not exist' 
    END AS phone_column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team_members'
  AND COLUMN_NAME = 'phone';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - Column exists' 
        ELSE 'NO - Column does not exist' 
    END AS location_column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team_members'
  AND COLUMN_NAME = 'location';

-- Show sample data from existing team members
SELECT id, name, position, email FROM team_members LIMIT 3;
