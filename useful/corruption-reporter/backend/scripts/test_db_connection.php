<?php

// backend/scripts/test_db_connection.php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

echo "--- Database Connection Test ---" . PHP_EOL;

// Manually define connection details to rule out .env issues
$dbHost = 'localhost';
$dbPort = '4306';
$dbUser = 'root';
$dbPass = '1212';
$dbName = 'corruption_reporter';

echo "Attempting to connect to:" . PHP_EOL;
echo "  Host: $dbHost" . PHP_EOL;
echo "  Port: $dbPort" . PHP_EOL;
echo "  User: $dbUser" . PHP_EOL;
echo "  Database: $dbName" . PHP_EOL;

try {
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;dbname=$dbName", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5, // 5-second timeout
    ]);

    echo PHP_EOL . "✅ SUCCESS: Connected to the database successfully!" . PHP_EOL;

    // Check for tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($tables) > 0) {
        echo "  -> Found " . count($tables) . " tables." . PHP_EOL;
    } else {
        echo "  -> The database is empty. Please run the setup script." . PHP_EOL;
    }

} catch (PDOException $e) {
    echo PHP_EOL . "❌ FAILURE: Could not connect to the database." . PHP_EOL;
    echo "  Error: " . $e->getMessage() . PHP_EOL;
    echo "  Please check the following:" . PHP_EOL;
    echo "  1. Is your MySQL server running on port $dbPort?" . PHP_EOL;
    echo "  2. Are the username ('$dbUser') and password correct?" . PHP_EOL;
    echo "  3. Does the user '$dbUser' have permission to connect from localhost?" . PHP_EOL;
    echo "  4. Is a firewall blocking the connection?" . PHP_EOL;
    exit(1);
}

