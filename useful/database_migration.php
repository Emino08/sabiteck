<?php
/**
 * Database Migration Script
 * This script creates all necessary tables and populates them with initial data
 * Run this script to set up the database with all required static data
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/../.env';
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
        die('Database connection failed: ' . $e->getMessage());
    }
}

function createTables($db) {
    echo "Creating database tables...\n";

    // Services table
    $db->exec("CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description TEXT,
        icon VARCHAR(100),
        popular TINYINT DEFAULT 0,
        active TINYINT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Content table
    $db->exec("CREATE TABLE IF NOT EXISTS content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        content TEXT,
        excerpt TEXT,
        featured TINYINT DEFAULT 0,
        published TINYINT DEFAULT 1,
        category VARCHAR(100),
        tags TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Portfolio table
    $db->exec("CREATE TABLE IF NOT EXISTS portfolio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description TEXT,
        category VARCHAR(100),
        technologies TEXT,
        client VARCHAR(255),
        project_url VARCHAR(255),
        featured TINYINT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Jobs table
    $db->exec("CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        requirements TEXT,
        category VARCHAR(100),
        location VARCHAR(255),
        employment_type VARCHAR(50),
        salary_range VARCHAR(100),
        featured TINYINT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Scholarships table
    $db->exec("CREATE TABLE IF NOT EXISTS scholarships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        requirements TEXT,
        category VARCHAR(100),
        region VARCHAR(255),
        education_level VARCHAR(100),
        amount VARCHAR(100),
        featured TINYINT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        deadline DATE,
        application_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Team table
    $db->exec("CREATE TABLE IF NOT EXISTS team (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        department VARCHAR(100),
        bio TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        social_links JSON,
        featured TINYINT DEFAULT 0,
        active TINYINT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Organizations table
    $db->exec("CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        website VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        address TEXT,
        featured TINYINT DEFAULT 0,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Announcements table
    $db->exec("CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50),
        priority INT DEFAULT 0,
        active TINYINT DEFAULT 1,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Settings table
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Route settings table
    $db->exec("CREATE TABLE IF NOT EXISTS route_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_name VARCHAR(100) NOT NULL UNIQUE,
        enabled TINYINT DEFAULT 1,
        seo_title VARCHAR(255),
        seo_description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Page content table
    $db->exec("CREATE TABLE IF NOT EXISTS page_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_name VARCHAR(100) NOT NULL,
        content_key VARCHAR(100) NOT NULL,
        content_value TEXT,
        content_type VARCHAR(50) DEFAULT 'text',
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_page_key (page_name, content_key)
    )");

    // Company info table
    $db->exec("CREATE TABLE IF NOT EXISTS company_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        info_key VARCHAR(100) NOT NULL UNIQUE,
        info_value TEXT,
        info_type VARCHAR(50) DEFAULT 'text',
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Company mission table
    $db->exec("CREATE TABLE IF NOT EXISTS company_mission (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mission TEXT,
        vision TEXT,
        objectives JSON,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Company values table
    $db->exec("CREATE TABLE IF NOT EXISTS company_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Company culture table
    $db->exec("CREATE TABLE IF NOT EXISTS company_culture (
        id INT AUTO_INCREMENT PRIMARY KEY,
        culture_statement TEXT,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Homepage content table
    $db->exec("CREATE TABLE IF NOT EXISTS homepage_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section VARCHAR(50) NOT NULL,
        content_key VARCHAR(100) NOT NULL,
        content_value TEXT,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_section_key (section, content_key)
    )");

    // Company features table
    $db->exec("CREATE TABLE IF NOT EXISTS company_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Contacts table
    $db->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Newsletter subscribers table
    $db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscription_type VARCHAR(50) DEFAULT 'general',
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Users table
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Admin users table
    $db->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    echo "All tables created successfully!\n";
}

function populateInitialData($db) {
    echo "Populating initial data...\n";

    // Check if data already exists
    $stmt = $db->query("SELECT COUNT(*) as count FROM services");
    if ($stmt->fetch()['count'] > 0) {
        echo "Services data already exists, skipping...\n";
    } else {
        // Insert services data
        $services = [
            ['Web Development', 'web-development', 'Custom web applications and websites using modern technologies like React, Vue.js, and PHP', 'Professional web development services', 'code', 1, 1, 1],
            ['Mobile Development', 'mobile-development', 'iOS and Android mobile applications with native performance and cross-platform compatibility', 'Native and cross-platform mobile apps', 'smartphone', 1, 1, 2],
            ['Cloud Solutions', 'cloud-solutions', 'Scalable cloud infrastructure and services for modern businesses using AWS, Azure, and Google Cloud', 'Enterprise cloud infrastructure', 'cloud', 1, 1, 3],
            ['Tech Training', 'tech-training', 'Professional technology training and education programs for individuals and corporations', 'Technology education and training', 'graduation-cap', 0, 1, 4],
            ['Digital Marketing', 'digital-marketing', 'Comprehensive digital marketing strategies including SEO, social media, and content marketing', 'Digital marketing solutions', 'megaphone', 1, 1, 5],
            ['Data Analytics', 'data-analytics', 'Business intelligence and data analytics solutions to drive informed decision making', 'Data-driven insights', 'bar-chart', 0, 1, 6]
        ];

        $stmt = $db->prepare("INSERT INTO services (title, slug, description, short_description, icon, popular, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($services as $service) {
            $stmt->execute($service);
        }
        echo "Services data inserted!\n";
    }

    // Check and insert settings
    $stmt = $db->query("SELECT COUNT(*) as count FROM settings");
    if ($stmt->fetch()['count'] > 0) {
        echo "Settings data already exists, skipping...\n";
    } else {
        $settings = [
            ['site_name', 'Sabiteck Limited'],
            ['contact_email', 'info@sabiteck.com'],
            ['company_description', 'Leading technology company in Sierra Leone'],
            ['phone', '+232 76 123 456'],
            ['address', 'Bo, Sierra Leone'],
            ['timezone', 'GMT']
        ];

        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        foreach ($settings as $setting) {
            $stmt->execute($setting);
        }
        echo "Settings data inserted!\n";
    }

    // Check and insert route settings
    $stmt = $db->query("SELECT COUNT(*) as count FROM route_settings");
    if ($stmt->fetch()['count'] > 0) {
        echo "Route settings already exist, skipping...\n";
    } else {
        $routes = [
            ['home', 1, 'Home - Sabiteck Limited', 'Technology solutions in Sierra Leone'],
            ['about', 1, 'About Us - Sabiteck Limited', 'Learn about our company'],
            ['services', 1, 'Services - Sabiteck Limited', 'Our technology services'],
            ['portfolio', 1, 'Portfolio - Sabiteck Limited', 'Our work and projects'],
            ['team', 1, 'Team - Sabiteck Limited', 'Meet our team'],
            ['blog', 1, 'Blog - Sabiteck Limited', 'Latest news and insights'],
            ['news', 1, 'News - Sabiteck Limited', 'Latest news updates'],
            ['tools', 1, 'Tools - Sabiteck Limited', 'Useful tools and utilities'],
            ['contact', 1, 'Contact - Sabiteck Limited', 'Get in touch with us'],
            ['announcements', 1, 'Announcements - Sabiteck Limited', 'Important announcements'],
            ['scholarships', 1, 'Scholarships - Sabiteck Limited', 'Available scholarships'],
            ['jobs', 1, 'Jobs - Sabiteck Limited', 'Career opportunities']
        ];

        $stmt = $db->prepare("INSERT INTO route_settings (route_name, enabled, seo_title, seo_description) VALUES (?, ?, ?, ?)");
        foreach ($routes as $route) {
            $stmt->execute($route);
        }
        echo "Route settings inserted!\n";
    }

    // Check and insert page content
    $stmt = $db->query("SELECT COUNT(*) as count FROM page_content");
    if ($stmt->fetch()['count'] > 0) {
        echo "Page content already exists, skipping...\n";
    } else {
        $aboutData = [
            ['about', 'title', 'About Sabiteck Limited', 'text'],
            ['about', 'subtitle', 'Technology Solutions for a Digital Future', 'text'],
            ['about', 'description', 'Sabiteck Limited is a leading technology company based in Bo, Sierra Leone, providing innovative solutions to businesses and individuals across West Africa.', 'text'],
            ['about', 'story', 'Founded in 2020, Sabiteck Limited has been at the forefront of digital transformation in Sierra Leone. We combine local expertise with global standards to deliver world-class technology solutions.', 'text'],
            ['about', 'journey_title', 'Our Journey', 'text'],
            ['about', 'journey_content', 'From humble beginnings in Bo, we have grown to become one of Sierra Leone\'s most trusted technology partners, serving clients across various industries.', 'text'],
            ['about', 'innovation_title', 'Innovation Focus', 'text'],
            ['about', 'innovation_content', 'We believe in the power of technology to transform lives and businesses. Our team works tirelessly to bring cutting-edge solutions to the Sierra Leonean market.', 'text']
        ];

        $stmt = $db->prepare("INSERT INTO page_content (page_name, content_key, content_value, content_type) VALUES (?, ?, ?, ?)");
        foreach ($aboutData as $data) {
            $stmt->execute($data);
        }
        echo "Page content inserted!\n";
    }

    // Check and insert company info
    $stmt = $db->query("SELECT COUNT(*) as count FROM company_info");
    if ($stmt->fetch()['count'] > 0) {
        echo "Company info already exists, skipping...\n";
    } else {
        $companyData = [
            ['name', 'Sabiteck Limited', 'text'],
            ['founded', '2020', 'text'],
            ['location', 'Bo, Sierra Leone', 'text'],
            ['employees', '25+', 'text'],
            ['industries_served', 'Technology,Education,Healthcare,Finance,Government', 'array'],
            ['certifications', 'ISO 9001:2015,ISO 27001:2013', 'array'],
            ['email', 'info@sabiteck.com', 'text'],
            ['phone', '+232 76 123 456', 'text'],
            ['address', 'Bo, Sierra Leone', 'text'],
            ['website', 'https://sabiteck.com', 'text'],
            ['registration_number', 'SL-123456789', 'text'],
            ['tax_id', 'TIN-987654321', 'text']
        ];

        $stmt = $db->prepare("INSERT INTO company_info (info_key, info_value, info_type) VALUES (?, ?, ?)");
        foreach ($companyData as $data) {
            $stmt->execute($data);
        }
        echo "Company info inserted!\n";
    }

    // Check and insert company mission
    $stmt = $db->query("SELECT COUNT(*) as count FROM company_mission");
    if ($stmt->fetch()['count'] > 0) {
        echo "Company mission already exists, skipping...\n";
    } else {
        $objectives = json_encode([
            'Deliver world-class technology solutions',
            'Foster digital literacy and skills development',
            'Support local businesses in their digital transformation',
            'Contribute to sustainable economic development'
        ]);

        $stmt = $db->prepare("INSERT INTO company_mission (mission, vision, objectives) VALUES (?, ?, ?)");
        $stmt->execute([
            'To empower Sierra Leone and West Africa through innovative technology solutions that drive economic growth and improve quality of life.',
            'To become the leading technology company in West Africa, known for excellence, innovation, and positive impact on society.',
            $objectives
        ]);
        echo "Company mission inserted!\n";
    }

    // Check and insert company values
    $stmt = $db->query("SELECT COUNT(*) as count FROM company_values");
    if ($stmt->fetch()['count'] > 0) {
        echo "Company values already exist, skipping...\n";
    } else {
        $valuesData = [
            ['Innovation', 'We continuously seek new and better ways to solve problems and create value for our clients.', 'lightbulb', 1],
            ['Excellence', 'We strive for the highest quality in everything we do, from our code to our customer service.', 'award', 2],
            ['Integrity', 'We conduct our business with honesty, transparency, and ethical principles.', 'shield', 3],
            ['Collaboration', 'We believe in the power of teamwork and partnership to achieve great things.', 'users', 4],
            ['Impact', 'We are committed to making a positive difference in our community and country.', 'heart', 5]
        ];

        $stmt = $db->prepare("INSERT INTO company_values (name, description, icon, sort_order) VALUES (?, ?, ?, ?)");
        foreach ($valuesData as $value) {
            $stmt->execute($value);
        }

        // Insert culture statement
        $stmt = $db->prepare("INSERT INTO company_culture (culture_statement) VALUES (?)");
        $stmt->execute(['Our culture is built on mutual respect, continuous learning, and a shared passion for technology and innovation.']);
        echo "Company values and culture inserted!\n";
    }

    // Check and insert homepage content
    $stmt = $db->query("SELECT COUNT(*) as count FROM homepage_content");
    if ($stmt->fetch()['count'] > 0) {
        echo "Homepage content already exists, skipping...\n";
    } else {
        $homepageData = [
            ['hero', 'title', 'Technology Solutions for Sierra Leone'],
            ['hero', 'subtitle', 'Empowering businesses and individuals through innovative technology'],
            ['hero', 'cta_text', 'Get Started'],
            ['hero', 'cta_link', '/contact'],
            ['feature_1', 'title', 'Web Development'],
            ['feature_1', 'description', 'Custom websites and web applications'],
            ['feature_1', 'icon', 'code'],
            ['feature_2', 'title', 'Mobile Apps'],
            ['feature_2', 'description', 'iOS and Android applications'],
            ['feature_2', 'icon', 'smartphone'],
            ['feature_3', 'title', 'Cloud Solutions'],
            ['feature_3', 'description', 'Scalable cloud infrastructure'],
            ['feature_3', 'icon', 'cloud']
        ];

        $stmt = $db->prepare("INSERT INTO homepage_content (section, content_key, content_value) VALUES (?, ?, ?)");
        foreach ($homepageData as $data) {
            $stmt->execute($data);
        }
        echo "Homepage content inserted!\n";
    }

    // Check and insert company features
    $stmt = $db->query("SELECT COUNT(*) as count FROM company_features");
    if ($stmt->fetch()['count'] > 0) {
        echo "Company features already exist, skipping...\n";
    } else {
        $featuresData = [
            ['Modern Technology Stack', 'We use the latest technologies and frameworks to build robust, scalable solutions.', 'layers', 1],
            ['Local Expertise', 'Deep understanding of the Sierra Leonean market and business environment.', 'map-pin', 2],
            ['24/7 Support', 'Round-the-clock support to ensure your systems are always running smoothly.', 'clock', 3],
            ['Affordable Pricing', 'Competitive pricing designed to fit local budgets without compromising quality.', 'dollar-sign', 4],
            ['Skilled Team', 'Experienced developers and consultants with international certifications.', 'users', 5],
            ['Fast Delivery', 'Agile development methodology ensures quick project turnaround times.', 'zap', 6]
        ];

        $stmt = $db->prepare("INSERT INTO company_features (title, description, icon, sort_order) VALUES (?, ?, ?, ?)");
        foreach ($featuresData as $feature) {
            $stmt->execute($feature);
        }
        echo "Company features inserted!\n";
    }

    // Create default admin user
    $stmt = $db->query("SELECT COUNT(*) as count FROM admin_users");
    if ($stmt->fetch()['count'] > 0) {
        echo "Admin user already exists, skipping...\n";
    } else {
        $stmt = $db->prepare("INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)");
        $stmt->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT), 'admin@sabiteck.com']);
        echo "Default admin user created (username: admin, password: admin123)!\n";
    }

    echo "All initial data populated successfully!\n";
}

try {
    $db = getDB();
    echo "Connected to database successfully!\n";

    createTables($db);
    populateInitialData($db);

    echo "\nDatabase migration completed successfully!\n";
    echo "You can now run the application with clean database-driven content.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
