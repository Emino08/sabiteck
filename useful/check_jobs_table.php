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

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $db = new PDO($dsn, $username, $password);

    echo "Jobs Table Full Structure:\n";
    echo "==========================\n";
    $stmt = $db->query('SHOW FULL COLUMNS FROM jobs');
    while ($row = $stmt->fetch()) {
        $null = $row['Null'] === 'NO' ? 'NOT NULL' : 'NULL';
        $default = $row['Default'] ? 'DEFAULT: ' . $row['Default'] : 'NO DEFAULT';
        echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . $null . ' - ' . $default . "\n";
    }

} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>