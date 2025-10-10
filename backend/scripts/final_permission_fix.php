<?php
/**
 * Final Permission Fix - Set Proper Roles and Permissions
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Final Permission Fix ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    // Step 1: Set koromaemmanuel66@gmail.com as EDITOR (not admin)
    echo "Step 1: Setting koromaemmanuel66@gmail.com as Content Editor...\n";
    
    $editorRoleId = 2; // editor role ID
    
    $stmt = $db->prepare("UPDATE users SET role_id = ?, role = 'user', updated_at = NOW() WHERE email = ?");
    $stmt->execute([$editorRoleId, 'koromaemmanuel66@gmail.com']);
    echo "  ✓ Set role to editor (ID: 2)\n";

    // Clear existing permissions
    $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = (SELECT id FROM users WHERE email = ?)");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    echo "  ✓ Cleared old permissions\n";

    // Add editor permissions
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

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $koromaUserId = $stmt->fetchColumn();

    $insertStmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
    $permCount = 0;
    foreach ($editorPermissions as $perm) {
        try {
            $insertStmt->execute([$koromaUserId, $perm]);
            $permCount++;
        } catch (Exception $e) {
            // Permission might already exist
        }
    }
    echo "  ✓ Assigned {$permCount} editor permissions\n";

    // Update permissions_json
    $stmt = $db->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$koromaUserId]);
    $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $permsJson = json_encode($perms);
    
    $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
    $stmt->execute([$permsJson, $koromaUserId]);
    echo "  ✓ Updated permissions_json\n\n";

    // Step 2: Ensure ALL admin users have ALL permissions
    echo "Step 2: Ensuring admin users have ALL permissions...\n";
    
    $stmt = $db->query("SELECT id, username, email FROM users WHERE role IN ('admin', 'super_admin')");
    $adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all permissions
    $stmt = $db->query("SELECT name FROM permissions ORDER BY name");
    $allPerms = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($adminUsers as $admin) {
        // Clear existing
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);

        // Add all permissions
        $insertStmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
        $count = 0;
        foreach ($allPerms as $perm) {
            try {
                $insertStmt->execute([$admin['id'], $perm]);
                $count++;
            } catch (Exception $e) {
                // Skip duplicates
            }
        }

        // Update permissions_json
        $permsJson = json_encode($allPerms);
        $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
        $stmt->execute([$permsJson, $admin['id']]);

        echo "  ✓ {$admin['username']} - {$count} permissions\n";
    }

    echo "\n";

    // Step 3: Verification
    echo "Step 3: Final Verification...\n\n";
    
    $stmt = $db->query("
        SELECT 
            u.username,
            u.email,
            u.role,
            r.name as role_name,
            COUNT(up.id) as perm_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.email IN ('admin@sabiteck.com', 'koromaemmanuel66@gmail.com')
           OR u.role IN ('admin', 'super_admin')
        GROUP BY u.id
        ORDER BY u.id
    ");
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo str_repeat("-", 90) . "\n";
    printf("%-20s %-30s %-15s %s\n", "Username", "Email", "Role", "Permissions");
    echo str_repeat("-", 90) . "\n";
    
    foreach ($results as $row) {
        printf("%-20s %-30s %-15s %d\n", 
            substr($row['username'], 0, 19),
            substr($row['email'], 0, 29),
            substr($row['role_name'] ?? $row['role'], 0, 14),
            $row['perm_count']
        );
    }
    echo str_repeat("-", 90) . "\n";

    echo "\n✓ Permission fix complete!\n\n";
    echo "IMPORTANT - Users MUST:\n";
    echo "  1. Log out completely\n";
    echo "  2. Clear browser cache/cookies\n";
    echo "  3. Log in again\n";
    echo "  4. Permissions will load and tabs will appear\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
