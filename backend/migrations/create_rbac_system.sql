-- ============================================
-- RBAC System Database Migration
-- Complete Role-Based Access Control System
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `user_permissions`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_system` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert predefined roles
INSERT INTO `roles` (`name`, `display_name`, `description`, `is_system`) VALUES
('admin', 'Admin', 'Full access to all modules — can add, edit, delete, publish, and manage users/roles.', 1),
('content_editor', 'Content Editor', 'Focuses on creating, updating, and publishing website content, blogs, and news.', 1),
('program_manager', 'Program Manager', 'Manages all program-related items (jobs, scholarships, organizations, etc.).', 1),
('marketing_officer', 'Marketing Officer', 'Handles promotion, newsletter, and analytics insights for outreach.', 1),
('analyst', 'Analyst', 'Can only view analytics, insights, and reports.', 1),
('blogger', 'Blogger', 'Focuses on creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter.', 1);

-- ============================================
-- PERMISSIONS TABLE
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert all permissions
INSERT INTO `permissions` (`name`, `display_name`, `description`, `category`, `module`) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'View admin dashboard overview', 'dashboard', 'dashboard'),
('dashboard.analytics', 'View Dashboard Analytics', 'View analytics on dashboard', 'dashboard', 'dashboard'),

-- Users & Roles
('users.view', 'View Users', 'View user list', 'users', 'users'),
('users.create', 'Create Users', 'Create and invite new users', 'users', 'users'),
('users.edit', 'Edit Users', 'Edit user details', 'users', 'users'),
('users.delete', 'Delete Users', 'Delete users', 'users', 'users'),
('roles.manage', 'Manage Roles', 'Manage user roles and permissions', 'users', 'users'),

-- Content Management
('content.view', 'View Content', 'View content/blogs/news list', 'content', 'content'),
('content.create', 'Create Content', 'Create new content/blogs/news', 'content', 'content'),
('content.edit', 'Edit Content', 'Edit content/blogs/news', 'content', 'content'),
('content.delete', 'Delete Content', 'Delete content/blogs/news', 'content', 'content'),
('content.publish', 'Publish Content', 'Publish/unpublish content/blogs/news', 'content', 'content'),

-- Jobs
('jobs.view', 'View Jobs', 'View job listings', 'jobs', 'jobs'),
('jobs.create', 'Create Jobs', 'Create new job postings', 'jobs', 'jobs'),
('jobs.edit', 'Edit Jobs', 'Edit job postings', 'jobs', 'jobs'),
('jobs.delete', 'Delete Jobs', 'Delete job postings', 'jobs', 'jobs'),
('jobs.publish', 'Publish Jobs', 'Publish/unpublish jobs', 'jobs', 'jobs'),
('jobs.applications', 'View Job Applications', 'View and manage job applications', 'jobs', 'jobs'),

-- Scholarships
('scholarships.view', 'View Scholarships', 'View scholarship listings', 'scholarships', 'scholarships'),
('scholarships.create', 'Create Scholarships', 'Create new scholarships', 'scholarships', 'scholarships'),
('scholarships.edit', 'Edit Scholarships', 'Edit scholarships', 'scholarships', 'scholarships'),
('scholarships.delete', 'Delete Scholarships', 'Delete scholarships', 'scholarships', 'scholarships'),
('scholarships.publish', 'Publish Scholarships', 'Publish/unpublish scholarships', 'scholarships', 'scholarships'),
('scholarships.applications', 'View Scholarship Applications', 'View and manage scholarship applications', 'scholarships', 'scholarships'),

-- Organizations
('organizations.view', 'View Organizations', 'View organization list', 'organizations', 'organizations'),
('organizations.create', 'Create Organizations', 'Create new organizations', 'organizations', 'organizations'),
('organizations.edit', 'Edit Organizations', 'Edit organizations', 'organizations', 'organizations'),
('organizations.delete', 'Delete Organizations', 'Delete organizations', 'organizations', 'organizations'),

-- Newsletter
('newsletter.view', 'View Newsletter', 'View newsletter data and subscribers', 'newsletter', 'newsletter'),
('newsletter.create', 'Create Newsletter', 'Create newsletter campaigns', 'newsletter', 'newsletter'),
('newsletter.send', 'Send Newsletter', 'Send newsletters to subscribers', 'newsletter', 'newsletter'),
('newsletter.manage', 'Manage Subscribers', 'Manage newsletter subscribers', 'newsletter', 'newsletter'),

-- Analytics
('analytics.view', 'View Analytics', 'View analytics dashboard and reports', 'analytics', 'analytics'),
('analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'analytics'),

-- Team
('team.view', 'View Team', 'View team members', 'team', 'team'),
('team.create', 'Create Team Members', 'Add new team members', 'team', 'team'),
('team.edit', 'Edit Team Members', 'Edit team member details', 'team', 'team'),
('team.delete', 'Delete Team Members', 'Remove team members', 'team', 'team'),

-- Services
('services.view', 'View Services', 'View services list', 'services', 'content'),
('services.create', 'Create Services', 'Create new services', 'services', 'content'),
('services.edit', 'Edit Services', 'Edit services', 'services', 'content'),
('services.delete', 'Delete Services', 'Delete services', 'services', 'content'),

-- Portfolio
('portfolio.view', 'View Portfolio', 'View portfolio projects', 'portfolio', 'content'),
('portfolio.create', 'Create Portfolio', 'Add new portfolio projects', 'portfolio', 'content'),
('portfolio.edit', 'Edit Portfolio', 'Edit portfolio projects', 'portfolio', 'content'),
('portfolio.delete', 'Delete Portfolio', 'Delete portfolio projects', 'portfolio', 'content'),

-- About
('about.view', 'View About', 'View about page content', 'about', 'content'),
('about.edit', 'Edit About', 'Edit about page content', 'about', 'content'),

-- Announcements
('announcements.view', 'View Announcements', 'View announcements', 'announcements', 'announcements'),
('announcements.create', 'Create Announcements', 'Create new announcements', 'announcements', 'announcements'),
('announcements.edit', 'Edit Announcements', 'Edit announcements', 'announcements', 'announcements'),
('announcements.delete', 'Delete Announcements', 'Delete announcements', 'announcements', 'announcements'),

-- Settings
('settings.view', 'View Settings', 'View system settings', 'settings', 'settings'),
('settings.edit', 'Edit Settings', 'Modify system settings', 'settings', 'settings'),

-- Tools
('tools.view', 'View Tools', 'View available tools', 'tools', 'tools'),
('tools.use', 'Use Tools', 'Use system tools', 'tools', 'tools');

-- ============================================
-- ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Admin: Full access to everything
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p WHERE r.name = 'admin';

-- Content Editor: Content, blogs, news, team, about
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
);

-- Program Manager: Jobs, scholarships, organizations
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p 
WHERE r.name = 'program_manager' 
AND p.name IN (
  'dashboard.view',
  'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish', 'jobs.applications',
  'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete', 'scholarships.publish', 'scholarships.applications',
  'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete'
);

-- Marketing Officer: Newsletter, analytics, announcements
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p 
WHERE r.name = 'marketing_officer' 
AND p.name IN (
  'dashboard.view', 'dashboard.analytics',
  'newsletter.view', 'newsletter.create', 'newsletter.send', 'newsletter.manage',
  'analytics.view', 'analytics.export',
  'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'
);

-- Analyst: Analytics and reports only
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p 
WHERE r.name = 'analyst' 
AND p.name IN (
  'dashboard.view', 'dashboard.analytics',
  'analytics.view', 'analytics.export'
);

-- Blogger: Content, blogs, news, jobs, scholarships, newsletter
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p 
WHERE r.name = 'blogger' 
AND p.name IN (
  'dashboard.view',
  'content.view', 'content.create', 'content.edit', 'content.publish',
  'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.publish',
  'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.publish',
  'newsletter.view', 'newsletter.create'
);

-- ============================================
-- USER_ROLES TABLE (Many-to-Many for multiple roles per user)
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER_PERMISSIONS TABLE (Direct user permissions - override role permissions)
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UPDATE USERS TABLE
-- ============================================

-- Add columns if they don't exist (manual check)
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "role_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT DEFAULT NULL AFTER role")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "must_change_password";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TINYINT(1) DEFAULT 0 AFTER password_hash")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "failed_login_attempts";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT DEFAULT 0 AFTER must_change_password")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "locked_until";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TIMESTAMP NULL AFTER failed_login_attempts")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for role_id if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "users";
SET @indexname = "idx_role_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD INDEX ", @indexname, " (role_id)")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Migrate existing users to have role_id based on their role field
UPDATE `users` u 
INNER JOIN `roles` r ON r.name = u.role 
SET u.role_id = r.id 
WHERE u.role_id IS NULL;

-- For users without a matching role, set them to 'admin' role
UPDATE `users` u 
SET u.role_id = (SELECT id FROM `roles` WHERE name = 'admin' LIMIT 1)
WHERE u.role_id IS NULL AND u.role = 'admin';

-- Create user_roles entries for existing users
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, u.role_id FROM `users` u 
WHERE u.role_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM `user_roles` ur WHERE ur.user_id = u.id AND ur.role_id = u.role_id
);
