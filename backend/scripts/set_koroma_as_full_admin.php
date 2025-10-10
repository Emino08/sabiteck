<?php
/**
 * Fix koromaemmanuel66@gmail.com - Set as Admin
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Setting koromaemmanuel66@gmail.com as Admin ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';

    // Step 1: Check current state
    echo "Step 1: Current user state...\n";
    $stmt = $db->prepare("SELECT id, username, email, role, role_id, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "  ✗ User not found!\n";
        exit(1);
    }

    echo "  Current role: {$user['role']}\n";
    echo "  Current role_id: {$user['role_id']}\n";
    echo "  Current status: {$user['status']}\n\n";

    // Step 2: Get admin role ID
    echo "Step 2: Getting admin role ID...\n";
    $stmt = $db->query("SELECT id, name FROM roles WHERE name IN ('admin', 'Admin') ORDER BY id LIMIT 1");
    $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$adminRole) {
        echo "  ✗ Admin role not found!\n";
        exit(1);
    }

    echo "  Admin role ID: {$adminRole['id']}\n";
    echo "  Admin role name: {$adminRole['name']}\n\n";

    // Step 3: Update user to admin
    echo "Step 3: Updating user to admin...\n";
    $stmt = $db->prepare("
        UPDATE users 
        SET role = 'admin', 
            role_id = ?,
            status = 'active',
            email_verified = 1,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$adminRole['id'], $user['id']]);
    echo "  ✓ User role updated to admin\n\n";

    // Step 4: Clear and assign ALL permissions
    echo "Step 4: Assigning ALL admin permissions...\n";
    
    // Clear existing permissions
    $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    echo "  ✓ Cleared old permissions\n";

    // Get all permissions
    $stmt = $db->query("SELECT name FROM permissions ORDER BY name");
    $allPermissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Insert all permissions
    $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
    $count = 0;
    foreach ($allPermissions as $perm) {
        $stmt->execute([$user['id'], $perm]);
        $count++;
    }
    echo "  ✓ Assigned {$count} permissions\n";

    // Update permissions_json
    $permsJson = json_encode($allPermissions);
    $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
    $stmt->execute([$permsJson, $user['id']]);
    echo "  ✓ Updated permissions_json\n\n";

    // Step 5: Verify final state
    echo "Step 5: Final verification...\n";
    $stmt = $db->prepare("
        SELECT u.id, u.username, u.email, u.role, u.role_id, u.status, r.name as role_name, COUNT(up.id) as perm_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.email = ?
        GROUP BY u.id
    ");
    $stmt->execute([$email]);
    $finalUser = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "\n" . str_repeat("-", 70) . "\n";
    echo "Username:     {$finalUser['username']}\n";
    echo "Email:        {$finalUser['email']}\n";
    echo "Role:         {$finalUser['role']}\n";
    echo "Role Name:    {$finalUser['role_name']}\n";
    echo "Status:       {$finalUser['status']}\n";
    echo "Permissions:  {$finalUser['perm_count']}\n";
    echo str_repeat("-", 70) . "\n\n";

    echo "✅ SUCCESS! koromaemmanuel66@gmail.com is now a FULL ADMIN\n\n";
    echo "Login Details:\n";
    echo "  Email:    koromaemmanuel66@gmail.com\n";
    echo "  Password: 5f0e5d6db76e5591\n";
    echo "  Login at: /admin ONLY\n";
    echo "  Access:   Full admin dashboard\n";
    echo "  Permissions: ALL {$finalUser['perm_count']} permissions\n\n";

    echo "⚠️  User MUST:\n";
    echo "  1. Logout if currently logged in\n";
    echo "  2. Clear browser cache\n";
    echo "  3. Login again at /admin\n";
    echo "  4. Will now have full admin access\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
