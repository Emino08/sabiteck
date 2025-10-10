<?php
/**
 * Sync User Permissions Script
 * 
 * This script populates the user_permissions table for all existing users
 * based on their assigned roles. It ensures that each user has the proper
 * permissions in the user_permissions table.
 * 
 * Usage: php backend/scripts/sync_user_permissions.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;
use App\Services\PermissionService;

try {
    echo "Starting user permissions sync...\n\n";

    // Load environment variables
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();

    // Get database connection
    $db = Database::getInstance();
    $permissionService = new PermissionService($db);

    // Get all users with role_id
    $stmt = $db->query("
        SELECT u.id, u.username, u.email, u.role_id, r.name as role_name, r.display_name as role_display_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.role_id IS NOT NULL AND u.status = 'active'
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($users)) {
        echo "No users found to sync.\n";
        exit(0);
    }

    echo "Found " . count($users) . " users to sync.\n\n";

    $successCount = 0;
    $errorCount = 0;
    $skippedCount = 0;

    foreach ($users as $user) {
        echo "Processing user: {$user['username']} (ID: {$user['id']}, Role: {$user['role_display_name']})\n";

        // Check if user already has permissions
        $checkStmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
        $checkStmt->execute([$user['id']]);
        $existingCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($existingCount > 0) {
            echo "  - User already has {$existingCount} permissions. Skipping...\n";
            $skippedCount++;
            continue;
        }

        // Sync permissions from role
        $result = $permissionService->assignRolePermissionsToUser(
            $user['id'],
            $user['role_id'],
            $user['id'] // Self-granted for migration
        );

        if ($result) {
            // Count how many permissions were assigned
            $countStmt = $db->prepare("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?");
            $countStmt->execute([$user['id']]);
            $assignedCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            echo "  ✓ Successfully assigned {$assignedCount} permissions\n";
            $successCount++;
        } else {
            echo "  ✗ Failed to assign permissions\n";
            $errorCount++;
        }
    }

    echo "\n" . str_repeat("=", 60) . "\n";
    echo "Sync completed!\n";
    echo "  - Successfully synced: {$successCount} users\n";
    echo "  - Skipped (already synced): {$skippedCount} users\n";
    echo "  - Errors: {$errorCount} users\n";
    echo str_repeat("=", 60) . "\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
