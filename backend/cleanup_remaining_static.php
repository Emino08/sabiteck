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

function addRemainingCompanyData($db) {
    echo "📊 Adding remaining company data to database...\n";

    $additionalCompanyData = [
        ['company_employees', '50+', 'string', 'basic', 'Number of employees', true],
        ['company_mission', 'To empower businesses with innovative technology solutions that drive growth and success.', 'text', 'basic', 'Company mission statement', true],
        ['company_vision', 'To be the leading technology partner for businesses across Africa and beyond.', 'text', 'basic', 'Company vision statement', true],
        ['company_values', '["Innovation", "Excellence", "Integrity", "Collaboration", "Customer Focus", "Continuous Learning"]', 'json', 'basic', 'Company core values', true],
        ['company_services', '["Web Development", "Mobile Development", "Cloud Solutions", "Data Analytics", "Digital Marketing", "Tech Training"]', 'json', 'basic', 'List of company services', true],
        ['company_established', '2020', 'string', 'basic', 'Year company was established', true]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO company_info (setting_key, setting_value, setting_type, category, description, is_public) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($additionalCompanyData as $data) {
        $stmt->execute($data);
    }

    echo "✅ Additional company data added to database\n";
}

function cleanupIndexFile() {
    echo "🧹 Cleaning up remaining static data in index.php...\n";

    $indexFile = __DIR__ . '/public/index.php';
    $content = file_get_contents($indexFile);

    // Replace hardcoded fallback arrays with minimal fallbacks
    $content = preg_replace(
        '/if \(empty\(\$companyInfo\)\) \{\s*\$companyInfo = \[[\s\S]*?\];\s*\}/',
        'if (empty($companyInfo)) {
                $companyInfo = [
                    \'name\' => \'Sabiteck Limited\',
                    \'founded\' => \'2020\',
                    \'location\' => \'Kenya\'
                ];
            }',
        $content
    );

    // Clean up the company info section more thoroughly
    $content = preg_replace(
        '/,\s*\'employees\'[\s\S]*?\'Continuous Learning\'\s*\]\s*,?\s*\'services\'[\s\S]*?\]\s*,?\s*\'established\'[^}]*/',
        '',
        $content
    );

    // Remove any remaining large static arrays
    $content = preg_replace(
        '/\'values\' => \[\s*\'[^\']*\'[\s\S]*?\],/',
        '',
        $content
    );

    $content = preg_replace(
        '/\'services\' => \[\s*\'[^\']*\'[\s\S]*?\],/',
        '',
        $content
    );

    // Clean up trailing commas and empty lines
    $content = preg_replace('/,\s*\]/', ']', $content);
    $content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);

    file_put_contents($indexFile, $content);
    echo "✅ index.php cleaned up\n";
}

// Run cleanup
echo "🧽 Final Cleanup of Static Data\n";
echo "===============================\n\n";

$db = getDB();
if (!$db) {
    echo "❌ Database connection failed!\n";
    exit(1);
}

addRemainingCompanyData($db);
cleanupIndexFile();

echo "\n✅ Cleanup completed!\n";
echo "📋 Running final verification...\n\n";

// Run a quick verification
include __DIR__ . '/final_verification.php';
?>