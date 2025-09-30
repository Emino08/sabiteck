<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

use DevCo\Models\Database;

try {
    // Create database connection
    $db = Database::getInstance();

    echo "Inserting email settings from .env to database...\n";

    // Load .env file
    $envFile = __DIR__ . '/../.env';
    if (!file_exists($envFile)) {
        throw new Exception('.env file not found');
    }

    $envContent = file_get_contents($envFile);
    $envLines = explode("\n", $envContent);
    $envVars = [];

    foreach ($envLines as $line) {
        $line = trim($line);
        if (!empty($line) && strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $envVars[trim($key)] = trim($value);
        }
    }

    // Email settings to insert
    $emailSettings = [
        [
            'category' => 'email',
            'name' => 'smtp_host',
            'value' => $envVars['SMTP_HOST'] ?? 'smtp.titan.email',
            'label' => 'SMTP Host',
            'description' => 'SMTP server hostname for sending emails'
        ],
        [
            'category' => 'email',
            'name' => 'smtp_port',
            'value' => $envVars['SMTP_PORT'] ?? '465',
            'label' => 'SMTP Port',
            'description' => 'SMTP server port (465 for SSL, 587 for TLS)'
        ],
        [
            'category' => 'email',
            'name' => 'smtp_user',
            'value' => $envVars['SMTP_USER'] ?? 'newsletter@sabiteck.com',
            'label' => 'SMTP Username',
            'description' => 'SMTP authentication username'
        ],
        [
            'category' => 'email',
            'name' => 'smtp_password',
            'value' => $envVars['SMTP_PASS'] ?? '32770.Emo',
            'label' => 'SMTP Password',
            'description' => 'SMTP authentication password'
        ],
        [
            'category' => 'email',
            'name' => 'smtp_encryption',
            'value' => $envVars['SMTP_ENCRYPTION'] ?? 'ssl',
            'label' => 'SMTP Encryption',
            'description' => 'SMTP encryption type (ssl or tls)'
        ],
        [
            'category' => 'email',
            'name' => 'from_email',
            'value' => $envVars['SMTP_USER'] ?? 'newsletter@sabiteck.com',
            'label' => 'From Email Address',
            'description' => 'Default sender email address for newsletters'
        ],
        [
            'category' => 'email',
            'name' => 'from_name',
            'value' => 'Sabiteck Newsletter',
            'label' => 'From Name',
            'description' => 'Default sender name for newsletters'
        ]
    ];

    // Check if settings table exists, create if not
    $createTableSQL = "
        CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_setting (category, name)
        )
    ";
    $db->exec($createTableSQL);
    echo "Settings table created/verified.\n";

    // Clear existing email settings
    $stmt = $db->prepare("DELETE FROM settings WHERE category = 'email'");
    $stmt->execute();
    echo "Cleared existing email settings.\n";

    // Insert new email settings
    $stmt = $db->prepare("
        INSERT INTO settings (category, name, value)
        VALUES (?, ?, ?)
    ");

    foreach ($emailSettings as $setting) {
        $stmt->execute([$setting['category'], $setting['name'], $setting['value']]);
        echo "Inserted: {$setting['name']} = {$setting['value']}\n";
    }

    echo "\n✅ Email settings successfully inserted into database!\n";

    // Verify insertion
    echo "\nVerifying inserted settings:\n";
    $stmt = $db->prepare("SELECT name, value FROM settings WHERE category = 'email' ORDER BY name");
    $stmt->execute();
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($settings as $setting) {
        echo "  {$setting['name']}: {$setting['value']}\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}