-- Complete RBAC System Cleanup and Setup
-- This migration cleans up redundant columns and ensures a clean RBAC implementation

USE devco_db;

-- Step 1: Clean up redundant columns from users table
-- These columns are redundant because we have proper RBAC tables (user_roles, role_permissions, user_permissions)
ALTER TABLE users
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS permissions,
  DROP COLUMN IF EXISTS role_id,
  DROP COLUMN IF EXISTS permissions_json;

-- Step 2: Add missing permissions for Tools & Curriculum
INSERT IGNORE INTO permissions (name, display_name, description, category, module, created_at) VALUES

-- Tools & Curriculum permissions
('curriculum.view', 'View Curriculum', 'Can view curriculum and tools', 'curriculum', 'curriculum', NOW()),
('curriculum.create', 'Create Curriculum', 'Can create curriculum items', 'curriculum', 'curriculum', NOW()),
('curriculum.edit', 'Edit Curriculum', 'Can edit curriculum items', 'curriculum', 'curriculum', NOW()),
('curriculum.delete', 'Delete Curriculum', 'Can delete curriculum items', 'curriculum', 'curriculum', NOW()),

('tools.view', 'View Tools', 'Can view tools configuration', 'tools', 'tools', NOW()),
('tools.create', 'Create Tools', 'Can create tools', 'tools', 'tools', NOW()),
('tools.edit', 'Edit Tools', 'Can edit tools', 'tools', 'tools', NOW()),
('tools.delete', 'Delete Tools', 'Can delete tools', 'tools', 'tools', NOW());

-- Step 3: Update role permissions to include new permissions

-- Admin gets all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete');

-- Content Editor gets view permissions for curriculum and tools
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'content_editor'
AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete');

-- Program Manager gets all curriculum and tools permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'program_manager'
AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete');

-- Step 4: Ensure all existing users with legacy role 'admin' are assigned to admin role in user_roles
INSERT IGNORE INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- Step 5: Clean up user_permissions table (we'll use role-based permissions primarily)
-- Keep the table for future fine-grained permissions but clear current data
TRUNCATE TABLE user_permissions;

-- Step 6: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Verification queries
SELECT 'Roles:' as info, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Permissions:', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role Permissions:', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'User Roles:', COUNT(*) FROM user_roles
UNION ALL
SELECT 'Users:', COUNT(*) FROM users;
