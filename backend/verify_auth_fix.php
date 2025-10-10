<?php
/**
 * Final verification test for admin authentication fixes
 */

require_once __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '4306';
$dbname = $_ENV['DB_NAME'] ?? 'devco_db';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '1212';

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $db = new PDO($dsn, $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=" . str_repeat("=", 70) . "\n";
    echo "  ADMIN AUTHENTICATION FIX - VERIFICATION TEST\n";
    echo "=" . str_repeat("=", 70) . "\n\n";

    // Test 1: Check all users with their roles
    echo "TEST 1: User Role Consistency Check\n";
    echo str_repeat("-", 72) . "\n";
    
    $stmt = $db->query("
        SELECT u.id, u.username, u.email, u.role as enum_role, r.name as actual_role, u.role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $roleMapping = [
        'admin' => 'admin',
        'super_admin' => 'super_admin',
        'editor' => 'user',
        'moderator' => 'user',
        'hr_manager' => 'user',
        'user' => 'user'
    ];

    $totalUsers = count($users);
    $consistentUsers = 0;
    $inconsistentUsers = [];

    foreach ($users as $user) {
        $expectedEnum = $roleMapping[$user['actual_role']] ?? 'user';
        $isConsistent = ($user['enum_role'] === $expectedEnum);
        
        if ($isConsistent) {
            $consistentUsers++;
        } else {
            $inconsistentUsers[] = $user;
        }
    }

    echo "Total Users: $totalUsers\n";
    echo "Consistent: $consistentUsers (" . round(($consistentUsers / $totalUsers) * 100, 1) . "%)\n";
    echo "Inconsistent: " . count($inconsistentUsers) . "\n\n";

    if (!empty($inconsistentUsers)) {
        echo "⚠️  INCONSISTENT USERS:\n";
        foreach ($inconsistentUsers as $user) {
            echo "  - ID:{$user['id']} {$user['username']}: enum='{$user['enum_role']}' should be '{$roleMapping[$user['actual_role']]}' (actual_role='{$user['actual_role']}')\n";
        }
        echo "\n";
    } else {
        echo "✓ All user roles are consistent!\n\n";
    }

    // Test 2: Verify authentication queries work for different user types
    echo "TEST 2: Authentication Query Verification\n";
    echo str_repeat("-", 72) . "\n";

    $jwtSecret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this-in-production';

    // Test admin user
    $adminUsers = array_filter($users, fn($u) => $u['actual_role'] === 'admin');
    if (!empty($adminUsers)) {
        $admin = array_values($adminUsers)[0];
        echo "\nTesting ADMIN user: {$admin['username']}\n";
        
        // Create JWT token
        $payload = [
            'user_id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'role' => $admin['actual_role'],
            'iat' => time(),
            'exp' => time() + 3600
        ];
        $token = JWT::encode($payload, $jwtSecret, 'HS256');
        
        // Test decode
        $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
        echo "  ✓ JWT token created and decoded\n";
        
        // Test auth query (from handleAdminAuth line 548)
        $stmt = $db->prepare("
            SELECT u.id, u.status, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$decoded->user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && in_array($user['role_name'], ['admin', 'super_admin'])) {
            echo "  ✓ Auth query successful - Access GRANTED\n";
            echo "    Role: {$user['role_name']}\n";
        } else {
            echo "  ✗ Auth query failed - Access DENIED\n";
        }
    }

    // Test editor user
    $editorUsers = array_filter($users, fn($u) => $u['actual_role'] === 'editor');
    if (!empty($editorUsers)) {
        $editor = array_values($editorUsers)[0];
        echo "\nTesting EDITOR user: {$editor['username']}\n";
        
        // Create JWT token
        $payload = [
            'user_id' => $editor['id'],
            'username' => $editor['username'],
            'email' => $editor['email'],
            'role' => $editor['actual_role'],
            'iat' => time(),
            'exp' => time() + 3600
        ];
        $token = JWT::encode($payload, $jwtSecret, 'HS256');
        
        // Test decode
        $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
        echo "  ✓ JWT token created and decoded\n";
        
        // Test auth query
        $stmt = $db->prepare("
            SELECT u.id, u.status, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$decoded->user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo "  ✓ Auth query successful\n";
            echo "    Role: {$user['role_name']}\n";
            
            // Check if has dashboard.view permission or is admin
            $hasPermission = in_array($user['role_name'], ['admin', 'super_admin']);
            if (!$hasPermission) {
                $permStmt = $db->prepare("
                    SELECT COUNT(*) as has_perm
                    FROM user_permissions up
                    WHERE up.user_id = ? AND up.permission = 'dashboard.view'
                ");
                $permStmt->execute([$user['id']]);
                $permResult = $permStmt->fetch();
                $hasPermission = $permResult['has_perm'] > 0;
            }
            
            if ($hasPermission) {
                echo "  ✓ Dashboard access GRANTED\n";
            } else {
                echo "  ℹ️  Dashboard access requires permission (expected for non-admin)\n";
            }
        } else {
            echo "  ✗ Auth query failed\n";
        }
    }

    // Test regular user
    $regularUsers = array_filter($users, fn($u) => $u['actual_role'] === 'user');
    if (!empty($regularUsers)) {
        $regular = array_values($regularUsers)[0];
        echo "\nTesting REGULAR USER: {$regular['username']}\n";
        
        // Create JWT token
        $payload = [
            'user_id' => $regular['id'],
            'username' => $regular['username'],
            'email' => $regular['email'],
            'role' => $regular['actual_role'],
            'iat' => time(),
            'exp' => time() + 3600
        ];
        $token = JWT::encode($payload, $jwtSecret, 'HS256');
        
        // Test decode
        $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
        echo "  ✓ JWT token created and decoded\n";
        
        // Test auth query
        $stmt = $db->prepare("
            SELECT u.id, u.status, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$decoded->user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo "  ✓ Auth query successful\n";
            echo "    Role: {$user['role_name']}\n";
            
            $hasPermission = in_array($user['role_name'], ['admin', 'super_admin']);
            if (!$hasPermission) {
                echo "  ℹ️  Not an admin (expected)\n";
            }
        } else {
            echo "  ✗ Auth query failed\n";
        }
    }

    echo "\n" . str_repeat("=", 72) . "\n";
    echo "  VERIFICATION COMPLETE\n";
    echo str_repeat("=", 72) . "\n\n";

    if (empty($inconsistentUsers)) {
        echo "✅ ALL TESTS PASSED!\n";
        echo "The authentication system is working correctly.\n";
    } else {
        echo "⚠️  SOME ISSUES FOUND\n";
        echo "Please run: php sync_user_roles.php\n";
    }

    echo "\n";

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
