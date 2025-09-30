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
        echo "❌ Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

$db = getDB();
if (!$db) exit(1);

echo "🔧 Fixing company_info table...\n";

try {
    // Drop and recreate the table correctly
    $db->exec("DROP TABLE IF EXISTS company_info");

    $createTable = "CREATE TABLE company_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('string', 'text', 'number', 'boolean', 'json') DEFAULT 'string',
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $db->exec($createTable);
    echo "✅ company_info table recreated successfully\n";

    // Insert company information
    $companyData = [
        ['company_name', 'Sabiteck Limited', 'string', 'basic', 'Company name', true],
        ['company_founded', '2020', 'string', 'basic', 'Year company was founded', true],
        ['company_location', 'Kenya', 'string', 'basic', 'Company location', true],
        ['company_description', 'A leading technology company specializing in web development, mobile applications, and digital solutions.', 'text', 'basic', 'Company description', true],
        ['company_phone', '+254 700 000 000', 'string', 'contact', 'Company phone number', true],
        ['company_email', 'info@sabiteck.com', 'string', 'contact', 'Company email address', true],
        ['company_website', 'https://sabiteck.com', 'string', 'contact', 'Company website URL', true],
        ['company_address', 'Nairobi, Kenya', 'string', 'contact', 'Company physical address', true]
    ];

    $stmt = $db->prepare("INSERT INTO company_info (setting_key, setting_value, setting_type, category, description, is_public) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($companyData as $data) {
        $stmt->execute($data);
    }

    echo "✅ Company information inserted successfully\n";

    // Verify the data
    $stmt = $db->query("SELECT * FROM company_info");
    $count = $stmt->rowCount();
    echo "✅ Verified: {$count} company info entries created\n";

} catch (Exception $e) {
    echo "❌ Error fixing company_info table: " . $e->getMessage() . "\n";
}

echo "\n🎉 Company info table fixed successfully!\n";
?>