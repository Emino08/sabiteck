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
        $port = $_ENV['DB_PORT'] ?? '4306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '1212';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        return new PDO($dsn, $username, $password, $options);
    } catch (PDOException $e) {
        error_log('Database connection failed: ' . $e->getMessage());
        return null;
    }
}

function createCompanyInfoTable($db) {
    $output = [];
    $output[] = "📊 Creating company_info table...";

    try {
        $createTable = "CREATE TABLE IF NOT EXISTS company_info (
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
        $output[] = "✅ company_info table created successfully";

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

        $stmt = $db->prepare("INSERT IGNORE INTO company_info (setting_key, setting_value, setting_type, category, description, is_public) VALUES (?, ?, ?, ?, ?, ?)");

        foreach ($companyData as $data) {
            $stmt->execute($data);
        }

        $output[] = "✅ Company information inserted successfully";

    } catch (Exception $e) {
        $output[] = "❌ Failed to create company_info table: " . $e->getMessage();
    }

    return $output;
}

function createDefaultContentTable($db) {
    $output = [];
    $output[] = "📄 Creating default_content table...";

    try {
        $createTable = "CREATE TABLE IF NOT EXISTS default_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content_key VARCHAR(100) NOT NULL UNIQUE,
            title VARCHAR(255),
            content TEXT,
            meta_description TEXT,
            content_type VARCHAR(50) DEFAULT 'page',
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($createTable);
        $output[] = "✅ default_content table created successfully";

        // Insert default content
        $defaultContents = [
            [
                'about',
                'About Sabiteck Limited',
                'Sabiteck Limited is a leading technology company dedicated to providing innovative solutions. We specialize in web development, mobile applications, cloud solutions, and digital transformation services. Our team of experienced professionals is committed to delivering high-quality, scalable solutions that help businesses grow and succeed in the digital age.',
                'Learn more about Sabiteck Limited and our mission to deliver cutting-edge technology solutions.',
                'page'
            ],
            [
                'privacy_policy',
                'Privacy Policy',
                'Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information.',
                'Sabiteck Limited privacy policy - how we protect and use your personal information.',
                'page'
            ],
            [
                'terms_of_service',
                'Terms of Service',
                'These terms of service govern your use of our website and services.',
                'Terms of service for using Sabiteck Limited services and website.',
                'page'
            ]
        ];

        $stmt = $db->prepare("INSERT IGNORE INTO default_content (content_key, title, content, meta_description, content_type) VALUES (?, ?, ?, ?, ?)");

        foreach ($defaultContents as $content) {
            $stmt->execute($content);
        }

        $output[] = "✅ Default content inserted successfully";

    } catch (Exception $e) {
        $output[] = "❌ Failed to create default_content table: " . $e->getMessage();
    }

    return $output;
}

function createSystemConfigTable($db) {
    $output = [];
    $output[] = "⚙️ Creating system_config table...";

    try {
        $createTable = "CREATE TABLE IF NOT EXISTS system_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            config_key VARCHAR(100) NOT NULL UNIQUE,
            config_value TEXT,
            config_type ENUM('string', 'number', 'boolean', 'array', 'json') DEFAULT 'string',
            category VARCHAR(50) DEFAULT 'general',
            description TEXT,
            is_editable BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($createTable);
        $output[] = "✅ system_config table created successfully";

        // Insert system configuration
        $systemConfigs = [
            ['allowed_sort_fields_jobs', '["created_at","title","status","deadline"]', 'array', 'jobs', 'Allowed sort fields for jobs API', true],
            ['allowed_sort_fields_content', '["created_at","title","published","updated_at"]', 'array', 'content', 'Allowed sort fields for content API', true],
            ['default_page_limit', '10', 'number', 'pagination', 'Default number of items per page', true],
            ['max_page_limit', '100', 'number', 'pagination', 'Maximum number of items per page', true],
            ['enable_registration', 'true', 'boolean', 'auth', 'Allow new user registration', true],
            ['enable_comments', 'true', 'boolean', 'content', 'Enable comments on content', true],
            ['email_notifications', 'true', 'boolean', 'notifications', 'Enable email notifications', true]
        ];

        $stmt = $db->prepare("INSERT IGNORE INTO system_config (config_key, config_value, config_type, category, description, is_editable) VALUES (?, ?, ?, ?, ?, ?)");

        foreach ($systemConfigs as $config) {
            $stmt->execute($config);
        }

        $output[] = "✅ System configuration inserted successfully";

    } catch (Exception $e) {
        $output[] = "❌ Failed to create system_config table: " . $e->getMessage();
    }

    return $output;
}

function removeStaticDataFromIndex($db) {
    $output = [];
    $output[] = "🧹 Analyzing static data removal from index.php...";

    $indexFile = __DIR__ . '/public/index.php';
    $backupFile = __DIR__ . '/public/index_before_static_removal.php';

    if (!file_exists($indexFile)) {
        $output[] = "❌ index.php not found!";
        return $output;
    }

    // Create backup
    copy($indexFile, $backupFile);
    $output[] = "✅ Backup created: index_before_static_removal.php";

    $content = file_get_contents($indexFile);

    // Remove the hardcoded sampleServices array and initialization
    $pattern1 = '/\/\/ Insert initial data only if table was just created\s*\$sampleServices = \[[\s\S]*?\];[\s\S]*?foreach \(\$sampleServices as \$service\) \{\s*\$stmt->execute\(\$service\);\s*\}/';
    $replacement1 = '// Sample services initialization removed - now managed via database seeding';
    $content = preg_replace($pattern1, $replacement1, $content);

    // Remove hardcoded company info array
    $pattern2 = '/\$companyInfo = \[[\s\S]*?\'description\' => \'[^\']*\'/';
    $replacement2 = '// Company info moved to database - fetch from company_info table
            $stmt = $db->query("SELECT setting_key, setting_value FROM company_info WHERE category = \'basic\' AND is_public = 1");
            $companyData = $stmt->fetchAll();
            $companyInfo = [];
            foreach ($companyData as $item) {
                $key = str_replace(\'company_\', \'\', $item[\'setting_key\']);
                $companyInfo[$key] = $item[\'setting_value\'];
            }

            if (empty($companyInfo)) {
                $companyInfo = [
                    \'name\' => \'Sabiteck Limited\',
                    \'founded\' => \'2020\',
                    \'location\' => \'Kenya\'';
    $content = preg_replace($pattern2, $replacement2, $content);

    // Remove hardcoded default content
    $pattern3 = '/\$defaultContent = \[[\s\S]*?\'meta_description\' => \'[^\']*\'\s*\];/';
    $replacement3 = '// Default content moved to database
                        $stmt = $db->prepare("SELECT title, content, meta_description FROM default_content WHERE content_key = ? AND active = 1");
                        $stmt->execute([\'about\']);
                        $defaultContent = $stmt->fetch();

                        if (!$defaultContent) {
                            $defaultContent = [
                                \'title\' => \'About Sabiteck Limited\',
                                \'content\' => \'Leading technology solutions provider.\',
                                \'meta_description\' => \'Learn more about Sabiteck Limited.\'
                            ];
                        }';
    $content = preg_replace($pattern3, $replacement3, $content);

    // Remove hardcoded allowed sort fields
    $pattern4 = '/\$allowedSortFields = \[\'created_at\', \'title\', \'status\', \'deadline\'\];/';
    $replacement4 = '// Allowed sort fields moved to database
                    $stmt = $db->prepare("SELECT config_value FROM system_config WHERE config_key = ? AND is_editable = 1");
                    $stmt->execute([\'allowed_sort_fields_jobs\']);
                    $configResult = $stmt->fetch();
                    $allowedSortFields = $configResult ? json_decode($configResult[\'config_value\'], true) : [\'created_at\', \'title\', \'status\', \'deadline\'];';
    $content = preg_replace($pattern4, $replacement4, $content);

    // Remove empty categories arrays that are now handled by controllers
    $content = preg_replace('/\'categories\' => \[\] \/\/ Now loaded from database via controller/', '\'categories\' => [] // Loaded via API endpoints', $content);

    // Save the updated file
    file_put_contents($indexFile, $content);
    $output[] = "✅ Static data removed from index.php";
    $output[] = "📄 Updated index.php saved";

    return $output;
}

// Run migration
echo "🚀 Static Data Migration to Database\n";
echo "====================================\n\n";

$db = getDB();
if (!$db) {
    echo "❌ Database connection failed!\n";
    exit(1);
}

$results = [];

// Create tables and migrate data
$results = array_merge($results, createCompanyInfoTable($db));
$results[] = "";
$results = array_merge($results, createDefaultContentTable($db));
$results[] = "";
$results = array_merge($results, createSystemConfigTable($db));
$results[] = "";
$results = array_merge($results, removeStaticDataFromIndex($db));

// Output results
foreach ($results as $line) {
    echo $line . "\n";
}

// Save results
file_put_contents(__DIR__ . '/static_data_migration.log', implode("\n", $results));

echo "\n📄 Migration log saved to static_data_migration.log\n";
echo "✅ Static data migration completed!\n";
echo "📋 Next: Update API endpoints to use new database tables\n";
?>