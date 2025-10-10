<?php
/**
 * Check what permissions blogger has that might grant access to user roles
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

// Get blogger role permissions
$stmt = $db->query("
    SELECT p.name, p.display_name, p.module
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'blogger'
    ORDER BY p.name
");

$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Blogger Role Permissions:\n";
echo "========================\n\n";

$userPerms = [];
foreach ($permissions as $perm) {
    if (strpos($perm['name'], 'user') !== false || $perm['module'] === 'users') {
        $userPerms[] = $perm;
    }
    echo "- {$perm['name']} ({$perm['display_name']}) [Module: {$perm['module']}]\n";
}

echo "\n\nUser-related permissions:\n";
echo "========================\n";
if (empty($userPerms)) {
    echo "NONE - Blogger should NOT see User Roles tab\n";
} else {
    foreach ($userPerms as $perm) {
        echo "- {$perm['name']} ({$perm['display_name']})\n";
    }
}

// Check what the frontend tab expects
echo "\n\nFrontend User Roles Tab Requirements:\n";
echo "=====================================\n";
echo "Permissions: ['users.view', 'users.manage_permissions']\n";
echo "Modules: ['users']\n\n";

echo "Current Logic: Shows tab if user has ANY of the permissions (using .some())\n";
echo "Should be: Shows tab ONLY if user has ALL required permissions (using .every())\n";
echo "  OR: Tab should require only ONE specific permission\n";
