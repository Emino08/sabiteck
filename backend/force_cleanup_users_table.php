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

    echo "Cleaning up redundant columns from users table...\n\n";

    // Drop redundant columns one by one
    $columnsToRemove = ['role', 'permissions', 'role_id', 'permissions_json'];

    foreach ($columnsToRemove as $column) {
        try {
            $pdo->exec("ALTER TABLE users DROP COLUMN $column");
            echo "✓ Dropped column: $column\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), "check that column/key exists") !== false) {
                echo "- Column $column doesn't exist (already removed)\n";
            } else {
                echo "✗ Error dropping $column: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n=== USERS TABLE STRUCTURE (after cleanup) ===\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo sprintf("  %s - %s\n", $col['Field'], $col['Type']);
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
