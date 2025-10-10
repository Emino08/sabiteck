<?php
/**
 * RBAC System Migration Script - Step by Step
 */

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

// Database connection
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
        die('Database connection failed: ' . $e->getMessage() . "\n");
    }
}

echo "========================================\n";
echo "RBAC System Migration\n";
echo "========================================\n\n";

$db = getDB();

try {
    // Step 1: Drop existing tables
    echo "Step 1: Cleaning up existing RBAC tables...\n";
    $db->exec("DROP TABLE IF EXISTS `user_permissions`");
    $db->exec("DROP TABLE IF EXISTS `role_permissions`");
    $db->exec("DROP TABLE IF EXISTS `permissions`");
    $db->exec("DROP TABLE IF EXISTS `user_roles`");
    $db->exec("DROP TABLE IF EXISTS `roles`");
    echo "✓ Cleanup completed\n\n";

    // Step 2: Create roles table
    echo "Step 2: Creating roles table...\n";
    $db->exec("
        CREATE TABLE `roles` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `name` VARCHAR(50) NOT NULL UNIQUE,
          `display_name` VARCHAR(100) NOT NULL,
          `description` TEXT,
          `is_system` TINYINT(1) DEFAULT 0,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX `idx_name` (`name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Roles table created\n\n";

    // Step 3: Insert roles
    echo "Step 3: Inserting predefined roles...\n";
    $stmt = $db->prepare("INSERT INTO `roles` (`name`, `display_name`, `description`, `is_system`) VALUES (?, ?, ?, 1)");
    $roles = [
        ['admin', 'Admin', 'Full access to all modules — can add, edit, delete, publish, and manage users/roles.'],
        ['content_editor', 'Content Editor', 'Focuses on creating, updating, and publishing website content, blogs, and news.'],
        ['program_manager', 'Program Manager', 'Manages all program-related items (jobs, scholarships, organizations, etc.).'],
        ['marketing_officer', 'Marketing Officer', 'Handles promotion, newsletter, and analytics insights for outreach.'],
        ['analyst', 'Analyst', 'Can only view analytics, insights, and reports.'],
        ['blogger', 'Blogger', 'Focuses on creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter.']
    ];
    foreach ($roles as $role) {
        $stmt->execute($role);
    }
    echo "✓ " . count($roles) . " roles inserted\n\n";

    // Step 4: Create permissions table
    echo "Step 4: Creating permissions table...\n";
    $db->exec("
        CREATE TABLE `permissions` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `name` VARCHAR(100) NOT NULL UNIQUE,
          `display_name` VARCHAR(255) NOT NULL,
          `description` TEXT,
          `category` VARCHAR(50) DEFAULT 'general',
          `module` VARCHAR(50),
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX `idx_name` (`name`),
          INDEX `idx_category` (`category`),
          INDEX `idx_module` (`module`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Permissions table created\n\n";

    // Step 5: Insert permissions
    echo "Step 5: Inserting permissions...\n";
    $stmt = $db->prepare("INSERT INTO `permissions` (`name`, `display_name`, `description`, `category`, `module`) VALUES (?, ?, ?, ?, ?)");
    
    $permissions = [
        // Dashboard
        ['dashboard.view', 'View Dashboard', 'View admin dashboard overview', 'dashboard', 'dashboard'],
        ['dashboard.analytics', 'View Dashboard Analytics', 'View analytics on dashboard', 'dashboard', 'dashboard'],

        // Users & Roles
        ['users.view', 'View Users', 'View user list', 'users', 'users'],
        ['users.create', 'Create Users', 'Create and invite new users', 'users', 'users'],
        ['users.edit', 'Edit Users', 'Edit user details', 'users', 'users'],
        ['users.delete', 'Delete Users', 'Delete users', 'users', 'users'],
        ['roles.manage', 'Manage Roles', 'Manage user roles and permissions', 'users', 'users'],

        // Content Management
        ['content.view', 'View Content', 'View content/blogs/news list', 'content', 'content'],
        ['content.create', 'Create Content', 'Create new content/blogs/news', 'content', 'content'],
        ['content.edit', 'Edit Content', 'Edit content/blogs/news', 'content', 'content'],
        ['content.delete', 'Delete Content', 'Delete content/blogs/news', 'content', 'content'],
        ['content.publish', 'Publish Content', 'Publish/unpublish content/blogs/news', 'content', 'content'],

        // Jobs
        ['jobs.view', 'View Jobs', 'View job listings', 'jobs', 'jobs'],
        ['jobs.create', 'Create Jobs', 'Create new job postings', 'jobs', 'jobs'],
        ['jobs.edit', 'Edit Jobs', 'Edit job postings', 'jobs', 'jobs'],
        ['jobs.delete', 'Delete Jobs', 'Delete job postings', 'jobs', 'jobs'],
        ['jobs.publish', 'Publish Jobs', 'Publish/unpublish jobs', 'jobs', 'jobs'],
        ['jobs.applications', 'View Job Applications', 'View and manage job applications', 'jobs', 'jobs'],

        // Scholarships
        ['scholarships.view', 'View Scholarships', 'View scholarship listings', 'scholarships', 'scholarships'],
        ['scholarships.create', 'Create Scholarships', 'Create new scholarships', 'scholarships', 'scholarships'],
        ['scholarships.edit', 'Edit Scholarships', 'Edit scholarships', 'scholarships', 'scholarships'],
        ['scholarships.delete', 'Delete Scholarships', 'Delete scholarships', 'scholarships', 'scholarships'],
        ['scholarships.publish', 'Publish Scholarships', 'Publish/unpublish scholarships', 'scholarships', 'scholarships'],
        ['scholarships.applications', 'View Scholarship Applications', 'View and manage scholarship applications', 'scholarships', 'scholarships'],

        // Organizations
        ['organizations.view', 'View Organizations', 'View organization list', 'organizations', 'organizations'],
        ['organizations.create', 'Create Organizations', 'Create new organizations', 'organizations', 'organizations'],
        ['organizations.edit', 'Edit Organizations', 'Edit organizations', 'organizations', 'organizations'],
        ['organizations.delete', 'Delete Organizations', 'Delete organizations', 'organizations', 'organizations'],

        // Newsletter
        ['newsletter.view', 'View Newsletter', 'View newsletter data and subscribers', 'newsletter', 'newsletter'],
        ['newsletter.create', 'Create Newsletter', 'Create newsletter campaigns', 'newsletter', 'newsletter'],
        ['newsletter.send', 'Send Newsletter', 'Send newsletters to subscribers', 'newsletter', 'newsletter'],
        ['newsletter.manage', 'Manage Subscribers', 'Manage newsletter subscribers', 'newsletter', 'newsletter'],

        // Analytics
        ['analytics.view', 'View Analytics', 'View analytics dashboard and reports', 'analytics', 'analytics'],
        ['analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'analytics'],

        // Team
        ['team.view', 'View Team', 'View team members', 'team', 'team'],
        ['team.create', 'Create Team Members', 'Add new team members', 'team', 'team'],
        ['team.edit', 'Edit Team Members', 'Edit team member details', 'team', 'team'],
        ['team.delete', 'Delete Team Members', 'Remove team members', 'team', 'team'],

        // Services
        ['services.view', 'View Services', 'View services list', 'services', 'content'],
        ['services.create', 'Create Services', 'Create new services', 'services', 'content'],
        ['services.edit', 'Edit Services', 'Edit services', 'services', 'content'],
        ['services.delete', 'Delete Services', 'Delete services', 'services', 'content'],

        // Portfolio
        ['portfolio.view', 'View Portfolio', 'View portfolio projects', 'portfolio', 'content'],
        ['portfolio.create', 'Create Portfolio', 'Add new portfolio projects', 'portfolio', 'content'],
        ['portfolio.edit', 'Edit Portfolio', 'Edit portfolio projects', 'portfolio', 'content'],
        ['portfolio.delete', 'Delete Portfolio', 'Delete portfolio projects', 'portfolio', 'content'],

        // About
        ['about.view', 'View About', 'View about page content', 'about', 'content'],
        ['about.edit', 'Edit About', 'Edit about page content', 'about', 'content'],

        // Announcements
        ['announcements.view', 'View Announcements', 'View announcements', 'announcements', 'announcements'],
        ['announcements.create', 'Create Announcements', 'Create new announcements', 'announcements', 'announcements'],
        ['announcements.edit', 'Edit Announcements', 'Edit announcements', 'announcements', 'announcements'],
        ['announcements.delete', 'Delete Announcements', 'Delete announcements', 'announcements', 'announcements'],

        // Settings
        ['settings.view', 'View Settings', 'View system settings', 'settings', 'settings'],
        ['settings.edit', 'Edit Settings', 'Modify system settings', 'settings', 'settings'],

        // Tools
        ['tools.view', 'View Tools', 'View available tools', 'tools', 'tools'],
        ['tools.use', 'Use Tools', 'Use system tools', 'tools', 'tools']
    ];
    
    foreach ($permissions as $perm) {
        $stmt->execute($perm);
    }
    echo "✓ " . count($permissions) . " permissions inserted\n\n";

    // Step 6: Create role_permissions table
    echo "Step 6: Creating role_permissions table...\n";
    $db->exec("
        CREATE TABLE `role_permissions` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `role_id` INT NOT NULL,
          `permission_id` INT NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
          FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
          FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
          INDEX `idx_role_id` (`role_id`),
          INDEX `idx_permission_id` (`permission_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Role permissions table created\n\n";

    // Step 7: Assign permissions to roles
    echo "Step 7: Assigning permissions to roles...\n";
    
    // Admin: All permissions
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p WHERE r.name = 'admin'
    ");
    echo "✓ Admin role: All permissions\n";

    // Content Editor
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p 
        WHERE r.name = 'content_editor' 
        AND p.name IN (
          'dashboard.view',
          'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
          'team.view', 'team.create', 'team.edit', 'team.delete',
          'about.view', 'about.edit',
          'services.view', 'services.create', 'services.edit', 'services.delete',
          'portfolio.view', 'portfolio.create', 'portfolio.edit', 'portfolio.delete',
          'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'
        )
    ");
    echo "✓ Content Editor role assigned\n";

    // Program Manager
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p 
        WHERE r.name = 'program_manager' 
        AND p.name IN (
          'dashboard.view',
          'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish', 'jobs.applications',
          'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete', 'scholarships.publish', 'scholarships.applications',
          'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete'
        )
    ");
    echo "✓ Program Manager role assigned\n";

    // Marketing Officer
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p 
        WHERE r.name = 'marketing_officer' 
        AND p.name IN (
          'dashboard.view', 'dashboard.analytics',
          'newsletter.view', 'newsletter.create', 'newsletter.send', 'newsletter.manage',
          'analytics.view', 'analytics.export',
          'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'
        )
    ");
    echo "✓ Marketing Officer role assigned\n";

    // Analyst
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p 
        WHERE r.name = 'analyst' 
        AND p.name IN (
          'dashboard.view', 'dashboard.analytics',
          'analytics.view', 'analytics.export'
        )
    ");
    echo "✓ Analyst role assigned\n";

    // Blogger
    $db->exec("
        INSERT INTO `role_permissions` (`role_id`, `permission_id`)
        SELECT r.id, p.id FROM `roles` r, `permissions` p 
        WHERE r.name = 'blogger' 
        AND p.name IN (
          'dashboard.view',
          'content.view', 'content.create', 'content.edit', 'content.publish',
          'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.publish',
          'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.publish',
          'newsletter.view', 'newsletter.create'
        )
    ");
    echo "✓ Blogger role assigned\n\n";

    // Step 8: Create user_roles table
    echo "Step 8: Creating user_roles table...\n";
    $db->exec("
        CREATE TABLE `user_roles` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `role_id` INT NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY `unique_user_role` (`user_id`, `role_id`),
          FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
          FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
          INDEX `idx_user_id` (`user_id`),
          INDEX `idx_role_id` (`role_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ User roles table created\n\n";

    // Step 9: Create user_permissions table
    echo "Step 9: Creating user_permissions table...\n";
    $db->exec("
        CREATE TABLE `user_permissions` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `permission_id` INT NOT NULL,
          `granted` TINYINT(1) DEFAULT 1,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY `unique_user_permission` (`user_id`, `permission_id`),
          FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
          FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
          INDEX `idx_user_id` (`user_id`),
          INDEX `idx_permission_id` (`permission_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ User permissions table created\n\n";

    // Step 10: Update users table
    echo "Step 10: Updating users table...\n";
    
    // Check and add columns
    $columns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('role_id', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN role_id INT DEFAULT NULL AFTER role");
        echo "✓ Added role_id column\n";
    }
    
    if (!in_array('must_change_password', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0 AFTER password_hash");
        echo "✓ Added must_change_password column\n";
    }
    
    if (!in_array('failed_login_attempts', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 AFTER must_change_password");
        echo "✓ Added failed_login_attempts column\n";
    }
    
    if (!in_array('locked_until', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL AFTER failed_login_attempts");
        echo "✓ Added locked_until column\n";
    }
    echo "\n";

    // Step 11: Migrate existing users
    echo "Step 11: Migrating existing users...\n";
    
    // First, convert users table to utf8mb4_unicode_ci to match roles
    try {
        $db->exec("ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✓ Converted users table collation\n";
    } catch (PDOException $e) {
        echo "⚠ Could not convert collation (may already be correct): " . $e->getMessage() . "\n";
    }
    
    $count = $db->exec("
        UPDATE users u 
        INNER JOIN roles r ON r.name COLLATE utf8mb4_unicode_ci = u.role COLLATE utf8mb4_unicode_ci
        SET u.role_id = r.id 
        WHERE u.role_id IS NULL
    ");
    echo "✓ Updated $count users with role_id\n";

    $count = $db->exec("
        INSERT IGNORE INTO user_roles (user_id, role_id)
        SELECT u.id, u.role_id FROM users u 
        WHERE u.role_id IS NOT NULL
    ");
    echo "✓ Created $count user_roles assignments\n\n";

    echo "========================================\n";
    echo "✓ RBAC System Migration Complete!\n";
    echo "========================================\n\n";

    // Show summary
    $rolesCount = $db->query("SELECT COUNT(*) FROM roles")->fetchColumn();
    $permsCount = $db->query("SELECT COUNT(*) FROM permissions")->fetchColumn();
    $rolePermsCount = $db->query("SELECT COUNT(*) FROM role_permissions")->fetchColumn();
    $userRolesCount = $db->query("SELECT COUNT(*) FROM user_roles")->fetchColumn();

    echo "Summary:\n";
    echo "  - Roles: $rolesCount\n";
    echo "  - Permissions: $permsCount\n";
    echo "  - Role-Permission mappings: $rolePermsCount\n";
    echo "  - User-Role assignments: $userRolesCount\n";
    echo "\n";

} catch (PDOException $e) {
    echo "\n✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
