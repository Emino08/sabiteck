<?php
/**
 * Synchronize the role enum field with role_id field
 * Since the enum only supports: user, admin, super_admin
 * We'll map all roles appropriately
 */

require_once __DIR__ . '/vendor/autoload.php';

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

    echo "=== Synchronizing user roles ===\n\n";
    echo "Note: The role enum field only supports: user, admin, super_admin\n";
    echo "Other roles (editor, moderator, hr_manager) will be mapped to 'user'\n\n";

    // Map roles from roles table to enum values
    $roleMapping = [
        'admin' => 'admin',
        'super_admin' => 'super_admin',
        'editor' => 'user',
        'moderator' => 'user',
        'hr_manager' => 'user',
        'user' => 'user'
    ];

    // Get all users
    $stmt = $db->query("
        SELECT u.id, u.username, u.role as current_role, r.name as role_from_table, u.role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $needsUpdate = [];
    foreach ($users as $user) {
        $correctEnumValue = $roleMapping[$user['role_from_table']] ?? 'user';
        if ($user['current_role'] !== $correctEnumValue) {
            $needsUpdate[] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'current' => $user['current_role'],
                'correct' => $correctEnumValue,
                'actual_role' => $user['role_from_table']
            ];
        }
    }

    if (empty($needsUpdate)) {
        echo "All user roles are already synchronized!\n";
        exit(0);
    }

    echo "Found " . count($needsUpdate) . " users with mismatched roles:\n\n";
    foreach ($needsUpdate as $user) {
        echo "  ID:{$user['id']} {$user['username']} ({$user['actual_role']}): '{$user['current']}' → '{$user['correct']}'\n";
    }

    echo "\nUpdating roles...\n";

    // Update each user individually with proper mapping
    $updateStmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
    $updated = 0;
    foreach ($needsUpdate as $user) {
        $updateStmt->execute([$user['correct'], $user['id']]);
        $updated++;
    }

    echo "\n✓ Successfully synchronized $updated user(s)!\n\n";

    // Verify synchronization
    echo "=== Verification ===\n";
    $verifyStmt = $db->query("
        SELECT u.id, u.username, u.role, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
        LIMIT 10
    ");
    $verified = $verifyStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($verified as $user) {
        $expectedEnum = $roleMapping[$user['role_name']] ?? 'user';
        $status = ($user['role'] === $expectedEnum) ? '✓' : '✗';
        echo "$status ID:{$user['id']} {$user['username']}: role='{$user['role']}' actual_role='{$user['role_name']}'\n";
    }

    echo "\n";
    echo "✓ Synchronization complete!\n";
    echo "Note: The application now uses role_id with roles table. The enum field is for legacy compatibility.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
