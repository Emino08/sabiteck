-- Fix RBAC System with Updated Roles
-- This migration fixes the permission system and updates to match the new roles

-- Clear existing data first
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM user_permissions;
DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM roles;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert new roles based on requirements
INSERT INTO roles (name, display_name, description, is_system) VALUES
('admin', 'Administrator', 'Full access to all modules — can add, edit, delete, publish, and manage users/roles.', 1),
('content_editor', 'Content Editor', 'Focuses on creating, updating, and publishing website content, blogs, and news.', 0),
('program_manager', 'Program Manager', 'Manages all program-related items (jobs, scholarships, organizations, etc.).', 0),
('marketing_officer', 'Marketing Officer', 'Handles promotion, newsletter, and analytics insights for outreach.', 0),
('analyst', 'Analyst', 'Can only view analytics, insights, and reports.', 0),
('blogger', 'Blogger', 'Focuses on creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter', 0);

-- Insert comprehensive permissions
INSERT INTO permissions (name, display_name, description, module, category) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'Access main dashboard', 'dashboard', 'dashboard'),
('analytics.view', 'View Analytics', 'View analytics and insights', 'analytics', 'analytics'),
('analytics.export', 'Export Analytics', 'Export analytics reports', 'analytics', 'analytics'),

-- User Management
('users.view', 'View Users', 'View user list', 'users', 'users'),
('users.create', 'Create Users', 'Create new users', 'users', 'users'),
('users.edit', 'Edit Users', 'Edit user details', 'users', 'users'),
('users.delete', 'Delete Users', 'Delete users', 'users', 'users'),
('roles.manage', 'Manage Roles', 'Manage user roles and permissions', 'users', 'users'),

-- Content Management (Blog, News, Website Content)
('content.view', 'View Content', 'View blog and news content', 'content', 'content'),
('content.create', 'Create Content', 'Create blog and news posts', 'content', 'content'),
('content.edit', 'Edit Content', 'Edit blog and news posts', 'content', 'content'),
('content.delete', 'Delete Content', 'Delete blog and news posts', 'content', 'content'),
('content.publish', 'Publish Content', 'Publish/unpublish content', 'content', 'content'),

-- Jobs Management
('jobs.view', 'View Jobs', 'View job listings', 'jobs', 'programs'),
('jobs.create', 'Create Jobs', 'Create job listings', 'jobs', 'programs'),
('jobs.edit', 'Edit Jobs', 'Edit job listings', 'jobs', 'programs'),
('jobs.delete', 'Delete Jobs', 'Delete job listings', 'jobs', 'programs'),
('jobs.publish', 'Publish Jobs', 'Publish/unpublish jobs', 'jobs', 'programs'),

-- Scholarships Management
('scholarships.view', 'View Scholarships', 'View scholarships', 'scholarships', 'programs'),
('scholarships.create', 'Create Scholarships', 'Create scholarships', 'scholarships', 'programs'),
('scholarships.edit', 'Edit Scholarships', 'Edit scholarships', 'scholarships', 'programs'),
('scholarships.delete', 'Delete Scholarships', 'Delete scholarships', 'scholarships', 'programs'),
('scholarships.publish', 'Publish Scholarships', 'Publish/unpublish scholarships', 'scholarships', 'programs'),

-- Organizations Management
('organizations.view', 'View Organizations', 'View organizations', 'organizations', 'programs'),
('organizations.create', 'Create Organizations', 'Create organizations', 'organizations', 'programs'),
('organizations.edit', 'Edit Organizations', 'Edit organizations', 'organizations', 'programs'),
('organizations.delete', 'Delete Organizations', 'Delete organizations', 'organizations', 'programs'),

-- Newsletter Management
('newsletter.view', 'View Newsletter', 'View newsletter subscribers', 'newsletter', 'marketing'),
('newsletter.create', 'Create Newsletter', 'Create newsletter campaigns', 'newsletter', 'marketing'),
('newsletter.send', 'Send Newsletter', 'Send newsletter campaigns', 'newsletter', 'marketing'),

-- Services Management (Content Editor only)
('services.view', 'View Services', 'View services', 'services', 'content'),
('services.create', 'Create Services', 'Create services', 'services', 'content'),
('services.edit', 'Edit Services', 'Edit services', 'services', 'content'),
('services.delete', 'Delete Services', 'Delete services', 'services', 'content'),

-- Portfolio Management (Content Editor only)
('portfolio.view', 'View Portfolio', 'View portfolio', 'portfolio', 'content'),
('portfolio.create', 'Create Portfolio', 'Create portfolio items', 'portfolio', 'content'),
('portfolio.edit', 'Edit Portfolio', 'Edit portfolio items', 'portfolio', 'content'),
('portfolio.delete', 'Delete Portfolio', 'Delete portfolio items', 'portfolio', 'content'),

-- About Management (Content Editor only)
('about.view', 'View About', 'View about page', 'about', 'content'),
('about.edit', 'Edit About', 'Edit about page', 'about', 'content'),

-- Team Management (Content Editor only)
('team.view', 'View Team', 'View team members', 'team', 'content'),
('team.create', 'Create Team', 'Add team members', 'team', 'content'),
('team.edit', 'Edit Team', 'Edit team members', 'team', 'content'),
('team.delete', 'Delete Team', 'Delete team members', 'team', 'content'),

-- Announcements Management (Content Editor only)
('announcements.view', 'View Announcements', 'View announcements', 'announcements', 'content'),
('announcements.create', 'Create Announcements', 'Create announcements', 'announcements', 'content'),
('announcements.edit', 'Edit Announcements', 'Edit announcements', 'announcements', 'content'),
('announcements.delete', 'Delete Announcements', 'Delete announcements', 'announcements', 'content'),

-- Settings & System
('settings.view', 'View Settings', 'View settings', 'settings', 'system'),
('settings.edit', 'Edit Settings', 'Edit settings', 'settings', 'system'),
('system.settings', 'System Settings', 'Manage system settings', 'system', 'system'),
('routes.manage', 'Manage Routes', 'Manage navigation routes', 'routes', 'system'),
('tools.use', 'Use Tools', 'Access admin tools', 'tools', 'system');

-- Admin Role: Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Content Editor Role: content, blogs, news, services, portfolio, about, team, announcements
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'content_editor'
AND p.name IN (
    'dashboard.view',
    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
    'services.view', 'services.create', 'services.edit', 'services.delete',
    'portfolio.view', 'portfolio.create', 'portfolio.edit', 'portfolio.delete',
    'about.view', 'about.edit',
    'team.view', 'team.create', 'team.edit', 'team.delete',
    'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'
);

-- Program Manager Role: jobs, scholarships, organizations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'program_manager'
AND p.name IN (
    'dashboard.view',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish',
    'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete', 'scholarships.publish',
    'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete'
);

-- Marketing Officer Role: newsletter, analytics (view only for insights)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'marketing_officer'
AND p.name IN (
    'dashboard.view',
    'analytics.view', 'analytics.export',
    'newsletter.view', 'newsletter.create', 'newsletter.send'
);

-- Analyst Role: analytics only (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'analyst'
AND p.name IN (
    'dashboard.view',
    'analytics.view', 'analytics.export'
);

-- Blogger Role: content (blogs, news), jobs, scholarships, newsletter
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'blogger'
AND p.name IN (
    'dashboard.view',
    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish',
    'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete', 'scholarships.publish',
    'newsletter.view', 'newsletter.create', 'newsletter.send'
);

-- Update existing admin users to have admin role
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin'), role = 'admin' WHERE role IN ('admin', 'super-admin', 'administrator');
