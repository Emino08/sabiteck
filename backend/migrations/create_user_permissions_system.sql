-- User Permissions and Roles System Migration
-- This migration creates a comprehensive permissions system

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create roles table (enhanced from existing user role field)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Create user_permissions table for individual permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_by INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_id)
);

-- Create password_resets table for forgot password functionality
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
);

-- Update users table to add role_id and additional fields if they don't exist
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role_id INT AFTER role,
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL AFTER email,
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE AFTER password_hash,
    ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL AFTER must_change_password,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0 AFTER last_login,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL AFTER failed_login_attempts,
    ADD COLUMN IF NOT EXISTS permissions_json JSON NULL AFTER role_id;

-- Add foreign key for role_id (after roles are created)
-- ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Insert default permissions
INSERT IGNORE INTO permissions (name, slug, description, module) VALUES
-- Dashboard permissions
('View Dashboard', 'view-dashboard', 'Access to main dashboard', 'dashboard'),
('View Analytics', 'view-analytics', 'Access to analytics and reports', 'dashboard'),

-- User Management permissions
('View Users', 'view-users', 'View user list and details', 'users'),
('Create Users', 'create-users', 'Create new user accounts', 'users'),
('Edit Users', 'edit-users', 'Edit existing user accounts', 'users'),
('Delete Users', 'delete-users', 'Delete user accounts', 'users'),
('Manage User Permissions', 'manage-user-permissions', 'Assign permissions to users', 'users'),

-- Content Management permissions
('View Content', 'view-content', 'View content list', 'content'),
('Create Content', 'create-content', 'Create new content', 'content'),
('Edit Content', 'edit-content', 'Edit existing content', 'content'),
('Delete Content', 'delete-content', 'Delete content', 'content'),
('Publish Content', 'publish-content', 'Publish/unpublish content', 'content'),

-- Jobs Management permissions
('View Jobs', 'view-jobs', 'View job listings', 'jobs'),
('Create Jobs', 'create-jobs', 'Create new job listings', 'jobs'),
('Edit Jobs', 'edit-jobs', 'Edit existing job listings', 'jobs'),
('Delete Jobs', 'delete-jobs', 'Delete job listings', 'jobs'),
('Manage Job Applications', 'manage-job-applications', 'View and manage job applications', 'jobs'),

-- Scholarships Management permissions
('View Scholarships', 'view-scholarships', 'View scholarship listings', 'scholarships'),
('Create Scholarships', 'create-scholarships', 'Create new scholarships', 'scholarships'),
('Edit Scholarships', 'edit-scholarships', 'Edit existing scholarships', 'scholarships'),
('Delete Scholarships', 'delete-scholarships', 'Delete scholarships', 'scholarships'),
('Generate Scholarship Reports', 'generate-scholarship-reports', 'Generate scholarship PDF reports', 'scholarships'),

-- Services Management permissions
('View Services', 'view-services', 'View service listings', 'services'),
('Create Services', 'create-services', 'Create new services', 'services'),
('Edit Services', 'edit-services', 'Edit existing services', 'services'),
('Delete Services', 'delete-services', 'Delete services', 'services'),

-- Portfolio Management permissions
('View Portfolio', 'view-portfolio', 'View portfolio items', 'portfolio'),
('Create Portfolio', 'create-portfolio', 'Create new portfolio items', 'portfolio'),
('Edit Portfolio', 'edit-portfolio', 'Edit existing portfolio items', 'portfolio'),
('Delete Portfolio', 'delete-portfolio', 'Delete portfolio items', 'portfolio'),

-- Team Management permissions
('View Team', 'view-team', 'View team members', 'team'),
('Create Team', 'create-team', 'Add new team members', 'team'),
('Edit Team', 'edit-team', 'Edit existing team members', 'team'),
('Delete Team', 'delete-team', 'Remove team members', 'team'),

-- Announcements Management permissions
('View Announcements', 'view-announcements', 'View announcements', 'announcements'),
('Create Announcements', 'create-announcements', 'Create new announcements', 'announcements'),
('Edit Announcements', 'edit-announcements', 'Edit existing announcements', 'announcements'),
('Delete Announcements', 'delete-announcements', 'Delete announcements', 'announcements'),

-- Newsletter Management permissions
('View Newsletter', 'view-newsletter', 'View newsletter subscribers', 'newsletter'),
('Manage Newsletter', 'manage-newsletter', 'Manage newsletter campaigns', 'newsletter'),
('Send Newsletter', 'send-newsletter', 'Send newsletter campaigns', 'newsletter'),

-- Settings permissions
('View Settings', 'view-settings', 'View application settings', 'settings'),
('Edit Settings', 'edit-settings', 'Edit application settings', 'settings'),

-- System permissions
('View System Logs', 'view-system-logs', 'Access system logs and debugging', 'system'),
('Manage System', 'manage-system', 'Full system administration', 'system');

-- Insert default roles
INSERT IGNORE INTO roles (name, slug, description, is_admin, is_active) VALUES
('Super Admin', 'super-admin', 'Full system access with all permissions', TRUE, TRUE),
('Admin', 'admin', 'Administrative access with most permissions', TRUE, TRUE),
('Content Manager', 'content-manager', 'Manages content, jobs, and scholarships', FALSE, TRUE),
('HR Manager', 'hr-manager', 'Manages jobs, team, and user accounts', FALSE, TRUE),
('Editor', 'editor', 'Creates and edits content', FALSE, TRUE),
('User', 'user', 'Basic user access', FALSE, TRUE),
('Viewer', 'viewer', 'Read-only access to certain areas', FALSE, TRUE);

-- Assign permissions to Super Admin role (all permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'super-admin';

-- Assign permissions to Admin role (most permissions except system management)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
AND p.slug NOT IN ('manage-system', 'view-system-logs');

-- Assign permissions to Content Manager role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'content-manager'
AND p.slug IN (
    'view-dashboard', 'view-content', 'create-content', 'edit-content', 'delete-content', 'publish-content',
    'view-jobs', 'create-jobs', 'edit-jobs', 'delete-jobs',
    'view-scholarships', 'create-scholarships', 'edit-scholarships', 'delete-scholarships', 'generate-scholarship-reports',
    'view-announcements', 'create-announcements', 'edit-announcements', 'delete-announcements'
);

-- Assign permissions to HR Manager role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'hr-manager'
AND p.slug IN (
    'view-dashboard', 'view-users', 'create-users', 'edit-users',
    'view-jobs', 'create-jobs', 'edit-jobs', 'delete-jobs', 'manage-job-applications',
    'view-team', 'create-team', 'edit-team', 'delete-team'
);

-- Assign permissions to Editor role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'editor'
AND p.slug IN (
    'view-dashboard', 'view-content', 'create-content', 'edit-content',
    'view-portfolio', 'create-portfolio', 'edit-portfolio'
);

-- Assign permissions to User role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'user'
AND p.slug IN ('view-dashboard');

-- Assign permissions to Viewer role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'viewer'
AND p.slug IN (
    'view-dashboard', 'view-content', 'view-jobs', 'view-scholarships', 'view-portfolio', 'view-team', 'view-announcements'
);

-- Update existing users to have role_id based on their current role field
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'super-admin') WHERE role = 'super_admin';
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'admin') WHERE role = 'admin';
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'user') WHERE role = 'user';
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'user') WHERE role_id IS NULL;