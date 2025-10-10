#!/usr/bin/env php
<?php
/**
 * Create Test Users Directly in Database with Known Passwords
 * This allows immediate testing without waiting for email
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment
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

// Database connection
function getDB() {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '4306';
    $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '1212';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

$db = getDB();

echo "========================================\n";
echo "Creating Test Users for RBAC Testing\n";
echo "========================================\n\n";

// Test password for all users
$testPassword = 'Test123!';
$passwordHash = password_hash($testPassword, PASSWORD_DEFAULT);

// Test users to create
$testUsers = [
    [
        'username' => 'test_admin',
        'email' => 'test.admin@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Admin',
        'role_name' => 'admin',
        'phone' => '+1234567890'
    ],
    [
        'username' => 'test_blogger',
        'email' => 'test.blogger@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Blogger',
        'role_name' => 'blogger',
        'phone' => '+1234567891'
    ],
    [
        'username' => 'test_editor',
        'email' => 'test.editor@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Editor',
        'role_name' => 'content_editor',
        'phone' => '+1234567892'
    ],
    [
        'username' => 'test_manager',
        'email' => 'test.manager@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Manager',
        'role_name' => 'program_manager',
        'phone' => '+1234567893'
    ],
    [
        'username' => 'test_marketer',
        'email' => 'test.marketer@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Marketer',
        'role_name' => 'marketing_officer',
        'phone' => '+1234567894'
    ],
    [
        'username' => 'test_analyst',
        'email' => 'test.analyst@sabiteck.com',
        'first_name' => 'Test',
        'last_name' => 'Analyst',
        'role_name' => 'analyst',
        'phone' => '+1234567895'
    ]
];

echo "Test Password for all users: $testPassword\n\n";

foreach ($testUsers as $userData) {
    echo "Creating user: {$userData['username']} ({$userData['role_name']})...\n";
    
    try {
        // Get role_id
        $stmt = $db->prepare("SELECT id FROM roles WHERE name = ?");
        $stmt->execute([$userData['role_name']]);
        $role = $stmt->fetch();
        
        if (!$role) {
            echo "  ✗ Role '{$userData['role_name']}' not found!\n";
            continue;
        }
        
        $roleId = $role['id'];
        
        // Check if user already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$userData['username'], $userData['email']]);
        if ($stmt->fetch()) {
            echo "  ⚠ User already exists, updating password...\n";
            $stmt = $db->prepare("
                UPDATE users 
                SET password_hash = ?, role = 'admin', role_id = ?, must_change_password = 0, status = 'active'
                WHERE username = ?
            ");
            $stmt->execute([$passwordHash, $roleId, $userData['username']]);
        } else {
            // Create new user
            $stmt = $db->prepare("
                INSERT INTO users (
                    username, email, first_name, last_name, phone,
                    password_hash, role, role_id, status, must_change_password, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, 'active', 0, NOW())
            ");
            
            $stmt->execute([
                $userData['username'],
                $userData['email'],
                $userData['first_name'],
                $userData['last_name'],
                $userData['phone'],
                $passwordHash,
                $roleId
            ]);
            
            $userId = $db->lastInsertId();
            
            // Add to user_roles table
            $stmt = $db->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = ?");
            $stmt->execute([$userId, $roleId, $roleId]);
        }
        
        echo "  ✓ User created/updated successfully\n";
        
    } catch (PDOException $e) {
        echo "  ✗ Error: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

// Verify created users
echo "========================================\n";
echo "Verification\n";
echo "========================================\n\n";

$stmt = $db->query("
    SELECT 
        u.id,
        u.username,
        u.email,
        u.role as role_column,
        u.role_id,
        r.name as role_name,
        r.display_name,
        u.status,
        u.must_change_password,
        (SELECT COUNT(*) FROM user_roles ur WHERE ur.user_id = u.id) as has_user_role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username LIKE 'test_%'
    ORDER BY u.id
");

$users = $stmt->fetchAll();

echo "Created Test Users:\n\n";
echo str_pad("Username", 20) . str_pad("Role Column", 15) . str_pad("Role Name", 20) . str_pad("Status", 10) . "Must Change PW\n";
echo str_repeat("-", 85) . "\n";

foreach ($users as $user) {
    echo str_pad($user['username'], 20) . 
         str_pad($user['role_column'], 15) . 
         str_pad($user['role_name'] ?? 'N/A', 20) . 
         str_pad($user['status'], 10) . 
         ($user['must_change_password'] ? 'Yes' : 'No') . "\n";
}

// Count permissions for each user
echo "\n\nPermissions Count:\n\n";
$stmt = $db->query("
    SELECT 
        u.username,
        r.name as role_name,
        COUNT(DISTINCT rp.permission_id) as permission_count
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE u.username LIKE 'test_%'
    GROUP BY u.id, u.username, r.name
    ORDER BY u.id
");

$permCounts = $stmt->fetchAll();

echo str_pad("Username", 20) . str_pad("Role", 20) . "Permissions\n";
echo str_repeat("-", 60) . "\n";

foreach ($permCounts as $pc) {
    echo str_pad($pc['username'], 20) . str_pad($pc['role_name'] ?? 'N/A', 20) . $pc['permission_count'] . "\n";
}

echo "\n========================================\n";
echo "Summary\n";
echo "========================================\n\n";

echo "✓ Created " . count($users) . " test users\n";
echo "✓ All users have role='admin' for dashboard access\n";
echo "✓ All users have role_id set for permission assignment\n";
echo "✓ Password for all test users: $testPassword\n\n";

echo "Login Credentials:\n\n";
foreach ($users as $user) {
    echo "  • {$user['username']}\n";
    echo "    Password: $testPassword\n";
    echo "    Role: {$user['role_name']}\n";
    echo "    Email: {$user['email']}\n\n";
}

echo "Next Steps:\n";
echo "  1. Test login for each user at http://localhost:3000/admin\n";
echo "  2. Verify each user sees only their permitted tabs\n";
echo "  3. Run test_user_permissions.php to test API access\n\n";

?>
