<?php
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

function getDB() {
    try {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        return new PDO($dsn, $username, $password, $options);
    } catch (PDOException $e) {
        echo "Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

$db = getDB();
if (!$db) exit(1);

$categoryTables = [
    'content_categories',
    'portfolio_categories',
    'service_categories',
    'job_categories',
    'scholarship_categories',
    'organization_categories'
];

echo "📊 Checking Category Table Structures\n";
echo "====================================\n\n";

foreach ($categoryTables as $table) {
    echo "Table: {$table}\n";
    echo str_repeat('-', strlen($table) + 7) . "\n";

    try {
        $stmt = $db->query("DESCRIBE {$table}");
        $columns = $stmt->fetchAll();

        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']}) ";
            if ($column['Null'] === 'NO') echo "[NOT NULL] ";
            if ($column['Key'] === 'PRI') echo "[PRIMARY] ";
            if ($column['Default'] !== null) echo "[DEFAULT: {$column['Default']}]";
            echo "\n";
        }

    } catch (Exception $e) {
        echo "  ❌ Error: " . $e->getMessage() . "\n";
    }

    echo "\n";
}
?>