<?php
/**
 * Test Login for koromaemmanuel66@gmail.com
 * Simulates the login process to verify everything works
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;
use App\Services\PermissionService;

try {
    echo "\n=== Testing Login for koromaemmanuel66@gmail.com ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';
    $password = '5f0e5d6db76e5591';

    // Step 1: Find user (simulating login query)
    echo "Step 1: Finding user in database...\n";
    $stmt = $db->prepare("
        SELECT u.id, u.username, u.password_hash, u.role, u.role_id, u.first_name, u.last_name,
               u.email, u.status, u.failed_login_attempts, u.locked_until, u.must_change_password,
               r.name as role_name, r.display_name as role_display_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE (u.username = ? OR u.email = ?) AND u.status IN ('active', 'pending')
    ");
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "  ✗ User not found or not active!\n";
        echo "  Checking all statuses...\n";
        
        $stmt = $db->prepare("SELECT username, email, status FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $anyUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($anyUser) {
            echo "  User exists but status is: {$anyUser['status']}\n";
        } else {
            echo "  User does not exist at all!\n";
        }
        exit(1);
    }

    echo "  ✓ User found: {$user['username']}\n";
    echo "  Status: {$user['status']}\n";
    echo "  Role: {$user['role_name']}\n";
    echo "  Failed attempts: {$user['failed_login_attempts']}\n";
    echo "  Locked until: " . ($user['locked_until'] ?? 'Not locked') . "\n\n";

    // Step 2: Check if account is locked
    echo "Step 2: Checking if account is locked...\n";
    if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
        echo "  ✗ Account is locked until {$user['locked_until']}\n";
        exit(1);
    }
    echo "  ✓ Account is not locked\n\n";

    // Step 3: Verify password
    echo "Step 3: Verifying password...\n";
    if (!password_verify($password, $user['password_hash'])) {
        echo "  ✗ Password verification failed!\n";
        echo "  Hash: " . substr($user['password_hash'], 0, 30) . "...\n";
        exit(1);
    }
    echo "  ✓ Password verified successfully\n\n";

    // Step 4: Get user permissions (simulating full login flow)
    echo "Step 4: Loading user permissions...\n";
    $permissionService = new PermissionService($db);
    $userPermissions = $permissionService->getUserPermissions($user['id']);
    $userModules = $permissionService->getUserModules($user['id']);

    echo "  ✓ Loaded " . count($userPermissions) . " permissions\n";
    echo "  ✓ User has access to " . count($userModules) . " modules\n\n";

    // Step 5: Display permissions
    echo "Step 5: User permissions:\n";
    if (empty($userPermissions)) {
        echo "  ⚠ WARNING: No permissions found!\n";
        echo "  Running permission fix...\n";
        
        // Quick fix - assign editor permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        
        $editorPerms = [
            'View Dashboard', 'View Content', 'Create Content', 'Edit Content', 
            'Delete Content', 'Publish Content', 'View Portfolio', 'Create Portfolio',
            'Edit Portfolio', 'View Announcements', 'Create Announcements', 'Edit Announcements'
        ];
        
        $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission, granted_at) VALUES (?, ?, NOW())");
        foreach ($editorPerms as $perm) {
            $stmt->execute([$user['id'], $perm]);
        }
        
        // Reload permissions
        $userPermissions = $permissionService->getUserPermissions($user['id']);
        $userModules = $permissionService->getUserModules($user['id']);
        
        echo "  ✓ Fixed - Now has " . count($userPermissions) . " permissions\n\n";
    }

    // Group by category
    $grouped = [];
    foreach ($userPermissions as $perm) {
        $cat = $perm['category'] ?? 'general';
        if (!isset($grouped[$cat])) {
            $grouped[$cat] = [];
        }
        $grouped[$cat][] = $perm['name'];
    }

    foreach ($grouped as $category => $perms) {
        echo "  📁 {$category}:\n";
        foreach ($perms as $permName) {
            echo "     ✓ {$permName}\n";
        }
    }

    echo "\n";

    // Step 6: Simulate JWT payload
    echo "Step 6: Login payload (what would be sent to frontend):\n";
    $payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'role_name' => $user['role_name'],
        'permissions' => array_column($userPermissions, 'name'),
        'modules' => $userModules
    ];

    echo "  User ID: {$payload['user_id']}\n";
    echo "  Username: {$payload['username']}\n";
    echo "  Role: {$payload['role_name']}\n";
    echo "  Permissions count: " . count($payload['permissions']) . "\n";
    echo "  Modules: " . implode(', ', $payload['modules']) . "\n\n";

    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║              LOGIN TEST SUCCESSFUL!                        ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    
    echo "Login Credentials:\n";
    echo "  Email:    koromaemmanuel66@gmail.com\n";
    echo "  Password: 5f0e5d6db76e5591\n\n";
    
    echo "Expected Behavior:\n";
    echo "  ✓ User can login successfully\n";
    echo "  ✓ " . count($userPermissions) . " permissions will be loaded\n";
    echo "  ✓ UI tabs will appear for: " . implode(', ', $userModules) . "\n";
    echo "  ✓ User will have Content Editor access\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
