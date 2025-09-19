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
        echo "❌ Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

function createConfigTables($db) {
    echo "📊 Creating configuration tables...\n";

    // Static messages table
    $db->exec("CREATE TABLE IF NOT EXISTS static_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_type ENUM('error', 'success', 'info') NOT NULL,
        message_code VARCHAR(100) NOT NULL UNIQUE,
        message_text TEXT NOT NULL,
        http_status_code INT DEFAULT NULL,
        context VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // API configurations table
    $db->exec("CREATE TABLE IF NOT EXISTS api_configurations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT,
        config_type ENUM('string', 'integer', 'boolean', 'json', 'array') DEFAULT 'string',
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Default field values table
    $db->exec("CREATE TABLE IF NOT EXISTS default_field_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        field_name VARCHAR(50) NOT NULL,
        default_value TEXT,
        value_type ENUM('string', 'integer', 'boolean', 'date', 'json') DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_entity_field (entity_type, field_name)
    )");

    echo "✅ Configuration tables created successfully.\n\n";
}

function insertStaticMessages($db) {
    echo "📝 Inserting static messages from index.php...\n";

    $messages = [
        // Error messages
        ['error', 'DB_CONNECTION_FAILED', 'Database connection failed', 500, 'database'],
        ['error', 'SERVICES_FETCH_FAILED', 'Failed to fetch services', 500, 'admin'],
        ['error', 'JOBS_FETCH_FAILED', 'Failed to fetch jobs', 500, 'admin'],
        ['error', 'SCHOLARSHIPS_FETCH_FAILED', 'Failed to fetch scholarships', 500, 'admin'],
        ['error', 'PORTFOLIO_FETCH_FAILED', 'Failed to fetch portfolio', 500, 'admin'],
        ['error', 'TEAM_FETCH_FAILED', 'Failed to fetch team', 500, 'admin'],
        ['error', 'ANNOUNCEMENTS_FETCH_FAILED', 'Failed to fetch announcements', 500, 'admin'],
        ['error', 'ABOUT_FETCH_FAILED', 'Failed to fetch about data', 500, 'admin'],
        ['error', 'SETTINGS_FETCH_FAILED', 'Failed to fetch settings', 500, 'admin'],
        ['error', 'CATEGORIES_FETCH_FAILED', 'Failed to fetch categories', 500, 'api'],
        ['error', 'CONTENT_TYPES_FETCH_FAILED', 'Failed to fetch content types', 500, 'api'],
        ['error', 'ROUTES_FETCH_FAILED', 'Failed to fetch routes', 500, 'api'],
        ['error', 'INVALID_REQUEST', 'Invalid request', 400, 'validation'],
        ['error', 'JOB_NOT_FOUND', 'Job not found', 404, 'validation'],
        ['error', 'SCHOLARSHIP_NOT_FOUND', 'Scholarship not found', 404, 'validation'],
        ['error', 'PORTFOLIO_NOT_FOUND', 'Portfolio item not found', 404, 'validation'],
        ['error', 'TEAM_MEMBER_NOT_FOUND', 'Team member not found', 404, 'validation'],
        ['error', 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found', 404, 'validation'],
        ['error', 'JOBS_CRUD_FAILED', 'Failed to process job request', 500, 'crud'],
        ['error', 'SCHOLARSHIPS_CRUD_FAILED', 'Failed to process scholarship request', 500, 'crud'],
        ['error', 'PORTFOLIO_CRUD_FAILED', 'Failed to process portfolio request', 500, 'crud'],
        ['error', 'TEAM_CRUD_FAILED', 'Failed to process team request', 500, 'crud'],
        ['error', 'ANNOUNCEMENTS_CRUD_FAILED', 'Failed to process announcement request', 500, 'crud'],
        ['error', 'ABOUT_CRUD_FAILED', 'Failed to process about request', 500, 'crud'],

        // Success messages
        ['success', 'JOB_CREATED', 'Job created successfully', 201, 'crud'],
        ['success', 'JOB_UPDATED', 'Job updated successfully', 200, 'crud'],
        ['success', 'JOB_DELETED', 'Job deleted successfully', 200, 'crud'],
        ['success', 'SCHOLARSHIP_CREATED', 'Scholarship created successfully', 201, 'crud'],
        ['success', 'SCHOLARSHIP_UPDATED', 'Scholarship updated successfully', 200, 'crud'],
        ['success', 'SCHOLARSHIP_DELETED', 'Scholarship deleted successfully', 200, 'crud'],
        ['success', 'PORTFOLIO_CREATED', 'Portfolio item created successfully', 201, 'crud'],
        ['success', 'PORTFOLIO_UPDATED', 'Portfolio item updated successfully', 200, 'crud'],
        ['success', 'PORTFOLIO_DELETED', 'Portfolio item deleted successfully', 200, 'crud'],
        ['success', 'TEAM_CREATED', 'Team member created successfully', 201, 'crud'],
        ['success', 'TEAM_UPDATED', 'Team member updated successfully', 200, 'crud'],
        ['success', 'TEAM_DELETED', 'Team member deleted successfully', 200, 'crud'],
        ['success', 'ANNOUNCEMENT_CREATED', 'Announcement created successfully', 201, 'crud'],
        ['success', 'ANNOUNCEMENT_UPDATED', 'Announcement updated successfully', 200, 'crud'],
        ['success', 'ANNOUNCEMENT_DELETED', 'Announcement deleted successfully', 200, 'crud'],
        ['success', 'ABOUT_UPDATED', 'About information updated successfully', 200, 'crud'],
        ['success', 'SETTINGS_UPDATED', 'Settings updated successfully', 200, 'crud'],

        // Info messages
        ['info', 'API_INFO', 'Sabiteck Limited API', 200, 'api'],
        ['info', 'DATA_RETRIEVED', 'Data retrieved successfully', 200, 'api']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO static_messages (message_type, message_code, message_text, http_status_code, context) VALUES (?, ?, ?, ?, ?)");
    foreach ($messages as $message) {
        $stmt->execute($message);
    }

    echo "   ✅ Inserted " . count($messages) . " static messages\n";
}

function insertApiConfigurations($db) {
    echo "⚙️ Inserting API configurations...\n";

    $configs = [
        ['api_name', 'Sabiteck Limited API', 'string', 'Main API name displayed in responses'],
        ['api_version', '1.0.0', 'string', 'Current API version'],
        ['company_name', 'Sabiteck Limited', 'string', 'Company name used throughout the API'],
        ['cors_allowed_origins', '*', 'string', 'CORS allowed origins'],
        ['cors_allowed_methods', 'GET,POST,PUT,DELETE,OPTIONS', 'string', 'CORS allowed HTTP methods'],
        ['cors_allowed_headers', 'Content-Type,Authorization,X-Requested-With', 'string', 'CORS allowed headers'],
        ['default_pagination_limit', '20', 'integer', 'Default pagination limit'],
        ['max_pagination_limit', '100', 'integer', 'Maximum pagination limit'],
        ['default_currency', 'USD', 'string', 'Default currency for financial data'],
        ['job_deadline_default_days', '30', 'integer', 'Default days to add for job deadlines'],
        ['scholarship_deadline_default_days', '90', 'integer', 'Default days to add for scholarship deadlines']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO api_configurations (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)");
    foreach ($configs as $config) {
        $stmt->execute($config);
    }

    echo "   ✅ Inserted " . count($configs) . " API configurations\n";
}

function insertDefaultFieldValues($db) {
    echo "🔧 Inserting default field values...\n";

    $defaults = [
        // Job defaults
        ['job', 'type', 'full-time', 'string', 'Default job type'],
        ['job', 'status', 'draft', 'string', 'Default job status'],
        ['job', 'applications_count', '0', 'integer', 'Default applications count'],

        // Scholarship defaults
        ['scholarship', 'status', 'draft', 'string', 'Default scholarship status'],
        ['scholarship', 'currency', 'USD', 'string', 'Default scholarship currency'],
        ['scholarship', 'applications_count', '0', 'integer', 'Default applications count'],

        // Portfolio defaults
        ['portfolio', 'status', 'active', 'string', 'Default portfolio status'],
        ['portfolio', 'featured', '0', 'boolean', 'Default featured status'],
        ['portfolio', 'team_size', '1', 'integer', 'Default team size'],

        // Team defaults
        ['team', 'active', '1', 'boolean', 'Default team member active status'],
        ['team', 'featured', '0', 'boolean', 'Default team member featured status'],
        ['team', 'sort_order', '0', 'integer', 'Default sort order'],

        // Announcement defaults
        ['announcement', 'type', 'news', 'string', 'Default announcement type'],
        ['announcement', 'priority', 'normal', 'string', 'Default announcement priority'],
        ['announcement', 'active', '1', 'boolean', 'Default announcement active status']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO default_field_values (entity_type, field_name, default_value, value_type, description) VALUES (?, ?, ?, ?, ?)");
    foreach ($defaults as $default) {
        $stmt->execute($default);
    }

    echo "   ✅ Inserted " . count($defaults) . " default field values\n";
}

function insertCategoriesData($db) {
    echo "📂 Migrating categories data from index.php...\n";

    // Service categories (extracted from index.php default arrays)
    $serviceCategories = [
        ['Web Development', 'web-development', 'Custom web applications and websites', '#3B82F6', 1, 1],
        ['Mobile Development', 'mobile-development', 'iOS and Android mobile applications', '#10B981', 1, 2],
        ['Cloud Solutions', 'cloud-solutions', 'Scalable cloud infrastructure', '#F59E0B', 1, 3],
        ['Data Analytics', 'data-analytics', 'Business intelligence and analytics', '#EF4444', 1, 4],
        ['Digital Marketing', 'digital-marketing', 'Digital marketing strategies', '#8B5CF6', 1, 5],
        ['Consulting', 'consulting', 'Technology consulting services', '#06B6D4', 1, 6]
    ];

    // Ensure service_categories table exists with correct structure
    $db->exec("CREATE TABLE IF NOT EXISTS service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $db->prepare("INSERT IGNORE INTO service_categories (name, slug, description, color, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($serviceCategories as $category) {
        $stmt->execute($category);
    }

    // Portfolio categories
    $portfolioCategories = [
        ['Web Application', 'web-application', 'Full-stack web applications', '#3B82F6', 1, 1],
        ['Mobile App', 'mobile-app', 'Mobile applications for iOS and Android', '#10B981', 1, 2],
        ['E-commerce', 'e-commerce', 'Online stores and marketplace platforms', '#F59E0B', 1, 3],
        ['CMS', 'cms', 'Content management systems', '#EF4444', 1, 4],
        ['API Development', 'api-development', 'RESTful APIs and microservices', '#8B5CF6', 1, 5],
        ['UI/UX Design', 'ui-ux-design', 'User interface and experience design', '#06B6D4', 1, 6],
        ['Business Intelligence', 'business-intelligence', 'Analytics and reporting systems', '#EC4899', 1, 7],
        ['Cloud Solutions', 'cloud-solutions', 'Cloud-based applications and services', '#84CC16', 1, 8]
    ];

    // Ensure portfolio_categories table exists
    $db->exec("CREATE TABLE IF NOT EXISTS portfolio_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $db->prepare("INSERT IGNORE INTO portfolio_categories (name, slug, description, color, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($portfolioCategories as $category) {
        $stmt->execute($category);
    }

    // Content categories (from blog categories in index.php)
    $contentCategories = [
        ['Technology', 'technology', 'Technology news and insights', '#3B82F6', 1, 1],
        ['Development', 'development', 'Software development topics', '#10B981', 1, 2],
        ['Design', 'design', 'UI/UX and design articles', '#F59E0B', 1, 3],
        ['Business', 'business', 'Business and entrepreneurship', '#EF4444', 1, 4],
        ['Tutorial', 'tutorial', 'Step-by-step tutorials', '#8B5CF6', 1, 5],
        ['Company News', 'company-news', 'Company announcements and updates', '#06B6D4', 1, 6]
    ];

    // Ensure content_categories table exists (if not already created)
    $db->exec("CREATE TABLE IF NOT EXISTS content_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $db->prepare("INSERT IGNORE INTO content_categories (name, slug, description, color, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($contentCategories as $category) {
        $stmt->execute($category);
    }

    // Content types (from content types in index.php)
    $contentTypes = [
        ['Blog Post', 'blog-post', 'Regular blog articles', 'FileText', 1, 1],
        ['News Article', 'news-article', 'News and announcements', 'Newspaper', 1, 2],
        ['Tutorial', 'tutorial', 'Step-by-step guides', 'BookOpen', 1, 3],
        ['Company Announcement', 'company-announcement', 'Official company news', 'Megaphone', 1, 4],
        ['Static Page', 'static-page', 'Static content pages', 'File', 1, 5]
    ];

    // Ensure content_types table exists
    $db->exec("CREATE TABLE IF NOT EXISTS content_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'FileText',
        active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $db->prepare("INSERT IGNORE INTO content_types (name, slug, description, icon, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($contentTypes as $type) {
        $stmt->execute($type);
    }

    echo "   ✅ Migrated service categories, portfolio categories, content categories, and content types\n";
}

// Execute migration
echo "🚀 COMPREHENSIVE STATIC DATA MIGRATION\n";
echo "=====================================\n\n";

$db = getDB();
if (!$db) {
    echo "❌ Migration failed: Could not connect to database on port 4306\n";
    exit(1);
}

try {
    createConfigTables($db);
    insertStaticMessages($db);
    insertApiConfigurations($db);
    insertDefaultFieldValues($db);
    insertCategoriesData($db);

    echo "\n🎉 MIGRATION COMPLETED SUCCESSFULLY!\n";
    echo "=====================================\n";
    echo "✅ All static data extracted from index.php and migrated to database\n";
    echo "✅ Database connected on port 4306 with password 1212\n";
    echo "✅ Error messages, success messages, and configurations stored\n";
    echo "✅ Default field values and categories data migrated\n";
    echo "✅ Ready for controller-based architecture\n\n";

    echo "📊 SUMMARY:\n";
    echo "- Static messages table: Error and success messages\n";
    echo "- API configurations table: Settings and configurations\n";
    echo "- Default field values table: Entity default values\n";
    echo "- Categories data: Service, portfolio, content categories and types\n\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>