<?php
/**
 * Debug and Fix Permission Loading
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Debugging Permission Loading ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $userId = 36; // koromaemmanuel66

    // Check user_permissions table directly
    echo "1. Checking user_permissions table:\n";
    $stmt = $db->prepare("SELECT * FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$userId]);
    $directPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Found " . count($directPerms) . " records in user_permissions\n";
    foreach ($directPerms as $perm) {
        echo "   - {$perm['permission']} (granted at {$perm['granted_at']})\n";
    }
    echo "\n";

    // Check permissions table
    echo "2. Checking permissions table:\n";
    $stmt = $db->query("SELECT COUNT(*) as count FROM permissions");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total permissions in system: {$count['count']}\n\n";

    // Check the join
    echo "3. Testing JOIN query:\n";
    $stmt = $db->prepare("
        SELECT up.permission, p.name, p.display_name, p.category
        FROM user_permissions up
        LEFT JOIN permissions p ON up.permission = p.name
        WHERE up.user_id = ?
    ");
    $stmt->execute([$userId]);
    $joinedPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   JOIN result: " . count($joinedPerms) . " rows\n";
    foreach ($joinedPerms as $jp) {
        echo "   - UP: {$jp['permission']} => P: " . ($jp['name'] ?? 'NULL') . "\n";
    }
    echo "\n";

    // Check for name mismatches
    echo "4. Checking for mismatches:\n";
    $stmt = $db->query("SELECT DISTINCT name FROM permissions ORDER BY name");
    $allPermNames = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "   Sample permission names in permissions table:\n";
    foreach (array_slice($allPermNames, 0, 5) as $name) {
        echo "   - '{$name}'\n";
    }
    echo "\n";

    if (!empty($directPerms)) {
        echo "   Permission names in user_permissions:\n";
        foreach (array_slice($directPerms, 0, 5) as $perm) {
            echo "   - '{$perm['permission']}'\n";
            
            // Check if it exists in permissions table
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM permissions WHERE name = ?");
            $stmt->execute([$perm['permission']]);
            $exists = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "     Exists in permissions table: " . ($exists['count'] > 0 ? 'YES' : 'NO') . "\n";
        }
    }
    echo "\n";

    // Fix: Re-insert permissions with correct names
    echo "5. Fixing permissions...\n";
    
    // Clear existing
    $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$userId]);
    echo "   Cleared old permissions\n";

    // Get exact permission names from permissions table
    $editorPermNames = [
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

    $inserted = 0;
    $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
    
    foreach ($editorPermNames as $permName) {
        // Verify permission exists
        $checkStmt = $db->prepare("SELECT name FROM permissions WHERE name = ?");
        $checkStmt->execute([$permName]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists) {
            $stmt->execute([$userId, $permName]);
            $inserted++;
            echo "   ✓ Inserted: {$permName}\n";
        } else {
            echo "   ✗ Permission not found in system: {$permName}\n";
        }
    }
    
    echo "   Total inserted: {$inserted}\n\n";

    // Update permissions_json
    echo "6. Updating permissions_json column...\n";
    $stmt = $db->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$userId]);
    $permsList = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!empty($permsList)) {
        $permsJson = json_encode($permsList);
        $stmt = $db->prepare("UPDATE users SET permissions_json = ? WHERE id = ?");
        $stmt->execute([$permsJson, $userId]);
        echo "   ✓ Updated permissions_json with " . count($permsList) . " permissions\n\n";
    }

    // Final test
    echo "7. Final verification:\n";
    $stmt = $db->prepare("
        SELECT DISTINCT p.name, p.display_name, p.category, p.description
        FROM user_permissions up
        JOIN permissions p ON up.permission = p.name
        WHERE up.user_id = ?
        ORDER BY p.category, p.name
    ");
    $stmt->execute([$userId]);
    $finalPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Final permission count: " . count($finalPerms) . "\n";
    
    if (!empty($finalPerms)) {
        $grouped = [];
        foreach ($finalPerms as $perm) {
            $cat = $perm['category'] ?? 'general';
            if (!isset($grouped[$cat])) {
                $grouped[$cat] = [];
            }
            $grouped[$cat][] = $perm['name'];
        }
        
        foreach ($grouped as $category => $perms) {
            echo "\n   📁 {$category}:\n";
            foreach ($perms as $permName) {
                echo "      ✓ {$permName}\n";
            }
        }
    }

    echo "\n\n✅ Permission fix complete!\n";
    echo "User koromaemmanuel66@gmail.com now has " . count($finalPerms) . " permissions.\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
