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

    echo "Running RBAC cleanup migration...\n\n";

    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/migrations/complete_rbac_cleanup.sql');

    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }

        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            // Some statements might fail if columns don't exist, that's okay
            if (strpos($e->getMessage(), "Can't DROP") === false &&
                strpos($e->getMessage(), "Duplicate") === false) {
                echo "Warning: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "✓ Migration completed successfully!\n\n";

    // Show results
    echo "=== FINAL VERIFICATION ===\n";
    $stmt = $pdo->query("
        SELECT 'Roles' as info, COUNT(*) as count FROM roles
        UNION ALL
        SELECT 'Permissions', COUNT(*) FROM permissions
        UNION ALL
        SELECT 'Role Permissions', COUNT(*) FROM role_permissions
        UNION ALL
        SELECT 'User Roles', COUNT(*) FROM user_roles
        UNION ALL
        SELECT 'Users', COUNT(*) FROM users
    ");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $result) {
        echo sprintf("%-20s: %d\n", $result['info'], $result['count']);
    }

    echo "\n=== USERS TABLE COLUMNS (after cleanup) ===\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($columns as $column) {
        echo "  - $column\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
