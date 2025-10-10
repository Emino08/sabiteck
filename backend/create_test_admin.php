<?php
/**
 * Test script to create an admin user and test authentication
 */

require_once __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;

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

    echo "=== Creating Test Admin User ===\n\n";

    // Create a test admin user
    $testUsername = 'test_admin_' . time();
    $testEmail = 'test_admin_' . time() . '@test.com';
    $testPassword = 'Admin@123456';
    $passwordHash = password_hash($testPassword, PASSWORD_DEFAULT);

    // Get admin role ID
    $stmt = $db->query("SELECT id FROM roles WHERE name = 'admin'");
    $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
    $adminRoleId = $adminRole['id'];

    // Insert test user
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, role, status, created_at)
        VALUES (?, ?, ?, 'Test', 'Admin', ?, 'admin', 'active', NOW())
    ");
    $stmt->execute([$testUsername, $testEmail, $passwordHash, $adminRoleId]);
    $userId = $db->lastInsertId();

    echo "✓ Created test admin user:\n";
    echo "  ID: $userId\n";
    echo "  Username: $testUsername\n";
    echo "  Email: $testEmail\n";
    echo "  Password: $testPassword\n";
    echo "  Role ID: $adminRoleId\n\n";

    // Generate JWT token for the user
    $jwtSecret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this-in-production';
    $payload = [
        'user_id' => $userId,
        'username' => $testUsername,
        'email' => $testEmail,
        'role' => 'admin',
        'iat' => time(),
        'exp' => time() + (30 * 24 * 60 * 60) // 30 days
    ];
    $token = JWT::encode($payload, $jwtSecret, 'HS256');

    echo "✓ Generated JWT token:\n";
    echo "  Token: " . substr($token, 0, 50) . "...\n\n";

    // Test authentication query (simulating handleAdminAuth)
    echo "=== Testing Authentication Query ===\n\n";
    
    // Decode token
    $decoded = JWT::decode($token, new Firebase\JWT\Key($jwtSecret, 'HS256'));
    echo "✓ Token decoded successfully\n";
    echo "  User ID from token: {$decoded->user_id}\n\n";

    // Get user from database
    $stmt = $db->prepare("
        SELECT u.id, u.status, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.status = 'active'
    ");
    $stmt->execute([$decoded->user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "✓ User found in database\n";
        echo "  ID: {$user['id']}\n";
        echo "  Status: {$user['status']}\n";
        echo "  Role Name: {$user['role_name']}\n\n";

        // Check admin permission
        $isAdmin = in_array($user['role_name'], ['admin', 'super_admin']);
        echo ($isAdmin ? "✓" : "✗") . " Admin check: " . ($isAdmin ? "PASS" : "FAIL") . "\n\n";
    } else {
        echo "✗ User not found or inactive!\n\n";
    }

    // Test with direct API endpoint simulation
    echo "=== Testing Admin Routes Access ===\n\n";

    // Save credentials to a file for easy reference
    $credentials = [
        'username' => $testUsername,
        'email' => $testEmail,
        'password' => $testPassword,
        'jwt_token' => $token,
        'user_id' => $userId
    ];

    file_put_contents(__DIR__ . '/test_admin_credentials.json', json_encode($credentials, JSON_PRETTY_PRINT));
    echo "✓ Credentials saved to test_admin_credentials.json\n\n";

    echo "=== Test Complete ===\n\n";
    echo "You can now test the API endpoints with:\n";
    echo "  Authorization: Bearer $token\n\n";
    echo "Example curl commands:\n\n";
    echo "# Test admin services endpoint\n";
    echo "curl -X GET http://localhost/api/admin/services \\\n";
    echo "  -H \"Authorization: Bearer $token\" \\\n";
    echo "  -H \"Content-Type: application/json\"\n\n";

    echo "# Test admin portfolio endpoint\n";
    echo "curl -X GET http://localhost/api/admin/portfolio \\\n";
    echo "  -H \"Authorization: Bearer $token\" \\\n";
    echo "  -H \"Content-Type: application/json\"\n\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
