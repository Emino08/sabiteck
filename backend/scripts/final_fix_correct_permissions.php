<?php
/**
 * Final Fix - Assign Correct Permissions with Dot Notation
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Final Permission Fix with Correct Names ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    // Get all available permissions
    echo "1. Getting all available permissions from database...\n";
    $stmt = $db->query("SELECT name, display_name, category FROM permissions ORDER BY name");
    $allPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Found " . count($allPerms) . " total permissions\n";
    echo "   Sample:\n";
    foreach (array_slice($allPerms, 0, 10) as $p) {
        echo "   - {$p['name']} ({$p['display_name']})\n";
    }
    echo "\n";

    // Define editor permissions using correct dot notation
    $editorPermissionNames = [
        // Dashboard
        'dashboard.view',
        
        // Content
        'content.view',
        'content.create',
        'content.edit',
        'content.delete',
        'content.publish',
        
        // Portfolio
        'portfolio.view',
        'portfolio.create',
        'portfolio.edit',
        
        // Announcements
        'announcements.view',
        'announcements.create',
        'announcements.edit'
    ];

    // Fix koromaemmanuel66@gmail.com
    echo "2. Fixing koromaemmanuel66@gmail.com...\n";
    $stmt = $db->prepare("SELECT id, username, email FROM users WHERE email = ?");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "   ✗ User not found!\n";
        exit(1);
    }

    echo "   ✓ User found: {$user['username']} (ID: {$user['id']})\n\n";

    // Clear existing permissions
    echo "3. Clearing old permissions...\n";
    $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    echo "   ✓ Cleared\n\n";

    // Insert correct permissions
    echo "4. Inserting editor permissions...\n";
    $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
    $inserted = 0;
    $notFound = [];

    foreach ($editorPermissionNames as $permName) {
        // Verify it exists
        $checkStmt = $db->prepare("SELECT name, display_name FROM permissions WHERE name = ?");
        $checkStmt->execute([$permName]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists) {
            $stmt->execute([$user['id'], $permName]);
            $inserted++;
            echo "   ✓ {$permName} ({$exists['display_name']})\n";
        } else {
            $notFound[] = $permName;
            echo "   ✗ NOT FOUND: {$permName}\n";
        }
    }
    
    echo "\n   Inserted: {$inserted} permissions\n";
    if (!empty($notFound)) {
        echo "   Not found: " . implode(', ', $notFound) . "\n";
    }
    echo "\n";

    // Update permissions_json
    echo "5. Updating permissions_json...\n";
    $stmt = $db->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $permsList = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $permsJson = json_encode($permsList);
    $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
    $stmt->execute([$permsJson, $user['id']]);
    echo "   ✓ Updated\n\n";

    // Fix ALL admin users too
    echo "6. Fixing admin users...\n";
    $stmt = $db->query("SELECT id, username, email FROM users WHERE role IN ('admin', 'super_admin')");
    $adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($adminUsers as $admin) {
        // Clear
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);

        // Insert ALL permissions
        $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
        $count = 0;
        foreach ($allPerms as $perm) {
            $stmt->execute([$admin['id'], $perm['name']]);
            $count++;
        }

        // Update JSON
        $allPermNames = array_column($allPerms, 'name');
        $permsJson = json_encode($allPermNames);
        $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
        $stmt->execute([$permsJson, $admin['id']]);

        echo "   ✓ {$admin['username']} - {$count} permissions\n";
    }
    echo "\n";

    // Final verification
    echo "7. Final Verification...\n\n";
    $stmt = $db->query("
        SELECT u.username, u.email, u.role, COUNT(up.id) as perm_count
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.email IN ('admin@sabiteck.com', 'koromaemmanuel66@gmail.com')
           OR u.role IN ('admin', 'super_admin')
        GROUP BY u.id
        ORDER BY u.id
    ");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo str_repeat("-", 80) . "\n";
    printf("%-20s %-30s %-15s %s\n", "Username", "Email", "Role", "Permissions");
    echo str_repeat("-", 80) . "\n";
    foreach ($results as $row) {
        printf("%-20s %-30s %-15s %d\n",
            substr($row['username'], 0, 19),
            substr($row['email'], 0, 29),
            $row['role'],
            $row['perm_count']
        );
    }
    echo str_repeat("-", 80) . "\n\n";

    echo "✅ ALL PERMISSIONS FIXED!\n\n";
    echo "Login Credentials:\n";
    echo "  Email:    koromaemmanuel66@gmail.com\n";
    echo "  Password: 5f0e5d6db76e5591\n";
    echo "  Role:     Content Editor\n";
    echo "  Status:   READY\n\n";

    echo "⚠️  Users MUST:\n";
    echo "  1. Logout completely\n";
    echo "  2. Clear browser cache\n";
    echo "  3. Login again\n";
    echo "  4. Tabs will now appear!\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
