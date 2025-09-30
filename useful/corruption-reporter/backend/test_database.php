<?php

// backend/test_database.php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: text/plain; charset=utf-8');

echo "--- Corruption Reporter: Database Setup & Test Script ---" . PHP_EOL . PHP_EOL;

try {
    // --- 1. Load Environment ---
    echo "[1/6] Loading configuration..." . PHP_EOL;

    // Load .env file manually without requiring vendor/autoload.php
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue; // Skip comments
            }
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
        echo "  -> OK: .env file loaded manually." . PHP_EOL;
    } else {
        echo "  -> WARNING: .env file not found, using defaults." . PHP_EOL;
    }

    $dbHost = $_ENV['DB_HOST'] ?? 'localhost';
    $dbPort = $_ENV['DB_PORT'] ?? '4306';
    $dbUser = $_ENV['DB_USERNAME'] ?? 'root';
    $dbPass = $_ENV['DB_PASSWORD'] ?? '1212';
    $dbName = $_ENV['DB_DATABASE'] ?? 'corruption_reporter';
    echo "  -> OK: Configuration loaded (Host: $dbHost:$dbPort, DB: $dbName)." . PHP_EOL . PHP_EOL;

    // --- 2. Create Database and Test Connection ---
    echo "[2/6] Connecting to server and ensuring database exists..." . PHP_EOL;
    try {
        // Connect without specifying dbname first
        $pdo = new PDO("mysql:host=$dbHost;port=$dbPort", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        echo "  -> OK: Connected to MySQL server." . PHP_EOL;

        // Create database if it doesn't exist
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "  -> OK: Database '$dbName' created or already exists." . PHP_EOL;

        // Switch to the database for subsequent operations
        $pdo->exec("USE `$dbName`");
        echo "  -> ✅ SUCCESS: Connection to database '$dbName' is active." . PHP_EOL . PHP_EOL;

    } catch (PDOException $e) {
        echo PHP_EOL . "--- ❌ DATABASE CONNECTION FAILED ---" . PHP_EOL;
        echo "Error: " . $e->getMessage() . PHP_EOL;
        exit(1);
    }

    // --- 3. Create Tables ---
    echo "[3/6] Creating database tables..." . PHP_EOL;

    // Create roles table first (needed for foreign keys)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS roles (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            is_system_role BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");

    // Create institutions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS institutions (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            address TEXT,
            contact_email VARCHAR(255),
            contact_phone VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_active (is_active)
        )
    ");

    // Create users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            role_id BIGINT NOT NULL,
            institution_id BIGINT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            email_verified_at TIMESTAMP NULL,
            two_factor_enabled BOOLEAN DEFAULT FALSE,
            two_factor_secret VARCHAR(32) NULL,
            last_login_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role_id),
            INDEX idx_institution (institution_id),
            INDEX idx_active (is_active),
            FOREIGN KEY (role_id) REFERENCES roles(id),
            FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
        )
    ");

    // Create report_categories table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS report_categories (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            color_code VARCHAR(7) DEFAULT '#6B7280',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Create reports table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS reports (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            case_id VARCHAR(20) NOT NULL UNIQUE,
            reporter_id BIGINT NULL,
            category_id BIGINT NOT NULL,
            institution_id BIGINT NULL,
            assigned_investigator_id BIGINT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT NOT NULL,
            incident_date DATE,
            incident_location TEXT,
            status ENUM('received', 'under_review', 'investigating', 'action_taken', 'closed', 'rejected') DEFAULT 'received',
            priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            is_anonymous BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT FALSE,
            device_id VARCHAR(255),
            ip_address VARCHAR(45),
            user_agent TEXT,
            gps_latitude DECIMAL(10, 8) NULL,
            gps_longitude DECIMAL(11, 8) NULL,
            gps_accuracy FLOAT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP NULL,
            closed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_case_id (case_id),
            INDEX idx_reporter (reporter_id),
            INDEX idx_category (category_id),
            INDEX idx_institution (institution_id),
            INDEX idx_investigator (assigned_investigator_id),
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_submitted_at (submitted_at),
            INDEX idx_anonymous (is_anonymous),
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES report_categories(id),
            FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
            FOREIGN KEY (assigned_investigator_id) REFERENCES users(id) ON DELETE SET NULL
        )
    ");

    // Create permissions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS permissions (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            resource VARCHAR(50) NOT NULL,
            action VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    echo "  -> ✅ SUCCESS: All required tables created." . PHP_EOL . PHP_EOL;

    // --- 4. Insert Seed Data ---
    echo "[4/6] Inserting seed data..." . PHP_EOL;

    // Insert roles
    $pdo->exec("
        INSERT IGNORE INTO roles (name, description, is_system_role) VALUES
        ('super_admin', 'Super Administrator with full system access', TRUE),
        ('institution_admin', 'Institution Administrator managing reports and investigators', TRUE),
        ('investigator', 'Investigator reviewing assigned reports', TRUE),
        ('reporter', 'Reporter submitting corruption reports', TRUE)
    ");

    // Insert default institution
    $pdo->exec("
        INSERT IGNORE INTO institutions (name, code, description) VALUES
        ('System Administration', 'SYS_ADMIN', 'System administration institution for super administrators')
    ");

    // Insert default categories
    $pdo->exec("
        INSERT IGNORE INTO report_categories (name, description, color_code) VALUES
        ('Bribery', 'Reports of bribery and kickbacks', '#ef4444'),
        ('Embezzlement', 'Reports of funds misappropriation', '#f97316'),
        ('Abuse of Power', 'Reports of authority misuse', '#eab308'),
        ('Fraud', 'Reports of fraudulent activities', '#8b5cf6'),
        ('Other', 'Other corruption-related reports', '#6b7280')
    ");

    // Create default super admin user
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->exec("
        INSERT IGNORE INTO users (email, password_hash, full_name, role_id, institution_id, is_active, email_verified_at) VALUES
        ('admin@corruption-reporter.com', '$hashedPassword', 'Super Administrator', 1, 1, TRUE, NOW())
    ");

    echo "  -> ✅ SUCCESS: Seed data inserted." . PHP_EOL . PHP_EOL;

    // --- 5. Verify Tables ---
    echo "[5/6] Verifying table creation..." . PHP_EOL;
    $requiredTables = ['users', 'roles', 'reports', 'institutions', 'permissions', 'report_categories'];
    $stmt = $pdo->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $missingTables = array_diff($requiredTables, $existingTables);

    if (empty($missingTables)) {
        echo "  -> ✅ SUCCESS: All required tables exist." . PHP_EOL;
        echo "  -> Tables found: " . implode(', ', $existingTables) . PHP_EOL . PHP_EOL;
    } else {
        throw new Exception("The following required tables are missing: " . implode(', ', $missingTables));
    }

    // --- 6. Verify Seed Data ---
    echo "[6/6] Verifying seed data..." . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM `roles`");
    $roleCount = $stmt->fetchColumn();
    echo "  -> Roles: $roleCount" . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM `institutions`");
    $institutionCount = $stmt->fetchColumn();
    echo "  -> Institutions: $institutionCount" . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM `report_categories`");
    $categoryCount = $stmt->fetchColumn();
    echo "  -> Categories: $categoryCount" . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM `users`");
    $userCount = $stmt->fetchColumn();
    echo "  -> Users: $userCount" . PHP_EOL;

    if ($roleCount >= 4 && $institutionCount >= 1 && $categoryCount >= 5 && $userCount >= 1) {
        echo "  -> ✅ SUCCESS: All seed data verified." . PHP_EOL . PHP_EOL;
    } else {
        echo "  -> ⚠️ WARNING: Some seed data may be missing." . PHP_EOL . PHP_EOL;
    }

    echo "--- ✅ DATABASE SETUP COMPLETE ---" . PHP_EOL;
    echo "Database: $dbName" . PHP_EOL;
    echo "Admin Login: admin@corruption-reporter.com" . PHP_EOL;
    echo "Admin Password: admin123" . PHP_EOL;
    echo "Backend ready to start on port 9000" . PHP_EOL;

} catch (Exception $e) {
    echo PHP_EOL . "--- ❌ DATABASE SETUP FAILED ---" . PHP_EOL;
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . " on line " . $e->getLine() . PHP_EOL;
    exit(1);
}
