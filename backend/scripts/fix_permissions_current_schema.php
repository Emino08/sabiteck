<?php
/**
 * Fix User Permissions - Adapted for Current Database Structure
 * 
 * Works with the existing database schema
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Fixing User Permissions (Adapted) ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    // Step 1: Check current state
    echo "Step 1: Checking current user permissions...\n";
    $stmt = $db->query("
        SELECT 
            u.id,
            u.username,
            u.email,
            u.role,
            u.role_id,
            r.name as role_name,
            COUNT(up.id) as current_permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.status = 'active' OR u.status IS NULL
        GROUP BY u.id
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($users) . " users:\n";
    foreach ($users as $user) {
        echo sprintf("  - %s (%s) - Role: %s (ID: %s) - Current Permissions: %d\n", 
            $user['username'], 
            $user['email'], 
            $user['role_name'] ?? $user['role'], 
            $user['role_id'] ?? 'NULL',
            $user['current_permissions']
        );
    }
    echo "\n";

    // Step 2: Get all available permissions
    echo "Step 2: Getting all available permissions...\n";
    $stmt = $db->query("SELECT id, name, display_name, category FROM permissions ORDER BY category, name");
    $allPermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($allPermissions) . " permissions in the system\n\n";

    // Step 3: Fix koromaemmanuel66@gmail.com user
    echo "Step 3: Fixing koromaemmanuel66@gmail.com user...\n";
    $stmt = $db->prepare("SELECT id, username, email, role, role_id FROM users WHERE email = ?");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $koromaUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($koromaUser) {
        echo "  Found user: {$koromaUser['username']}\n";
        
        // Get editor role (ID: 2 based on the structure check)
        $editorRoleId = 2; // editor role
        
        // Update user's role_id if not set
        if ($koromaUser['role_id'] != $editorRoleId) {
            $stmt = $db->prepare("UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$editorRoleId, $koromaUser['id']]);
            echo "  ✓ Updated role_id to {$editorRoleId} (editor)\n";
        } else {
            echo "  ✓ Role already set to editor\n";
        }

        // Clear existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$koromaUser['id']]);
        echo "  ✓ Cleared old permissions\n";

        // Assign editor permissions
        $editorPermissions = [
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
            'Edit Announcements'
        ];

        $permCount = 0;
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission, granted_at)
            VALUES (?, ?, NOW())
        ");

        foreach ($editorPermissions as $permName) {
            try {
                $stmt->execute([$koromaUser['id'], $permName]);
                $permCount++;
            } catch (Exception $e) {
                echo "    ! Could not add permission: {$permName}\n";
            }
        }

        echo "  ✓ Assigned {$permCount} permissions\n";
    } else {
        echo "  ! User koromaemmanuel66@gmail.com not found\n";
    }
    echo "\n";

    // Step 4: Fix all admin users
    echo "Step 4: Fixing admin users (ensuring ALL permissions)...\n";
    $stmt = $db->query("
        SELECT u.id, u.username, u.email
        FROM users u
        WHERE u.role IN ('admin', 'super_admin')
        AND (u.status = 'active' OR u.status IS NULL)
    ");
    $adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($adminUsers) . " admin users\n";
    
    foreach ($adminUsers as $admin) {
        // Clear existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);

        // Assign ALL permissions
        $permCount = 0;
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission, granted_at)
            VALUES (?, ?, NOW())
        ");

        foreach ($allPermissions as $perm) {
            try {
                $stmt->execute([$admin['id'], $perm['name']]);
                $permCount++;
            } catch (Exception $e) {
                // Skip if permission already exists
            }
        }
        
        echo "  ✓ {$admin['username']} ({$admin['email']}) - Assigned {$permCount} permissions\n";
    }
    echo "\n";

    // Step 5: Update permissions_json column for faster access
    echo "Step 5: Updating permissions_json column for all users...\n";
    foreach ($users as $user) {
        // Get user's permissions
        $stmt = $db->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $userPerms = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($userPerms)) {
            $permsJson = json_encode($userPerms);
            $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
            $stmt->execute([$permsJson, $user['id']]);
            echo "  ✓ Updated permissions_json for {$user['username']}\n";
        }
    }
    echo "\n";

    // Step 6: Final Verification
    echo "Step 6: Final Verification...\n";
    $stmt = $db->query("
        SELECT 
            u.id,
            u.username,
            u.email,
            u.role,
            r.name as role_name,
            COUNT(up.id) as permissions_assigned
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.status = 'active' OR u.status IS NULL
        GROUP BY u.id
        ORDER BY u.id
    ");
    $finalUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\nFinal State:\n";
    echo str_repeat("-", 90) . "\n";
    printf("%-15s %-30s %-15s %s\n", "Username", "Email", "Role", "Permissions");
    echo str_repeat("-", 90) . "\n";
    
    foreach ($finalUsers as $user) {
        printf("%-15s %-30s %-15s %d\n", 
            substr($user['username'], 0, 14),
            substr($user['email'], 0, 29),
            substr($user['role_name'] ?? $user['role'], 0, 14),
            $user['permissions_assigned']
        );
    }
    echo str_repeat("-", 90) . "\n";

    echo "\n✓ All user permissions have been fixed!\n\n";
    echo "Next steps:\n";
    echo "1. Users should log out and log back in\n";
    echo "2. Permissions will be loaded from user_permissions table\n";
    echo "3. UI tabs will appear based on these permissions\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
