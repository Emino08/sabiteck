-- Set koromaemmanuel66@gmail.com as content editor with proper permissions

-- Update user to editor role (ID: 2)
UPDATE users 
SET role_id = 2, 
    role = 'user',  -- Keep as 'user' for enum compatibility
    updated_at = NOW()
WHERE email = 'koromaemmanuel66@gmail.com';

-- Clear existing permissions
DELETE FROM user_permissions 
WHERE user_id = (SELECT id FROM users WHERE email = 'koromaemmanuel66@gmail.com');

-- Add editor permissions
INSERT INTO user_permissions (user_id, permission, granted_at)
SELECT 
    u.id,
    p.name,
    NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.email = 'koromaemmanuel66@gmail.com'
AND p.name IN (
    'View Dashboard',
    'View Content',
    'Create Content',
    'Edit Content',
    'Delete Content',
    'Publish Content',
    'View Portfolio',
    'Create Portfolio',
    'Edit Portfolio',
    'View Announcements',
    'Create Announcements',
    'Edit Announcements',
    'Edit Announcements'
);

-- Update permissions_json for faster access
UPDATE users u
SET permissions_json = (
    SELECT JSON_ARRAYAGG(permission)
    FROM user_permissions up
    WHERE up.user_id = u.id
)
WHERE u.email = 'koromaemmanuel66@gmail.com';

-- Verify
SELECT 
    u.username,
    u.email,
    u.role,
    r.name as role_name,
    COUNT(up.id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email = 'koromaemmanuel66@gmail.com'
GROUP BY u.id;

-- Show permissions
SELECT up.permission
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.email = 'koromaemmanuel66@gmail.com'
ORDER BY up.permission;
