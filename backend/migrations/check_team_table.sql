-- ============================================================================
-- Check current 'team' table structure
-- Use this to see what columns exist before adding phone and location
-- ============================================================================

-- Show all columns in team table
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
  AND TABLE_NAME = 'team'
ORDER BY ORDINAL_POSITION;

-- Alternative: Simple DESCRIBE command
DESCRIBE team;

-- Check if phone column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - phone column exists' 
        ELSE 'NO - phone column does not exist' 
    END AS phone_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team'
  AND COLUMN_NAME = 'phone';

-- Check if location column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - location column exists' 
        ELSE 'NO - location column does not exist' 
    END AS location_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team'
  AND COLUMN_NAME = 'location';

-- Show sample data from existing team members
SELECT * FROM team LIMIT 3;
