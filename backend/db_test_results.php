<?php
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables from backend/.env
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

function testAndSetupDB() {
    $output = [];
    $output[] = "🔍 Testing Database Connection";
    $output[] = "================================";

    try {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';

        $output[] = "Configuration:";
        $output[] = "Host: {$host}";
        $output[] = "Port: {$port}";
        $output[] = "Database: {$dbname}";
        $output[] = "Username: {$username}";
        $output[] = "Password: " . (empty($password) ? '(empty)' : '***');
        $output[] = "";

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $db = new PDO($dsn, $username, $password, $options);
        $output[] = "✅ Database connection successful!";

        // Test query
        $stmt = $db->query("SELECT 1 as test");
        $result = $stmt->fetch();
        $output[] = "✅ Test query successful: " . $result['test'];
        $output[] = "";

        // List existing tables
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $output[] = "📋 Existing tables (" . count($tables) . "):";
        foreach ($tables as $table) {
            $output[] = "  - {$table}";
        }
        $output[] = "";

        // Create lookup tables for static data
        $output[] = "🛠️ Creating lookup tables for static data...";
        $output[] = "";

        // Categories table for various content types
        $categoryTables = [
            'content_categories' => "Content categories (blog, news, etc.)",
            'portfolio_categories' => "Portfolio project categories",
            'service_categories' => "Service categories",
            'job_categories' => "Job categories",
            'scholarship_categories' => "Scholarship categories",
            'organization_categories' => "Organization categories"
        ];

        foreach ($categoryTables as $tableName => $description) {
            try {
                $createTable = "CREATE TABLE IF NOT EXISTS {$tableName} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    icon VARCHAR(100),
                    color VARCHAR(20),
                    active BOOLEAN DEFAULT TRUE,
                    sort_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )";
                $db->exec($createTable);
                $output[] = "✅ Created table: {$tableName} - {$description}";
            } catch (Exception $e) {
                $output[] = "❌ Failed to create {$tableName}: " . $e->getMessage();
            }
        }

        // Content types table
        try {
            $createContentTypes = "CREATE TABLE IF NOT EXISTS content_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(100),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            $db->exec($createContentTypes);
            $output[] = "✅ Created table: content_types";
        } catch (Exception $e) {
            $output[] = "❌ Failed to create content_types: " . $e->getMessage();
        }

        // Announcement types table
        try {
            $createAnnouncementTypes = "CREATE TABLE IF NOT EXISTS announcement_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(100),
                color VARCHAR(20),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            $db->exec($createAnnouncementTypes);
            $output[] = "✅ Created table: announcement_types";
        } catch (Exception $e) {
            $output[] = "❌ Failed to create announcement_types: " . $e->getMessage();
        }

        $output[] = "";
        $output[] = "📊 Populating tables with static data...";
        $output[] = "";

        // Insert content categories
        $contentCategories = [
            ['Technology', 'technology', 'Technical articles and tutorials'],
            ['Development', 'development', 'Software development content'],
            ['Design', 'design', 'Design and UX/UI content'],
            ['Business', 'business', 'Business and strategy content'],
            ['Tutorial', 'tutorial', 'Step-by-step tutorials'],
            ['Company News', 'company-news', 'Company announcements and news'],
            ['Partnership', 'partnership', 'Partnership announcements'],
            ['Product Update', 'product-update', 'Product updates and releases'],
            ['Industry News', 'industry-news', 'Industry news and trends'],
            ['Sports', 'sports', 'Sports related content'],
            ['Entertainment', 'entertainment', 'Entertainment content'],
            ['Health', 'health', 'Health and wellness content'],
            ['Education', 'education', 'Educational content'],
            ['General', 'general', 'General content']
        ];

        foreach ($contentCategories as $category) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO content_categories (name, slug, description) VALUES (?, ?, ?)");
                $stmt->execute($category);
            } catch (Exception $e) {
                $output[] = "⚠️ Content category '{$category[0]}' may already exist";
            }
        }
        $output[] = "✅ Populated content_categories with " . count($contentCategories) . " entries";

        // Insert portfolio categories
        $portfolioCategories = [
            ['Web Development', 'web-development', 'Web application projects'],
            ['Mobile Development', 'mobile-development', 'Mobile app projects'],
            ['Study Abroad Platform', 'study-abroad-platform', 'Educational platform projects'],
            ['Business Intelligence', 'business-intelligence', 'BI and analytics projects'],
            ['E-commerce', 'e-commerce', 'E-commerce solutions'],
            ['Educational Platform', 'educational-platform', 'Learning management systems'],
            ['Consulting Project', 'consulting-project', 'Consulting and advisory projects'],
            ['API Development', 'api-development', 'API and backend services'],
            ['UI/UX Design', 'ui-ux-design', 'Design and user experience projects'],
            ['Other', 'other', 'Other project types']
        ];

        foreach ($portfolioCategories as $category) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO portfolio_categories (name, slug, description) VALUES (?, ?, ?)");
                $stmt->execute($category);
            } catch (Exception $e) {
                $output[] = "⚠️ Portfolio category '{$category[0]}' may already exist";
            }
        }
        $output[] = "✅ Populated portfolio_categories with " . count($portfolioCategories) . " entries";

        // Insert service categories
        $serviceCategories = [
            ['Study Abroad', 'study-abroad', 'International education services'],
            ['Business Intelligence', 'business-intelligence', 'BI and data analytics services'],
            ['Consulting', 'consulting', 'Business consulting services'],
            ['Technology', 'technology', 'Technology solutions'],
            ['Education', 'education', 'Educational services'],
            ['Immigration', 'immigration', 'Immigration assistance'],
            ['Career Development', 'career-development', 'Career guidance and development'],
            ['Training', 'training', 'Professional training programs']
        ];

        foreach ($serviceCategories as $category) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO service_categories (name, slug, description) VALUES (?, ?, ?)");
                $stmt->execute($category);
            } catch (Exception $e) {
                $output[] = "⚠️ Service category '{$category[0]}' may already exist";
            }
        }
        $output[] = "✅ Populated service_categories with " . count($serviceCategories) . " entries";

        // Insert content types
        $contentTypes = [
            ['Blog Post', 'blog', 'Blog articles and posts'],
            ['News Article', 'news', 'News and current events'],
            ['Company Announcement', 'announcement', 'Official company announcements'],
            ['Tutorial', 'tutorial', 'Educational tutorials'],
            ['Static Page', 'page', 'Static website pages']
        ];

        foreach ($contentTypes as $type) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO content_types (name, slug, description) VALUES (?, ?, ?)");
                $stmt->execute($type);
            } catch (Exception $e) {
                $output[] = "⚠️ Content type '{$type[0]}' may already exist";
            }
        }
        $output[] = "✅ Populated content_types with " . count($contentTypes) . " entries";

        // Insert announcement types
        $announcementTypes = [
            ['News', 'news', 'General news announcements', 'newspaper', '#3b82f6'],
            ['Event', 'event', 'Event announcements', 'calendar', '#10b981'],
            ['Maintenance', 'maintenance', 'System maintenance notices', 'wrench', '#f59e0b'],
            ['Promotion', 'promotion', 'Promotional announcements', 'tag', '#8b5cf6'],
            ['Alert', 'alert', 'Important alerts', 'alert-triangle', '#ef4444']
        ];

        foreach ($announcementTypes as $type) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO announcement_types (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute($type);
            } catch (Exception $e) {
                $output[] = "⚠️ Announcement type '{$type[0]}' may already exist";
            }
        }
        $output[] = "✅ Populated announcement_types with " . count($announcementTypes) . " entries";

        $output[] = "";
        $output[] = "🎉 Database setup completed successfully!";
        $output[] = "📝 All static data has been moved from code to database tables.";

        return ['success' => true, 'output' => $output, 'db' => $db];

    } catch (PDOException $e) {
        $output[] = "❌ Database connection failed: " . $e->getMessage();
        return ['success' => false, 'output' => $output, 'db' => null];
    } catch (Exception $e) {
        $output[] = "❌ Setup failed: " . $e->getMessage();
        return ['success' => false, 'output' => $output, 'db' => null];
    }
}

// Run the test and setup
$result = testAndSetupDB();

// Output results
foreach ($result['output'] as $line) {
    echo $line . "\n";
}

// Save results to a log file
file_put_contents(__DIR__ . '/db_test_log.txt', implode("\n", $result['output']));
echo "\nResults saved to db_test_log.txt\n";

if ($result['success']) {
    echo "\n✅ Ready to proceed with controller creation and static data removal!\n";
} else {
    echo "\n❌ Please fix database issues before proceeding.\n";
}
?>