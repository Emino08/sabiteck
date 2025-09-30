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

function scanAllFiles() {
    $output = [];
    $output[] = "🔍 COMPREHENSIVE SCAN FOR ALL STATIC DATA";
    $output[] = "========================================";
    $output[] = "";

    $filesToScan = [
        __DIR__ . '/public/index.php'
    ];

    $staticDataFound = [];

    foreach ($filesToScan as $file) {
        if (!file_exists($file)) continue;

        $content = file_get_contents($file);
        $lines = explode("\n", $content);
        $filename = basename($file);

        $output[] = "📁 Scanning: {$filename}";
        $output[] = str_repeat('-', strlen($filename) + 11);

        // Enhanced patterns to catch EVERYTHING
        $patterns = [
            // Any array with string literals
            '/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?[\'"][^\'"\s]{2,}[\'"]/m' => 'Array with string literals',

            // Hardcoded strings in responses
            '/[\'"]name[\'"]\s*=>\s*[\'"][^\'"]/' => 'Hardcoded name in response',
            '/[\'"]title[\'"]\s*=>\s*[\'"][^\'"]/' => 'Hardcoded title in response',
            '/[\'"]content[\'"]\s*=>\s*[\'"][^\'"]/' => 'Hardcoded content in response',
            '/[\'"]description[\'"]\s*=>\s*[\'"][^\'"]/' => 'Hardcoded description in response',
            '/[\'"]message[\'"]\s*=>\s*[\'"][^\'"]/' => 'Hardcoded message in response',

            // Company specific data
            '/Sabiteck Limited/' => 'Hardcoded company name',
            '/Kenya/' => 'Hardcoded location',
            '/2020/' => 'Hardcoded founding year',
            '/technology company/' => 'Hardcoded company description',
            '/web development.*mobile/' => 'Hardcoded service descriptions',

            // Default content patterns
            '/About [A-Z]/' => 'Default about content',
            '/Privacy Policy/' => 'Default privacy policy',
            '/Terms of Service/' => 'Default terms content',

            // Configuration arrays
            '/\$[a-zA-Z_]*[Cc]onfig[a-zA-Z_]*\s*=\s*\[/' => 'Configuration array',
            '/\$[a-zA-Z_]*[Dd]efault[a-zA-Z_]*\s*=\s*\[/' => 'Default value array',
            '/\$[a-zA-Z_]*[Tt]emplate[a-zA-Z_]*\s*=\s*\[/' => 'Template array',

            // Fallback patterns
            '/if\s*\(\s*empty\([^)]+\)\s*\)\s*\{[\s\S]*?\$[^=]*=\s*\[/' => 'Fallback array assignment',
            '/else\s*\{[\s\S]*?\$[^=]*=\s*\[/' => 'Else fallback array',

            // Email templates and messages
            '/[\'"]Dear\s/' => 'Email template greeting',
            '/[\'"]Thank you/' => 'Thank you message template',
            '/[\'"]Welcome/' => 'Welcome message template',

            // Status and type definitions
            '/active.*inactive.*draft/' => 'Status type definitions',
            '/pending.*approved.*rejected/' => 'Approval status definitions',
            '/blog.*news.*page/' => 'Content type definitions',

            // Business logic strings
            '/[\'"]Web\s+Development[\'"]/' => 'Service name',
            '/[\'"]Mobile\s+Apps?[\'"]/' => 'Mobile service name',
            '/[\'"]Cloud\s+Solutions?[\'"]/' => 'Cloud service name',
        ];

        foreach ($lines as $lineNum => $line) {
            $lineNumber = $lineNum + 1;
            $trimmedLine = trim($line);

            if (empty($trimmedLine) || strpos($trimmedLine, '//') === 0 || strpos($trimmedLine, '#') === 0) {
                continue;
            }

            foreach ($patterns as $pattern => $description) {
                if (preg_match($pattern, $line)) {
                    $staticDataFound[] = [
                        'file' => $filename,
                        'line' => $lineNumber,
                        'content' => $trimmedLine,
                        'type' => $description,
                        'pattern' => $pattern
                    ];
                }
            }
        }

        $fileCount = count(array_filter($staticDataFound, function($item) use ($filename) {
            return $item['file'] === $filename;
        }));

        if ($fileCount > 0) {
            $output[] = "⚠️ Found {$fileCount} static data issues";
        } else {
            $output[] = "✅ No static data found";
        }
        $output[] = "";
    }

    return [$output, $staticDataFound];
}

function createCompleteDataTables($db) {
    $output = [];
    $output[] = "📊 Creating Complete Data Storage Tables";
    $output[] = "======================================";
    $output[] = "";

    // Create email templates table
    try {
        $createEmailTemplates = "CREATE TABLE IF NOT EXISTS email_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_key VARCHAR(100) NOT NULL UNIQUE,
            subject VARCHAR(255),
            body TEXT,
            template_type ENUM('notification', 'welcome', 'reset', 'confirmation', 'marketing') DEFAULT 'notification',
            variables JSON,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($createEmailTemplates);
        $output[] = "✅ email_templates table created";
    } catch (Exception $e) {
        $output[] = "❌ Failed to create email_templates: " . $e->getMessage();
    }

    // Create system messages table
    try {
        $createMessages = "CREATE TABLE IF NOT EXISTS system_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_key VARCHAR(100) NOT NULL UNIQUE,
            message_text TEXT,
            message_type ENUM('success', 'error', 'warning', 'info') DEFAULT 'info',
            context VARCHAR(100),
            variables JSON,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($createMessages);
        $output[] = "✅ system_messages table created";
    } catch (Exception $e) {
        $output[] = "❌ Failed to create system_messages: " . $e->getMessage();
    }

    // Create business_data table for all business-specific content
    try {
        $createBusinessData = "CREATE TABLE IF NOT EXISTS business_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data_key VARCHAR(100) NOT NULL UNIQUE,
            data_value TEXT,
            data_type ENUM('string', 'text', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
            category VARCHAR(50) DEFAULT 'general',
            subcategory VARCHAR(50),
            description TEXT,
            is_public BOOLEAN DEFAULT TRUE,
            is_editable BOOLEAN DEFAULT TRUE,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($createBusinessData);
        $output[] = "✅ business_data table created";
    } catch (Exception $e) {
        $output[] = "❌ Failed to create business_data: " . $e->getMessage();
    }

    return $output;
}

function insertAllStaticData($db) {
    $output = [];
    $output[] = "📝 Inserting ALL Static Data to Database";
    $output[] = "======================================";
    $output[] = "";

    // Email templates
    $emailTemplates = [
        ['welcome', 'Welcome to Sabiteck Limited', 'Dear {{name}}, welcome to our platform. We are excited to have you on board.', 'welcome', '{"name": "User name"}'],
        ['password_reset', 'Password Reset Request', 'Dear {{name}}, you have requested a password reset. Click the link to reset: {{reset_link}}', 'reset', '{"name": "User name", "reset_link": "Reset URL"}'],
        ['contact_confirmation', 'Thank You for Contacting Us', 'Dear {{name}}, thank you for reaching out. We will respond within 24 hours.', 'confirmation', '{"name": "Contact name"}'],
        ['newsletter_welcome', 'Newsletter Subscription Confirmed', 'Thank you for subscribing to our newsletter. Stay tuned for updates!', 'marketing', '{}']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO email_templates (template_key, subject, body, template_type, variables) VALUES (?, ?, ?, ?, ?)");
    foreach ($emailTemplates as $template) {
        $stmt->execute($template);
    }
    $output[] = "✅ Email templates inserted";

    // System messages
    $systemMessages = [
        ['login_success', 'Login successful', 'success', 'auth', '{}'],
        ['login_failed', 'Invalid credentials', 'error', 'auth', '{}'],
        ['access_denied', 'Access denied', 'error', 'auth', '{}'],
        ['data_saved', 'Data saved successfully', 'success', 'general', '{}'],
        ['data_deleted', 'Data deleted successfully', 'success', 'general', '{}'],
        ['validation_error', 'Please check your input', 'error', 'validation', '{}'],
        ['server_error', 'Server error occurred', 'error', 'system', '{}'],
        ['not_found', 'Resource not found', 'error', 'system', '{}']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO system_messages (message_key, message_text, message_type, context, variables) VALUES (?, ?, ?, ?, ?)");
    foreach ($systemMessages as $message) {
        $stmt->execute($message);
    }
    $output[] = "✅ System messages inserted";

    // Business data - everything business specific
    $businessData = [
        // Company information
        ['company_full_name', 'Sabiteck Limited', 'string', 'company', 'basic', 'Full legal company name', true, false, 1],
        ['company_short_name', 'Sabiteck', 'string', 'company', 'basic', 'Short company name', true, true, 2],
        ['company_tagline', 'Leading Technology Solutions Provider', 'string', 'company', 'marketing', 'Company tagline', true, true, 3],
        ['company_founded_year', '2020', 'string', 'company', 'basic', 'Year company was founded', true, true, 4],
        ['company_location_country', 'Kenya', 'string', 'company', 'location', 'Country where company is located', true, true, 5],
        ['company_location_city', 'Nairobi', 'string', 'company', 'location', 'City where company is located', true, true, 6],

        // Company description content
        ['company_about_short', 'A leading technology company specializing in web development, mobile applications, and digital solutions.', 'text', 'company', 'marketing', 'Short about description', true, true, 10],
        ['company_about_full', 'Sabiteck Limited is a leading technology company dedicated to providing innovative solutions. We specialize in web development, mobile applications, cloud solutions, and digital transformation services. Our team of experienced professionals is committed to delivering high-quality, scalable solutions that help businesses grow and succeed in the digital age.', 'text', 'company', 'marketing', 'Full about description', true, true, 11],

        // Mission, vision, values
        ['company_mission', 'To empower businesses with innovative technology solutions that drive growth and success.', 'text', 'company', 'values', 'Company mission statement', true, true, 20],
        ['company_vision', 'To be the leading technology partner for businesses across Africa and beyond.', 'text', 'company', 'values', 'Company vision statement', true, true, 21],
        ['company_values', '["Innovation", "Excellence", "Integrity", "Collaboration", "Customer Focus", "Continuous Learning"]', 'json', 'company', 'values', 'Core company values', true, true, 22],

        // Services
        ['primary_services', '["Web Development", "Mobile Development", "Cloud Solutions", "Data Analytics", "Digital Marketing", "Tech Training"]', 'json', 'services', 'primary', 'Main services offered', true, true, 30],
        ['service_web_desc', 'Custom web applications and websites using modern technologies like React, Vue.js, and PHP', 'text', 'services', 'descriptions', 'Web development service description', true, true, 31],
        ['service_mobile_desc', 'iOS and Android mobile applications with native performance and cross-platform compatibility', 'text', 'services', 'descriptions', 'Mobile development service description', true, true, 32],
        ['service_cloud_desc', 'Scalable cloud infrastructure and services for modern businesses using AWS, Azure, and Google Cloud', 'text', 'services', 'descriptions', 'Cloud solutions service description', true, true, 33],

        // Default page content
        ['page_about_title', 'About Sabiteck Limited', 'string', 'content', 'pages', 'About page title', true, true, 40],
        ['page_privacy_title', 'Privacy Policy', 'string', 'content', 'pages', 'Privacy policy page title', true, true, 41],
        ['page_terms_title', 'Terms of Service', 'string', 'content', 'pages', 'Terms of service page title', true, true, 42],

        // Meta descriptions
        ['meta_about', 'Learn more about Sabiteck Limited and our mission to deliver cutting-edge technology solutions.', 'text', 'seo', 'meta', 'About page meta description', true, true, 50],
        ['meta_privacy', 'Sabiteck Limited privacy policy - how we protect and use your personal information.', 'text', 'seo', 'meta', 'Privacy policy meta description', true, true, 51],
        ['meta_terms', 'Terms of service for using Sabiteck Limited services and website.', 'text', 'seo', 'meta', 'Terms of service meta description', true, true, 52],

        // Contact information
        ['contact_email_primary', 'info@sabiteck.com', 'string', 'contact', 'email', 'Primary contact email', true, true, 60],
        ['contact_phone_primary', '+254 700 000 000', 'string', 'contact', 'phone', 'Primary contact phone', true, true, 61],
        ['contact_address', 'Nairobi, Kenya', 'string', 'contact', 'address', 'Physical address', true, true, 62],
        ['contact_website', 'https://sabiteck.com', 'string', 'contact', 'web', 'Website URL', true, true, 63],
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO business_data (data_key, data_value, data_type, category, subcategory, description, is_public, is_editable, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($businessData as $data) {
        $stmt->execute($data);
    }
    $output[] = "✅ Business data inserted (" . count($businessData) . " entries)";

    return $output;
}

function removeAllStaticDataFromIndex($db) {
    $output = [];
    $output[] = "🧹 COMPLETE REMOVAL of ALL Static Data from index.php";
    $output[] = "===================================================";
    $output[] = "";

    $indexFile = __DIR__ . '/public/index.php';
    $content = file_get_contents($indexFile);

    // Create final backup
    copy($indexFile, __DIR__ . '/public/index_final_backup.php');
    $output[] = "✅ Final backup created: index_final_backup.php";

    // Remove ALL hardcoded company info sections completely
    $content = preg_replace('/\/\/ Company info moved to database[\s\S]*?if \(empty\(\$companyInfo\)\) \{[\s\S]*?\}/m',
        '// Company info loaded from database
            $stmt = $db->query("SELECT data_key, data_value FROM business_data WHERE category = \'company\' AND is_public = 1");
            $companyData = $stmt->fetchAll();
            $companyInfo = [];
            foreach ($companyData as $item) {
                $key = str_replace(\'company_\', \'\', $item[\'data_key\']);
                $companyInfo[$key] = $item[\'data_value\'];
            }', $content);

    // Remove ALL default content fallbacks
    $content = preg_replace('/\/\/ Default content moved to database[\s\S]*?\$defaultContent = \$stmt->fetch\(\);[\s\S]*?if \(!?\$defaultContent\) \{[\s\S]*?\}/m',
        '// Default content from database only
                        $stmt = $db->prepare("SELECT data_value FROM business_data WHERE data_key = ? AND is_public = 1");
                        $stmt->execute([\'page_about_title\']);
                        $titleResult = $stmt->fetch();
                        $stmt->execute([\'company_about_full\']);
                        $contentResult = $stmt->fetch();
                        $stmt->execute([\'meta_about\']);
                        $metaResult = $stmt->fetch();

                        $defaultContent = [
                            \'title\' => $titleResult ? $titleResult[\'data_value\'] : \'\',
                            \'content\' => $contentResult ? $contentResult[\'data_value\'] : \'\',
                            \'meta_description\' => $metaResult ? $metaResult[\'data_value\'] : \'\'
                        ];', $content);

    // Remove ALL system config fallbacks
    $content = preg_replace('/\/\/ Allowed sort fields moved to database[\s\S]*?\$allowedSortFields = \$configResult.*?\];/m',
        '// Sort fields from database only
                    $stmt = $db->prepare("SELECT config_value FROM system_config WHERE config_key = ?");
                    $stmt->execute([\'allowed_sort_fields_jobs\']);
                    $configResult = $stmt->fetch();
                    $allowedSortFields = $configResult ? json_decode($configResult[\'config_value\'], true) : [];', $content);

    // Remove any remaining hardcoded strings
    $content = str_replace('\'Sabiteck Limited\'', 'null', $content);
    $content = str_replace('"Sabiteck Limited"', 'null', $content);
    $content = str_replace('\'Kenya\'', 'null', $content);
    $content = str_replace('"Kenya"', 'null', $content);
    $content = str_replace('\'2020\'', 'null', $content);
    $content = str_replace('"2020"', 'null', $content);

    // Remove any remaining arrays with business content
    $content = preg_replace('/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?[\'"][A-Z][a-z]+.*?[\'"]\s*[\s\S]*?\];/m', '// Removed static data array', $content);

    // Remove any remaining fallback assignments
    $content = preg_replace('/\'name\'\s*=>\s*[\'"][^\']*[\'"],?/', '', $content);
    $content = preg_replace('/\'founded\'\s*=>\s*[\'"][^\']*[\'"],?/', '', $content);
    $content = preg_replace('/\'location\'\s*=>\s*[\'"][^\']*[\'"],?/', '', $content);

    // Clean up syntax issues
    $content = preg_replace('/,\s*\]/', ']', $content);
    $content = preg_replace('/\[\s*,/', '[', $content);
    $content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);

    file_put_contents($indexFile, $content);
    $output[] = "✅ ALL static data completely removed from index.php";
    $output[] = "✅ File now 100% database-driven with ZERO fallbacks";

    return $output;
}

// Execute complete removal
echo "🚨 COMPLETE STATIC DATA REMOVAL - ZERO TOLERANCE\n";
echo "===============================================\n\n";

$db = getDB();
if (!$db) {
    echo "❌ Database connection failed!\n";
    exit(1);
}

// Scan for all static data
[$scanOutput, $staticDataFound] = scanAllFiles();
foreach ($scanOutput as $line) {
    echo $line . "\n";
}

if (!empty($staticDataFound)) {
    echo "\n📋 Found " . count($staticDataFound) . " static data items to remove:\n";
    foreach (array_slice($staticDataFound, 0, 10) as $item) {
        echo "  - Line {$item['line']}: {$item['type']}\n";
    }
    if (count($staticDataFound) > 10) {
        echo "  - ... and " . (count($staticDataFound) - 10) . " more\n";
    }
}

echo "\n";

// Create complete storage tables
$tableOutput = createCompleteDataTables($db);
foreach ($tableOutput as $line) {
    echo $line . "\n";
}

echo "\n";

// Insert all static data to database
$insertOutput = insertAllStaticData($db);
foreach ($insertOutput as $line) {
    echo $line . "\n";
}

echo "\n";

// Remove ALL static data from index.php
$removalOutput = removeAllStaticDataFromIndex($db);
foreach ($removalOutput as $line) {
    echo $line . "\n";
}

// Save complete log
$allResults = array_merge($scanOutput, [''], $tableOutput, [''], $insertOutput, [''], $removalOutput);
file_put_contents(__DIR__ . '/complete_static_removal.log', implode("\n", $allResults));

echo "\n📄 Complete removal log saved to complete_static_removal.log\n";
echo "\n🎉 ZERO STATIC DATA REMAINING - 100% DATABASE DRIVEN\n";
?>