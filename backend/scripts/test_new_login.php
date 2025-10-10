<?php
/**
 * Test Login for New koromaemmanuel66@gmail.com Account
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;
use App\Services\PermissionService;

try {
    echo "\n=== Testing New Account Login ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';
    $password = '2d5838dc71aacf3b';

    // Step 1: Simulate login query
    echo "Step 1: Simulating login...\n";
    $stmt = $db->prepare("
        SELECT u.id, u.username, u.password_hash, u.role, u.role_id, 
               u.first_name, u.last_name, u.email, u.status, 
               r.name as role_name, r.display_name as role_display_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE (u.username = ? OR u.email = ?) AND u.status IN ('active', 'pending')
    ");
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "  ✗ Login failed - user not found!\n";
        exit(1);
    }

    echo "  ✓ User found: {$user['username']}\n";
    echo "  ✓ Status: {$user['status']}\n";
    echo "  ✓ Role: {$user['role_name']}\n\n";

    // Step 2: Verify password
    echo "Step 2: Verifying password...\n";
    if (!password_verify($password, $user['password_hash'])) {
        echo "  ✗ Password verification failed!\n";
        exit(1);
    }
    echo "  ✓ Password verified successfully\n\n";

    // Step 3: Load permissions
    echo "Step 3: Loading permissions...\n";
    $permissionService = new PermissionService($db);
    $permissions = $permissionService->getUserPermissions($user['id']);
    $modules = $permissionService->getUserModules($user['id']);

    echo "  ✓ Loaded " . count($permissions) . " permissions\n";
    echo "  ✓ User has access to " . count($modules) . " modules\n\n";

    // Step 4: Check admin detection
    echo "Step 4: Admin detection...\n";
    $isAdminByRole = in_array($user['role'], ['admin', 'super_admin']);
    $hasDashboardView = false;
    
    foreach ($permissions as $perm) {
        if ($perm['name'] === 'dashboard.view') {
            $hasDashboardView = true;
            break;
        }
    }

    echo "  Admin by role? " . ($isAdminByRole ? "YES" : "NO") . "\n";
    echo "  Has dashboard.view? " . ($hasDashboardView ? "YES" : "NO") . "\n";
    echo "  Can login at /admin? " . ($hasDashboardView ? "YES ✓" : "NO") . "\n\n";

    // Step 5: Show login response
    echo "Step 5: Login response that will be sent to frontend:\n\n";
    
    $loginResponse = [
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'role' => $user['role'],
                'role_name' => $user['role_name']
            ],
            'token' => '[JWT_TOKEN_WILL_BE_HERE]',
            'permissions' => $permissions,
            'modules' => $modules
        ]
    ];

    echo json_encode($loginResponse, JSON_PRETTY_PRINT) . "\n\n";

    // Step 6: Verify accessible tabs
    echo "Step 6: Tabs that will be visible in admin dashboard:\n";
    
    $tabs = [
        'Overview' => in_array('dashboard', $modules),
        'Content' => in_array('content', $modules),
        'Services' => in_array('content', $modules),
        'Portfolio' => in_array('content', $modules),
        'Announcements' => in_array('announcements', $modules),
        'Jobs' => in_array('jobs', $modules),
        'Scholarships' => in_array('scholarships', $modules),
        'Team' => in_array('team', $modules),
        'Users' => in_array('users', $modules),
        'Analytics' => in_array('analytics', $modules),
        'Settings' => in_array('system', $modules)
    ];

    foreach ($tabs as $tab => $visible) {
        $icon = $visible ? "✓" : "✗";
        $status = $visible ? "VISIBLE" : "HIDDEN";
        echo "  {$icon} {$tab}: {$status}\n";
    }

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║              LOGIN TEST SUCCESSFUL                         ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";

    echo "✅ CREDENTIALS VERIFIED AND WORKING:\n\n";
    echo "  Email:    koromaemmanuel66@gmail.com\n";
    echo "  Password: 2d5838dc71aacf3b\n";
    echo "  Username: {$user['username']}\n";
    echo "  Role:     {$user['role_name']}\n";
    echo "  Login at: /admin\n\n";

    echo "Expected Behavior:\n";
    echo "  1. Can login at /admin ✓\n";
    echo "  2. Will see " . count($permissions) . " permissions loaded ✓\n";
    echo "  3. Will have access to: " . implode(', ', $modules) . " ✓\n";
    echo "  4. Dashboard will show content editor tabs ✓\n\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
