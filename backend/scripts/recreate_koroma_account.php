<?php
/**
 * Delete and Recreate koromaemmanuel66@gmail.com via Invite System
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;
use App\Services\PermissionService;

try {
    echo "\n=== Delete and Recreate Account ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';

    // Step 1: Delete existing account
    echo "Step 1: Deleting existing account...\n";
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        // Delete from user_permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$existingUser['id']]);
        echo "  ✓ Deleted permissions\n";

        // Delete from users
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$existingUser['id']]);
        echo "  ✓ Deleted user account\n";
    } else {
        echo "  No existing account found\n";
    }

    echo "\n";

    // Step 2: Get editor role ID
    echo "Step 2: Getting editor role...\n";
    $stmt = $db->query("SELECT id, name FROM roles WHERE name = 'editor' LIMIT 1");
    $editorRole = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$editorRole) {
        echo "  ✗ Editor role not found!\n";
        exit(1);
    }

    echo "  ✓ Editor role ID: {$editorRole['id']}\n\n";

    // Step 3: Generate username and password
    echo "Step 3: Generating credentials...\n";
    $username = 'koromaemmanuel';
    $tempPassword = bin2hex(random_bytes(8)); // Generate random password
    $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

    echo "  Username: {$username}\n";
    echo "  Password: {$tempPassword}\n\n";

    // Step 4: Create user account
    echo "Step 4: Creating new user account...\n";
    $stmt = $db->prepare("
        INSERT INTO users (
            username, email, password_hash, role_id, role, 
            organization_id, status, must_change_password, 
            email_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 0, 1, NOW())
    ");
    
    // Map role for old 'role' column
    $oldRoleValue = 'user'; // editor is not admin, so use 'user'
    
    $stmt->execute([
        $username, 
        $email, 
        $passwordHash, 
        $editorRole['id'], 
        $oldRoleValue,
        null // organization_id
    ]);
    
    $newUserId = $db->lastInsertId();
    echo "  ✓ User created with ID: {$newUserId}\n\n";

    // Step 5: Assign editor permissions
    echo "Step 5: Assigning editor permissions...\n";
    
    $permissionService = new PermissionService($db);
    
    // Get admin user for granted_by
    $stmt = $db->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    $grantedBy = $admin ? $admin['id'] : $newUserId;

    // Assign role permissions
    $result = $permissionService->assignRolePermissionsToUser($newUserId, $editorRole['id'], $grantedBy);
    
    if (!$result) {
        echo "  ! Using manual permission assignment...\n";
        
        // Manual assignment as fallback
        $editorPermissions = [
            'dashboard.view',
            'content.view',
            'content.create',
            'content.edit',
            'content.delete',
            'content.publish',
            'announcements.view',
            'announcements.create',
            'announcements.edit'
        ];

        $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
        $count = 0;
        foreach ($editorPermissions as $perm) {
            // Verify permission exists
            $checkStmt = $db->prepare("SELECT name FROM permissions WHERE name = ?");
            $checkStmt->execute([$perm]);
            if ($checkStmt->fetch()) {
                $stmt->execute([$newUserId, $perm]);
                $count++;
            }
        }
        echo "  ✓ Assigned {$count} permissions manually\n";
    } else {
        // Count permissions
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$newUserId]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "  ✓ Assigned {$count} permissions via role\n";
    }

    // Update permissions_json
    $stmt = $db->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$newUserId]);
    $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!empty($perms)) {
        $permsJson = json_encode($perms);
        $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
        $stmt->execute([$permsJson, $newUserId]);
        echo "  ✓ Updated permissions_json\n";
    }

    echo "\n";

    // Step 6: Verify the account
    echo "Step 6: Verifying new account...\n";
    $stmt = $db->prepare("
        SELECT u.id, u.username, u.email, u.role, u.status, 
               u.email_verified, r.name as role_name, 
               COUNT(up.id) as perm_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.id = ?
        GROUP BY u.id
    ");
    $stmt->execute([$newUserId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "\n" . str_repeat("=", 70) . "\n";
    echo "NEW ACCOUNT CREATED SUCCESSFULLY\n";
    echo str_repeat("=", 70) . "\n";
    echo "User ID:         {$user['id']}\n";
    echo "Username:        {$user['username']}\n";
    echo "Email:           {$user['email']}\n";
    echo "Password:        {$tempPassword}\n";
    echo "Role:            {$user['role_name']}\n";
    echo "Status:          {$user['status']}\n";
    echo "Email Verified:  " . ($user['email_verified'] ? 'Yes' : 'No') . "\n";
    echo "Permissions:     {$user['perm_count']}\n";
    echo str_repeat("=", 70) . "\n\n";

    // Test password
    echo "Step 7: Testing password...\n";
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$newUserId]);
    $hash = $stmt->fetchColumn();
    
    if (password_verify($tempPassword, $hash)) {
        echo "  ✓ Password verification successful\n\n";
    } else {
        echo "  ✗ Password verification failed!\n\n";
    }

    // Show permissions
    echo "Step 8: Assigned permissions:\n";
    $stmt = $db->prepare("
        SELECT p.name, p.display_name, p.category
        FROM user_permissions up
        JOIN permissions p ON up.permission = p.name
        WHERE up.user_id = ?
        ORDER BY p.category, p.name
    ");
    $stmt->execute([$newUserId]);
    $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $grouped = [];
    foreach ($permissions as $perm) {
        $cat = $perm['category'] ?? 'general';
        if (!isset($grouped[$cat])) {
            $grouped[$cat] = [];
        }
        $grouped[$cat][] = $perm['display_name'];
    }

    foreach ($grouped as $category => $perms) {
        echo "  📁 {$category}:\n";
        foreach ($perms as $permName) {
            echo "     ✓ {$permName}\n";
        }
    }

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║              LOGIN CREDENTIALS                             ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    echo "  Email:    koromaemmanuel66@gmail.com\n";
    echo "  Password: {$tempPassword}\n";
    echo "  Login at: /admin\n";
    echo "  Role:     Content Editor\n";
    echo "  Access:   Dashboard, Content, Announcements\n\n";

    echo "✅ Account ready to use!\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
