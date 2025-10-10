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

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Testing login query fix...\n\n";

    // Test the exact query used in public/index.php
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.password_hash, u.first_name, u.last_name, u.email, u.status, u.must_change_password,
               r.name as role, r.display_name as role_display_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE (u.username = ? OR u.email = ?) AND u.status = 'active'
    ");

    $testUsername = 'admin';
    $stmt->execute([$testUsername, $testUsername]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "✓ Login query successful!\n\n";
        echo "User Details:\n";
        echo "  ID: {$user['id']}\n";
        echo "  Username: {$user['username']}\n";
        echo "  Email: {$user['email']}\n";
        echo "  Role: {$user['role']} ({$user['role_display_name']})\n";
        echo "  Status: {$user['status']}\n";
        echo "\n✅ Login endpoint should work now!\n";
    } else {
        echo "✗ User not found with username: $testUsername\n";
    }

    // Test with all users
    echo "\n=== Testing All Users ===\n";
    $stmt = $pdo->query("
        SELECT u.id, u.username, u.email, r.name as role_name, r.display_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.status = 'active'
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $u) {
        echo sprintf("%-20s %-30s %-20s\n", $u['username'], $u['email'], $u['role_name'] ?? 'NO ROLE');
    }

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
