<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$dbname = $_ENV['DB_NAME'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];
$port = $_ENV['DB_PORT'] ?? 3306;

echo "=== COMPLETE RBAC SYSTEM TEST ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Test 1: Verify database structure
    echo "TEST 1: Database Structure\n";
    echo str_repeat('-', 60) . "\n";

    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $removedColumns = ['role', 'permissions', 'role_id', 'permissions_json'];
    $hasRemovedColumns = array_intersect($removedColumns, $columns);

    if (empty($hasRemovedColumns)) {
        echo "✓ All redundant columns removed from users table\n";
    } else {
        echo "✗ Found redundant columns: " . implode(', ', $hasRemovedColumns) . "\n";
    }

    $requiredTables = ['roles', 'permissions', 'user_roles', 'role_permissions'];
    foreach ($requiredTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Table '$table' exists\n";
        } else {
            echo "✗ Table '$table' is missing\n";
        }
    }

    // Test 2: Verify roles exist
    echo "\nTEST 2: Roles Configuration\n";
    echo str_repeat('-', 60) . "\n";

    $expectedRoles = ['admin', 'content_editor', 'program_manager', 'marketing_officer', 'analyst', 'blogger'];
    $stmt = $pdo->query("SELECT name FROM roles ORDER BY name");
    $actualRoles = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($expectedRoles as $roleName) {
        if (in_array($roleName, $actualRoles)) {
            echo "✓ Role '$roleName' exists\n";
        } else {
            echo "✗ Role '$roleName' is missing\n";
        }
    }

    // Test 3: Verify permissions exist
    echo "\nTEST 3: Permissions Configuration\n";
    echo str_repeat('-', 60) . "\n";

    $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM permissions GROUP BY category ORDER BY category");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($categories as $cat) {
        echo sprintf("✓ Category '%s': %d permissions\n", $cat['category'], $cat['count']);
    }

    // Verify key permissions exist
    $keyPermissions = [
        'dashboard.view',
        'content.view',
        'jobs.view',
        'analytics.view',
        'newsletter.view',
        'users.view',
        'curriculum.view',
        'tools.view'
    ];

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM permissions WHERE name = ?");
    foreach ($keyPermissions as $perm) {
        $stmt->execute([$perm]);
        $exists = $stmt->fetchColumn() > 0;
        if ($exists) {
            echo "✓ Permission '$perm' exists\n";
        } else {
            echo "✗ Permission '$perm' is missing\n";
        }
    }

    // Test 4: Verify role-permission mappings
    echo "\nTEST 4: Role-Permission Mappings\n";
    echo str_repeat('-', 60) . "\n";

    foreach ($expectedRoles as $roleName) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as perm_count
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = ?
        ");
        $stmt->execute([$roleName]);
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            echo "✓ Role '$roleName' has $count permissions assigned\n";
        } else {
            echo "✗ Role '$roleName' has NO permissions assigned\n";
        }
    }

    // Test 5: Test user assignments
    echo "\nTEST 5: User Role Assignments\n";
    echo str_repeat('-', 60) . "\n";

    $stmt = $pdo->query("
        SELECT u.username, u.email, r.name as role_name, r.display_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $user) {
        if ($user['role_name']) {
            echo "✓ User '{$user['username']}' assigned to role '{$user['role_name']}'\n";
        } else {
            echo "✗ User '{$user['username']}' has NO role assigned\n";
        }
    }

    // Test 6: Test PermissionService methods
    echo "\nTEST 6: PermissionService Functionality\n";
    echo str_repeat('-', 60) . "\n";

    require_once __DIR__ . '/src/Services/PermissionService.php';
    $permissionService = new \App\Services\PermissionService($pdo);

    // Get a test user
    $stmt = $pdo->query("SELECT id, username FROM users LIMIT 1");
    $testUser = $stmt->fetch();

    if ($testUser) {
        echo "Testing with user: {$testUser['username']}\n";

        $userPermissions = $permissionService->getUserPermissions($testUser['id']);
        echo "✓ getUserPermissions() returned " . count($userPermissions) . " permissions\n";

        $permissionNames = $permissionService->getUserPermissionNames($testUser['id']);
        echo "✓ getUserPermissionNames() returned " . count($permissionNames) . " permission names\n";

        $userRole = $permissionService->getUserRole($testUser['id']);
        if ($userRole) {
            echo "✓ getUserRole() returned: {$userRole['name']} ({$userRole['display_name']})\n";
        } else {
            echo "✗ getUserRole() returned NULL\n";
        }

        $modules = $permissionService->getUserModules($testUser['id']);
        echo "✓ getUserModules() returned " . count($modules) . " modules\n";

        if (!empty($permissionNames)) {
            $hasPerm = $permissionService->hasPermission($testUser['id'], $permissionNames[0]);
            echo "✓ hasPermission('{$permissionNames[0]}') = " . ($hasPerm ? 'true' : 'false') . "\n";
        }
    }

    // Test 7: Verify route-permission mapping
    echo "\nTEST 7: Route-Permission Mapping\n";
    echo str_repeat('-', 60) . "\n";

    require_once __DIR__ . '/src/Config/RoutePermissions.php';

    $routes = ['dashboard', 'content', 'jobs', 'analytics', 'newsletter', 'user-roles'];
    foreach ($routes as $route) {
        $requiredPerms = \App\Config\RoutePermissions::getPermissionsForRoute($route);
        if (!empty($requiredPerms)) {
            echo "✓ Route '$route' requires: " . implode(' OR ', $requiredPerms) . "\n";
        } else {
            echo "✗ Route '$route' has no permission requirements\n";
        }
    }

    // Test 8: Test each role's navigation access
    echo "\nTEST 8: Role-Based Navigation Access\n";
    echo str_repeat('-', 60) . "\n";

    foreach ($expectedRoles as $roleName) {
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
        $stmt->execute([$roleName]);
        $role = $stmt->fetch();

        if (!$role) continue;

        // Get role permissions
        $stmt = $pdo->prepare("
            SELECT p.name
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
        ");
        $stmt->execute([$role['id']]);
        $rolePermissions = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $navigation = \App\Config\RoutePermissions::getNavigationForPermissions($rolePermissions);
        $sectionCount = count($navigation);
        $routeCount = 0;
        foreach ($navigation as $section) {
            $routeCount += count($section['routes']);
        }

        echo "\nRole: $roleName\n";
        echo "  Permissions: " . count($rolePermissions) . "\n";
        echo "  Accessible sections: $sectionCount\n";
        echo "  Accessible routes: $routeCount\n";

        foreach ($navigation as $section) {
            $routeNames = array_column($section['routes'], 'name');
            echo "  - {$section['section']}: " . implode(', ', $routeNames) . "\n";
        }
    }

    // Final Summary
    echo "\n" . str_repeat('=', 60) . "\n";
    echo "TEST SUMMARY\n";
    echo str_repeat('=', 60) . "\n";

    $stmt = $pdo->query("SELECT COUNT(*) FROM roles");
    $roleCount = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM permissions");
    $permCount = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM role_permissions");
    $rolePermCount = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM user_roles");
    $userRoleCount = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();

    echo "Total Roles: $roleCount\n";
    echo "Total Permissions: $permCount\n";
    echo "Total Role-Permission Mappings: $rolePermCount\n";
    echo "Total Users: $userCount\n";
    echo "Total User-Role Assignments: $userRoleCount\n";

    if ($userRoleCount == $userCount) {
        echo "\n✓ ALL USERS HAVE ROLES ASSIGNED\n";
    } else {
        echo "\n⚠ WARNING: " . ($userCount - $userRoleCount) . " users WITHOUT role assignments\n";
    }

    echo "\n✅ RBAC SYSTEM TEST COMPLETE\n\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
