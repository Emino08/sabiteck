<?php
// Simple database verification script
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

try {
    // Database connection
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';

    echo "Connecting to: {$host}:{$port}/{$dbname} as {$username}\n";

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Connected to database successfully.\n";

    // Check if route_settings table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'route_settings'");
    $exists = $stmt->fetch();

    if (!$exists) {
        echo "route_settings table does not exist. Creating it...\n";

        // Create the table
        $pdo->exec("
            CREATE TABLE route_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                route VARCHAR(100) UNIQUE NOT NULL,
                enabled TINYINT(1) DEFAULT 1,
                title VARCHAR(255),
                description TEXT,
                meta_keywords TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        echo "route_settings table created successfully.\n";
    } else {
        echo "route_settings table exists.\n";
    }

    // Show table structure
    $stmt = $pdo->query("DESCRIBE route_settings");
    $columns = $stmt->fetchAll();

    echo "\nTable structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['Field']}: {$column['Type']}\n";
    }

    // Check existing data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM route_settings");
    $result = $stmt->fetch();
    echo "\nExisting routes count: {$result['count']}\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
