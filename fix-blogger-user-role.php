<?php
/**
 * Fix blogger user role inconsistency
 * The user has role='admin' but role_name='blogger' which is causing issues
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== FIXING BLOGGER USER ROLE INCONSISTENCY ===\n\n";

// Find the problematic user
$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = 46
");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "ERROR: User ID 46 not found!\n";
    exit(1);
}

echo "Current User State:\n";
echo "  ID: {$user['id']}\n";
echo "  Username: {$user['username']}\n";
echo "  Email: {$user['email']}\n";
echo "  role column: {$user['role']}\n";
echo "  role_id column: {$user['role_id']}\n";
echo "  role_name (from join): {$user['role_name']}\n\n";

// Get blogger role ID
$stmt = $db->query("SELECT id, name FROM roles WHERE name = 'blogger'");
$bloggerRole = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bloggerRole) {
    echo "ERROR: Blogger role not found in roles table!\n";
    exit(1);
}

echo "Blogger Role:\n";
echo "  ID: {$bloggerRole['id']}\n";
echo "  Name: {$bloggerRole['name']}\n\n";

// Fix the user record
echo "Fixing user record...\n";
$updateStmt = $db->prepare("
    UPDATE users 
    SET role = ?, role_id = ? 
    WHERE id = ?
");
$updateStmt->execute([$bloggerRole['name'], $bloggerRole['id'], $user['id']]);

echo "✓ Updated user.role to '{$bloggerRole['name']}'\n";
echo "✓ Updated user.role_id to {$bloggerRole['id']}\n\n";

// Verify the fix
$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = 46
");
$updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Updated User State:\n";
echo "  ID: {$updatedUser['id']}\n";
echo "  Username: {$updatedUser['username']}\n";
echo "  Email: {$updatedUser['email']}\n";
echo "  role column: {$updatedUser['role']}\n";
echo "  role_id column: {$updatedUser['role_id']}\n";
echo "  role_name (from join): {$updatedUser['role_name']}\n\n";

if ($updatedUser['role'] === 'blogger' && $updatedUser['role_name'] === 'blogger') {
    echo "✓✓✓ SUCCESS! User role is now consistent.\n\n";
    echo "Next steps:\n";
    echo "1. User must logout and login again\n";
    echo "2. The new JWT token will have the correct role\n";
    echo "3. Frontend will filter tabs based on blogger permissions\n";
} else {
    echo "❌ ERROR: Role still inconsistent!\n";
}
