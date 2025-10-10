<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$dbname = $_ENV['DB_NAME'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];

try {
    $port = $_ENV['DB_PORT'] ?? 3306;
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=== ALL TABLES IN DATABASE ===\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "- $table\n";
    }

    echo "\n=== RBAC-RELATED TABLES ===\n";
    $rbacTables = array_filter($tables, function($table) {
        return stripos($table, 'role') !== false ||
               stripos($table, 'permission') !== false ||
               stripos($table, 'user') !== false;
    });

    foreach ($rbacTables as $table) {
        echo "\n--- Table: $table ---\n";
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo sprintf("  %s - %s %s %s\n",
                $col['Field'],
                $col['Type'],
                $col['Null'] === 'NO' ? 'NOT NULL' : 'NULL',
                $col['Key'] ? "({$col['Key']})" : ''
            );
        }

        // Show record count
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "  Records: $count\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
