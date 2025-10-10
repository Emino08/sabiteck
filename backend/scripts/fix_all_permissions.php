<?php
/**
 * Fix User Permissions - Complete Script
 * 
 * This script ensures all users have proper permissions based on their roles
 * Specifically handles:
 * - Admin users get ALL permissions
 * - Content Editor role gets appropriate permissions
 * - All users with roles get their role permissions synced
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Fixing User Permissions ===\n\n";

    // Load environment variables
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();

    // Get database connection
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
            r.slug as role_slug,
            COUNT(up.id) as current_permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.status = 'active'
        GROUP BY u.id
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($users) . " active users:\n";
    foreach ($users as $user) {
        echo sprintf("  - %s (%s) - Role: %s - Current Permissions: %d\n", 
            $user['username'], 
            $user['email'], 
            $user['role_name'] ?? 'No role', 
            $user['current_permissions']
        );
    }
    echo "\n";

    // Step 2: Fix koromaemmanuel66@gmail.com user
    echo "Step 2: Fixing koromaemmanuel66@gmail.com user...\n";
    $stmt = $db->prepare("SELECT id, username, email, role, role_id FROM users WHERE email = ?");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $koromaUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($koromaUser) {
        echo "  Found user: {$koromaUser['username']}\n";
        
        // Get or create content editor role
        $stmt = $db->query("
            SELECT id, name, slug FROM roles 
            WHERE slug IN ('editor', 'content-editor', 'content-manager')
            ORDER BY 
                CASE 
                    WHEN slug = 'content-editor' THEN 1
                    WHEN slug = 'editor' THEN 2
                    ELSE 3
                END
            LIMIT 1
        ");
        $editorRole = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$editorRole) {
            echo "  ! Content Editor role not found. Creating it...\n";
            // Create content editor role if doesn't exist
            $db->exec("
                INSERT IGNORE INTO roles (name, slug, display_name, description, is_admin, is_active)
                VALUES ('Content Editor', 'content-editor', 'Content Editor', 'Manages and edits content', 0, 1)
            ");
            $editorRole = [
                'id' => $db->lastInsertId(),
                'name' => 'Content Editor',
                'slug' => 'content-editor'
            ];
            
            // Assign basic permissions to content editor role
            $db->exec("
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT {$editorRole['id']}, p.id
                FROM permissions p
                WHERE p.slug IN (
                    'view-dashboard', 
                    'view-content', 'create-content', 'edit-content', 'delete-content', 'publish-content',
                    'view-portfolio', 'create-portfolio', 'edit-portfolio',
                    'view-announcements', 'create-announcements', 'edit-announcements'
                )
            ");
        }

        // Update user's role_id
        if ($koromaUser['role_id'] != $editorRole['id']) {
            $stmt = $db->prepare("UPDATE users SET role_id = ?, role = 'user', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$editorRole['id'], $koromaUser['id']]);
            echo "  ✓ Updated role to {$editorRole['name']}\n";
        } else {
            echo "  ✓ Role already set to {$editorRole['name']}\n";
        }

        // Clear existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$koromaUser['id']]);
        echo "  ✓ Cleared old permissions\n";

        // Assign role permissions
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
            SELECT ?, rp.permission_id, 1, ?, NOW()
            FROM role_permissions rp
            WHERE rp.role_id = ?
        ");
        $stmt->execute([$koromaUser['id'], $koromaUser['id'], $editorRole['id']]);
        
        // Count assigned permissions
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$koromaUser['id']]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "  ✓ Assigned {$count} permissions from {$editorRole['name']} role\n";
    } else {
        echo "  ! User koromaemmanuel66@gmail.com not found\n";
    }
    echo "\n";

    // Step 3: Fix all admin users
    echo "Step 3: Fixing admin users (ensuring ALL permissions)...\n";
    $stmt = $db->query("
        SELECT u.id, u.username, u.email, r.slug as role_slug
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.slug IN ('admin', 'super-admin')
        AND u.status = 'active'
    ");
    $adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($adminUsers) . " admin users\n";
    
    foreach ($adminUsers as $admin) {
        // Clear existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);

        // Assign ALL permissions
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
            SELECT ?, p.id, 1, ?, NOW()
            FROM permissions p
        ");
        $stmt->execute([$admin['id'], $admin['id']]);

        // Count assigned permissions
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo "  ✓ {$admin['username']} ({$admin['email']}) - Assigned {$count} permissions\n";
    }
    echo "\n";

    // Step 4: Fix all other users with roles
    echo "Step 4: Syncing permissions for all other users...\n";
    $stmt = $db->query("
        SELECT u.id, u.username, u.email, u.role_id, r.name as role_name, r.slug
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.status = 'active'
        AND u.role_id IS NOT NULL
        AND r.slug NOT IN ('admin', 'super-admin')
    ");
    $otherUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($otherUsers) . " other users to sync\n";
    
    foreach ($otherUsers as $otherUser) {
        // Clear existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$otherUser['id']]);

        // Assign role permissions
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
            SELECT ?, rp.permission_id, 1, ?, NOW()
            FROM role_permissions rp
            WHERE rp.role_id = ?
        ");
        $stmt->execute([$otherUser['id'], $otherUser['id'], $otherUser['role_id']]);

        // Count assigned permissions
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$otherUser['id']]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo "  ✓ {$otherUser['username']} - {$otherUser['role_name']} - {$count} permissions\n";
    }
    echo "\n";

    // Step 5: Verification
    echo "Step 5: Final Verification...\n";
    $stmt = $db->query("
        SELECT 
            u.id,
            u.username,
            u.email,
            r.name as role_name,
            COUNT(up.id) as permissions_assigned
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.status = 'active'
        GROUP BY u.id
        ORDER BY u.id
    ");
    $finalUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\nFinal State:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-20s %-30s %-20s %s\n", "Username", "Email", "Role", "Permissions");
    echo str_repeat("-", 80) . "\n";
    
    foreach ($finalUsers as $user) {
        printf("%-20s %-30s %-20s %d\n", 
            substr($user['username'], 0, 19),
            substr($user['email'], 0, 29),
            substr($user['role_name'] ?? 'N/A', 0, 19),
            $user['permissions_assigned']
        );
    }
    echo str_repeat("-", 80) . "\n";

    echo "\n✓ All user permissions have been fixed!\n\n";
    echo "Next steps:\n";
    echo "1. Users should log out and log back in\n";
    echo "2. Permissions will be included in the login response\n";
    echo "3. UI tabs will appear based on these permissions\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
