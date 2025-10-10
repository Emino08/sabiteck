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

    echo "Creating audit log table...\n\n";

    $sql = file_get_contents(__DIR__ . '/migrations/create_audit_log.sql');
    $pdo->exec($sql);

    echo "✓ Audit log table created successfully!\n\n";

    // Verify table was created
    $stmt = $pdo->query("DESCRIBE audit_logs");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Table structure:\n";
    foreach ($columns as $column) {
        echo "  - $column\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
