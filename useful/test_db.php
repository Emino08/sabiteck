<?php
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables from backend/.env
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

function testDB() {
    try {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';

        echo "Testing database connection with:\n";
        echo "Host: {$host}\n";
        echo "Port: {$port}\n";
        echo "Database: {$dbname}\n";
        echo "Username: {$username}\n";
        echo "Password: " . (empty($password) ? '(empty)' : '***') . "\n\n";

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $db = new PDO($dsn, $username, $password, $options);
        echo "✅ Database connection successful!\n\n";

        // Test query
        $stmt = $db->query("SELECT 1 as test");
        $result = $stmt->fetch();
        echo "✅ Test query successful: " . $result['test'] . "\n\n";

        // List existing tables
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "📋 Existing tables:\n";
        foreach ($tables as $table) {
            echo "  - {$table}\n";
        }

        return $db;
    } catch (PDOException $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

// Test the database connection
echo "🔍 Testing Database Connection\n";
echo "================================\n";
$db = testDB();

if ($db) {
    echo "\n🎉 Database is ready for use!\n";
} else {
    echo "\n❌ Database connection failed. Please check your configuration.\n";
}
?>