-- Fix User Permissions for All Users
-- This script ensures all users have proper permissions based on their roles

-- First, let's check current state
SELECT 'Current Users and Their Roles' as Info;
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    COUNT(up.id) as current_permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.id
ORDER BY u.id;

-- Check if koromaemmanuel66@gmail.com user exists and their current setup
SELECT 'Koroma Emmanuel User Details' as Info;
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.role_id,
    r.name as role_name,
    COUNT(up.id) as permissions_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email = 'koromaemmanuel66@gmail.com'
GROUP BY u.id;

-- Find the content_editor or editor role ID
SELECT 'Available Roles' as Info;
SELECT id, name, slug, display_name, description FROM roles ORDER BY id;

-- Check what permissions the editor/content_editor role should have
SELECT 'Editor/Content Editor Role Permissions' as Info;
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.display_name,
    p.module
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.slug IN ('editor', 'content-editor', 'content-manager')
ORDER BY r.name, p.module, p.name;

-- Now fix the koromaemmanuel66@gmail.com user
-- 1. Set their role_id to editor/content-editor role if not set
UPDATE users u
SET role_id = (
    SELECT id FROM roles 
    WHERE slug IN ('editor', 'content-editor', 'content-manager')
    LIMIT 1
)
WHERE u.email = 'koromaemmanuel66@gmail.com'
AND (u.role_id IS NULL OR u.role_id NOT IN (
    SELECT id FROM roles WHERE slug IN ('editor', 'content-editor', 'content-manager')
));

-- 2. Clear any existing permissions for this user
DELETE FROM user_permissions 
WHERE user_id = (SELECT id FROM users WHERE email = 'koromaemmanuel66@gmail.com');

-- 3. Assign all permissions from their role to user_permissions table
INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
SELECT 
    u.id as user_id,
    rp.permission_id,
    1 as granted,
    u.id as granted_by,
    NOW() as granted_at
FROM users u
JOIN role_permissions rp ON u.role_id = rp.role_id
WHERE u.email = 'koromaemmanuel66@gmail.com'
ON DUPLICATE KEY UPDATE granted = 1, updated_at = NOW();

-- Fix all admin users - ensure they have ALL permissions
-- 1. Clear existing admin permissions
DELETE up FROM user_permissions up
JOIN users u ON up.user_id = u.id
JOIN roles r ON u.role_id = r.id
WHERE r.slug IN ('admin', 'super-admin');

-- 2. Assign ALL permissions to admin users
INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
SELECT 
    u.id as user_id,
    p.id as permission_id,
    1 as granted,
    u.id as granted_by,
    NOW() as granted_at
FROM users u
CROSS JOIN permissions p
JOIN roles r ON u.role_id = r.id
WHERE r.slug IN ('admin', 'super-admin')
ON DUPLICATE KEY UPDATE granted = 1, updated_at = NOW();

-- Fix all other users with roles - sync their permissions
DELETE up FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.role_id IS NOT NULL
AND u.role_id NOT IN (SELECT id FROM roles WHERE slug IN ('admin', 'super-admin'));

INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
SELECT 
    u.id as user_id,
    rp.permission_id,
    1 as granted,
    u.id as granted_by,
    NOW() as granted_at
FROM users u
JOIN role_permissions rp ON u.role_id = rp.role_id
WHERE u.role_id IS NOT NULL
AND u.role_id NOT IN (SELECT id FROM roles WHERE slug IN ('admin', 'super-admin'))
ON DUPLICATE KEY UPDATE granted = 1, updated_at = NOW();

-- Verify the fix
SELECT 'Verification - Users with Permission Counts' as Info;
SELECT 
    u.id,
    u.username,
    u.email,
    r.name as role_name,
    COUNT(up.id) as permissions_assigned
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.id
ORDER BY u.id;

-- Show specific permissions for koromaemmanuel66@gmail.com
SELECT 'Koroma Emmanuel Permissions After Fix' as Info;
SELECT 
    p.name,
    p.display_name,
    p.module,
    up.granted,
    up.granted_at
FROM user_permissions up
JOIN permissions p ON up.permission_id = p.id
JOIN users u ON up.user_id = u.id
WHERE u.email = 'koromaemmanuel66@gmail.com'
ORDER BY p.module, p.name;
