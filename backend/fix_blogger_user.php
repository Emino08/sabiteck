<?php
/**
 * Fix blogger user - ensure role and permissions are correct
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "Fixing Blogger User\n";
echo "===================\n\n";

// Get blogger user
$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = 'encictyear1@gmail.com'
");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    die("User not found\n");
}

echo "User: {$user['username']} (ID: {$user['id']})\n";
echo "Current role column: {$user['role']}\n";
echo "Current role_id: {$user['role_id']}\n";
echo "Current role_name from join: {$user['role_name']}\n\n";

// Fix 1: Update role column to match role_id
echo "Step 1: Updating role column to 'blogger'...\n";
$stmt = $db->prepare("UPDATE users SET role = 'blogger' WHERE id = ?");
$stmt->execute([$user['id']]);
echo "✓ Role column updated\n\n";

// Fix 2: Ensure user_roles entry exists
echo "Step 2: Ensuring user_roles entry exists...\n";
$stmt = $db->prepare("SELECT COUNT(*) as count FROM user_roles WHERE user_id = ? AND role_id = ?");
$stmt->execute([$user['id'], $user['role_id']]);
$exists = $stmt->fetch()['count'] > 0;

if (!$exists) {
    $stmt = $db->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
    $stmt->execute([$user['id'], $user['role_id']]);
    echo "✓ user_roles entry created\n\n";
} else {
    echo "✓ user_roles entry already exists\n\n";
}

// Verify fix
echo "Verification\n";
echo "============\n";

$stmt = $db->prepare("
    SELECT u.id, u.username, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
");
$stmt->execute([$user['id']]);
$updated = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Updated user:\n";
echo "  Username: {$updated['username']}\n";
echo "  Role column: {$updated['role']}\n";
echo "  Role ID: {$updated['role_id']}\n";
echo "  Role name: {$updated['role_name']}\n\n";

// Check user_roles
$stmt = $db->prepare("SELECT role_id FROM user_roles WHERE user_id = ?");
$stmt->execute([$user['id']]);
$roleIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "  user_roles entries: " . implode(', ', $roleIds) . "\n\n";

// Check permissions
require_once __DIR__ . '/src/Services/PermissionService.php';
$permissionService = new \App\Services\PermissionService($db);

$permissions = $permissionService->getUserPermissions($user['id']);
echo "  Total permissions: " . count($permissions) . "\n";
echo "  Expected for blogger: 15\n\n";

if (count($permissions) != 15) {
    echo "⚠ Warning: Permission count mismatch!\n";
    echo "  This user may have permissions from the admin role still cached.\n";
    echo "  The user needs to logout and login again to refresh their JWT token.\n";
} else {
    echo "✓ All correct!\n";
}

echo "\n";
echo "Fix complete! User should logout and login again to get fresh JWT token with correct permissions.\n";
