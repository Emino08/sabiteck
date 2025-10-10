-- ============================================================================
-- RBAC Permission System - Database Fix Script
-- ============================================================================
-- This script fixes existing users to ensure proper role assignment
-- All staff users should have role='admin' for dashboard access
-- Their actual permissions are determined by role_id
-- ============================================================================

-- 1. Show current state of users
SELECT 
    u.id,
    u.username,
    u.email,
    u.role as current_role_column,
    u.role_id,
    r.name as role_name_from_table,
    r.display_name,
    u.status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.role_id IS NOT NULL
ORDER BY u.id;

-- 2. Fix all staff users: Set role='admin' for dashboard access
-- Their permissions will still be determined by role_id
UPDATE users 
SET role = 'admin' 
WHERE role_id IS NOT NULL 
  AND role_id IN (
    SELECT id FROM roles 
    WHERE name IN (
        'admin', 
        'blogger', 
        'content_editor', 
        'program_manager', 
        'marketing_officer', 
        'analyst'
    )
  )
  AND role != 'admin';

-- 3. Verify the fix
SELECT 
    '✅ Fixed Users' as status,
    COUNT(*) as count
FROM users
WHERE role = 'admin' 
  AND role_id IS NOT NULL;

-- 4. Check if any staff users still have wrong role
SELECT 
    '❌ Users Still Need Fix' as status,
    u.id,
    u.username,
    u.role,
    r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.role_id IS NOT NULL 
  AND u.role != 'admin'
  AND r.name IN ('admin', 'blogger', 'content_editor', 'program_manager', 'marketing_officer', 'analyst');

-- 5. Ensure user_roles table is populated
-- Insert into user_roles if not exists
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, u.role_id
FROM users u
WHERE u.role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = u.role_id
  );

-- 6. Verify user_roles table
SELECT 
    '✅ User Roles Populated' as status,
    COUNT(*) as count
FROM user_roles;

-- 7. Show final state with permissions count
SELECT 
    u.id,
    u.username,
    u.email,
    u.role as role_column,
    r.name as role_name,
    r.display_name,
    COUNT(DISTINCT rp.permission_id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
WHERE u.role_id IS NOT NULL
GROUP BY u.id, u.username, u.email, u.role, r.name, r.display_name
ORDER BY u.id;

-- 8. Show permissions for each role
SELECT 
    r.name as role_name,
    r.display_name,
    COUNT(rp.permission_id) as total_permissions,
    GROUP_CONCAT(p.name SEPARATOR ', ') as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('admin', 'blogger', 'content_editor', 'program_manager', 'marketing_officer', 'analyst')
GROUP BY r.id, r.name, r.display_name
ORDER BY r.id;

-- ============================================================================
-- Expected Results After Running This Script:
-- ============================================================================
-- ✅ All staff users will have role='admin' 
-- ✅ All staff users can access /admin dashboard
-- ✅ Permissions determined by role_id (not role column)
-- ✅ Admin (role_id=7): Gets ALL permissions from backend
-- ✅ Blogger (role_id=12): Gets only blogger permissions
-- ✅ Content Editor (role_id=8): Gets only content editor permissions
-- ✅ Program Manager (role_id=9): Gets only program manager permissions
-- ✅ Marketing Officer (role_id=10): Gets only marketing permissions
-- ✅ Analyst (role_id=11): Gets only analytics permissions
-- ============================================================================
