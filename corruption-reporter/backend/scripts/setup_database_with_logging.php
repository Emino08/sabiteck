<?php

// backend/scripts/setup_database_with_logging.php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$logFile = __DIR__ . '/db_setup.log';
// Clear previous log
file_put_contents($logFile, '');

function log_message(string $message): void
{
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] " . $message . PHP_EOL, FILE_APPEND);
}

log_message("--- Database Setup Script Started ---");

try {
    $rootPath = dirname(__DIR__);
    $vendorAutoload = $rootPath . '/vendor/autoload.php';

    if (!file_exists($vendorAutoload)) {
        log_message("[FATAL] autoload.php not found at $vendorAutoload. Please run 'composer install'.");
        exit(1);
    }
    require $vendorAutoload;

    log_message("Vendor autoload loaded.");

    $dotenv = Dotenv\Dotenv::createImmutable($rootPath);
    $dotenv->load();
    log_message(".env file loaded.");

    $dbHost = $_ENV['DB_HOST'] ?? 'localhost';
    $dbPort = $_ENV['DB_PORT'] ?? '4306';
    $dbUser = $_ENV['DB_USERNAME'] ?? 'root';
    $dbPass = $_ENV['DB_PASSWORD'] ?? '1212';
    $dbName = $_ENV['DB_DATABASE'] ?? 'corruption_reporter';

    $migrationsFile = $rootPath . '/database/migrations/001_create_initial_schema.sql';
    $seedsFile = $rootPath . '/database/seeds/002_initial_data.sql';

    log_message("Configuration loaded: Host=$dbHost, Port=$dbPort, DB=$dbName");

    // --- 1. Connect to MySQL Server ---
    log_message("[1/4] Connecting to MySQL server...");
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    log_message("  -> Connection successful.");

    // --- 2. Create Database ---
    log_message("[2/4] Creating database '$dbName' if it doesn't exist...");
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    log_message("  -> Database check/creation complete.");

    // Switch to the new database
    $pdo->exec("USE `$dbName`");
    log_message("Switched to database '$dbName'.");

    // --- 3. Run Migrations ---
    log_message("[3/4] Running database migrations...");
    if (file_exists($migrationsFile)) {
        $sql = file_get_contents($migrationsFile);
        $pdo->exec($sql);
        log_message("  -> Migrations executed successfully.");
    } else {
        throw new Exception("Migration file not found at: $migrationsFile");
    }

    // --- 4. Run Seeds ---
    log_message("[4/4] Seeding initial data...");
    if (file_exists($seedsFile)) {
        $sql = file_get_contents($seedsFile);
        $pdo->exec($sql);
        log_message("  -> Seeding executed successfully.");
    } else {
        throw new Exception("Seed file not found at: $seedsFile");
    }

    log_message("--- Database Setup Complete! ---");

} catch (Exception $e) {
    log_message("[FATAL ERROR] " . $e->getMessage());
    log_message("Stack Trace: " . $e->getTraceAsString());
    exit(1);
}

