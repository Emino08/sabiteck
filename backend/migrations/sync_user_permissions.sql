-- Sync User Permissions Migration
-- This migration populates the user_permissions table for all existing users
-- based on their assigned roles

-- First, ensure the user_permissions table has the correct structure
-- (This is a safety check in case the table was modified)

-- Populate user_permissions for all existing users based on their role_id
-- This only inserts if the permission doesn't already exist for the user
INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
SELECT 
    u.id as user_id,
    rp.permission_id,
    1 as granted,
    u.id as granted_by,  -- Self-granted for migration purposes
    NOW() as granted_at
FROM users u
JOIN role_permissions rp ON u.role_id = rp.role_id
WHERE u.role_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM user_permissions up 
    WHERE up.user_id = u.id 
    AND up.permission_id = rp.permission_id
)
ORDER BY u.id, rp.permission_id;

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, description)
VALUES (
    'sync_user_permissions',
    NOW(),
    'Synced user_permissions table for all existing users based on their roles'
)
ON DUPLICATE KEY UPDATE executed_at = NOW();

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    INDEX idx_migration_name (migration_name)
);
