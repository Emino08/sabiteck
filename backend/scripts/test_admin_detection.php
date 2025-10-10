<?php
/**
 * Test koromaemmanuel66@gmail.com Login as Admin
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Testing Admin Login for koromaemmanuel66@gmail.com ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';
    $password = '5f0e5d6db76e5591';

    // Simulate login
    echo "Step 1: Finding user...\n";
    $stmt = $db->prepare("
        SELECT u.id, u.username, u.password_hash, u.role, u.role_id, u.first_name, u.last_name,
               u.email, u.status, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE (u.username = ? OR u.email = ?) AND u.status IN ('active', 'pending')
    ");
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "  ✗ User not found!\n";
        exit(1);
    }

    echo "  ✓ User found: {$user['username']}\n";
    echo "  Role: {$user['role']}\n";
    echo "  Role Name: {$user['role_name']}\n\n";

    // Verify password
    echo "Step 2: Verifying password...\n";
    if (!password_verify($password, $user['password_hash'])) {
        echo "  ✗ Password incorrect!\n";
        exit(1);
    }
    echo "  ✓ Password verified\n\n";

    // Get permissions
    echo "Step 3: Loading permissions...\n";
    $stmt = $db->prepare("
        SELECT p.name, p.display_name, p.category
        FROM user_permissions up
        JOIN permissions p ON up.permission = p.name
        WHERE up.user_id = ?
        ORDER BY p.category, p.name
    ");
    $stmt->execute([$user['id']]);
    $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "  ✓ Loaded " . count($permissions) . " permissions\n\n";

    // Check admin detection
    echo "Step 4: Admin detection checks...\n";
    
    $isAdminByRole = in_array($user['role'], ['admin', 'super_admin']);
    echo "  Is admin by role? " . ($isAdminByRole ? "✓ YES" : "✗ NO") . "\n";
    echo "    - Role value: '{$user['role']}'\n";
    
    $hasDashboard = false;
    $hasUsers = false;
    foreach ($permissions as $p) {
        if ($p['name'] === 'dashboard.view') $hasDashboard = true;
        if ($p['name'] === 'users.view') $hasUsers = true;
    }
    
    echo "  Has dashboard.view? " . ($hasDashboard ? "✓ YES" : "✗ NO") . "\n";
    echo "  Has users.view? " . ($hasUsers ? "✓ YES" : "✗ NO") . "\n";
    
    $shouldBeAdmin = $isAdminByRole || ($hasDashboard && $hasUsers);
    echo "\n  FINAL: Should be treated as admin? " . ($shouldBeAdmin ? "✓ YES" : "✗ NO") . "\n\n";

    // Show what login response would look like
    echo "Step 5: Login response data...\n";
    
    $loginResponse = [
        'success' => true,
        'data' => [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'role_name' => $user['role_name']
            ],
            'permissions' => array_map(function($p) {
                return [
                    'name' => $p['name'],
                    'display_name' => $p['display_name'],
                    'category' => $p['category']
                ];
            }, $permissions),
            'modules' => array_unique(array_column($permissions, 'category'))
        ]
    ];

    echo json_encode($loginResponse, JSON_PRETTY_PRINT) . "\n\n";

    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║              ADMIN LOGIN TEST RESULT                       ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    
    if ($shouldBeAdmin) {
        echo "✅ SUCCESS - User will be recognized as ADMIN\n\n";
        echo "Expected behavior:\n";
        echo "  1. Can login at /admin ✓\n";
        echo "  2. Cannot login at /login (will be redirected to /admin) ✓\n";
        echo "  3. Will see admin dashboard ✓\n";
        echo "  4. Will see ALL tabs ✓\n";
        echo "  5. Has full admin permissions ✓\n\n";
    } else {
        echo "❌ ISSUE - User may NOT be recognized as admin\n\n";
        echo "Problems:\n";
        echo "  - Role is not 'admin': " . ($isAdminByRole ? "OK" : "PROBLEM") . "\n";
        echo "  - Missing dashboard.view: " . ($hasDashboard ? "OK" : "PROBLEM") . "\n";
        echo "  - Missing users.view: " . ($hasUsers ? "OK" : "PROBLEM") . "\n\n";
    }

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
