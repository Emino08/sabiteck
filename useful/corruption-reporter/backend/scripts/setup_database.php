<?php

// backend/scripts/setup_database.php

// --- Enable Error Reporting ---
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// --- Configuration ---
$rootPath = dirname(__DIR__);
$dotenv = Dotenv::createImmutable($rootPath);
$dotenv->load();

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '4306';
$dbUser = $_ENV['DB_USERNAME'] ?? 'root';
$dbPass = $_ENV['DB_PASSWORD'] ?? '1212';
$dbName = $_ENV['DB_DATABASE'] ?? 'corruption_reporter';

$migrationsFile = $rootPath . '/database/migrations/001_create_initial_schema.sql';
$seedsFile = $rootPath . '/database/seeds/002_initial_data.sql';

// --- Helper Functions ---
function execute_sql_file(PDO $pdo, string $filePath, string $dbName): void
{
    echo "  -> Executing SQL file: " . basename($filePath) . PHP_EOL;
    try {
        $pdo->exec("USE `$dbName`");
        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new Exception("Failed to read SQL file: $filePath");
        }
        $pdo->exec($sql);
        echo "     [SUCCESS] Executed " . basename($filePath) . PHP_EOL;
    } catch (Exception $e) {
        echo "     [ERROR] Failed to execute " . basename($filePath) . ": " . $e->getMessage() . PHP_EOL;
        exit(1);
    }
}

echo "--- Database Setup Script ---" . PHP_EOL;

// --- 1. Connect to MySQL Server ---
try {
    echo "[1/4] Connecting to MySQL server at $dbHost:$dbPort..." . PHP_EOL;
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "  -> Connection successful." . PHP_EOL;
} catch (PDOException $e) {
    echo "  [FATAL ERROR] Could not connect to MySQL server: " . $e->getMessage() . PHP_EOL;
    echo "  Please ensure your MySQL server is running and the credentials in '.env' are correct." . PHP_EOL;
    exit(1);
}

// --- 2. Create Database ---
try {
    echo "[2/4] Creating database '$dbName' if it doesn't exist..." . PHP_EOL;
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "  -> Database check/creation complete." . PHP_EOL;
} catch (PDOException $e) {
    echo "  [FATAL ERROR] Could not create database: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

// --- 3. Run Migrations ---
echo "[3/4] Running database migrations..." . PHP_EOL;
if (file_exists($migrationsFile)) {
    execute_sql_file($pdo, $migrationsFile, $dbName);
} else {
    echo "  [ERROR] Migration file not found at: $migrationsFile" . PHP_EOL;
    exit(1);
}

// --- 4. Run Seeds ---
echo "[4/4] Seeding initial data..." . PHP_EOL;
if (file_exists($seedsFile)) {
    execute_sql_file($pdo, $seedsFile, $dbName);
} else {
    echo "  [ERROR] Seed file not found at: $seedsFile" . PHP_EOL;
    exit(1);
}

echo "--- Database Setup Complete! ---" . PHP_EOL;
echo "Your database '$dbName' is now ready." . PHP_EOL;
