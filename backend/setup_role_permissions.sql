-- ================================================
-- RBAC ROLE PERMISSIONS SETUP
-- Configures permissions for all roles as specified
-- ================================================

-- First, ensure all required permissions exist
INSERT IGNORE INTO permissions (name, display_name, category, description, module) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'dashboard', 'Access to admin dashboard', 'dashboard'),

-- Content Management
('content.view', 'View Content', 'content', 'View website content', 'content'),
('content.create', 'Create Content', 'content', 'Create new content', 'content'),
('content.edit', 'Edit Content', 'content', 'Edit existing content', 'content'),
('content.delete', 'Delete Content', 'content', 'Delete content', 'content'),
('content.publish', 'Publish Content', 'content', 'Publish content', 'content'),

-- Blogs
('blogs.view', 'View Blogs', 'content', 'View blogs', 'content'),
('blogs.create', 'Create Blogs', 'content', 'Create new blogs', 'content'),
('blogs.edit', 'Edit Blogs', 'content', 'Edit existing blogs', 'content'),
('blogs.delete', 'Delete Blogs', 'content', 'Delete blogs', 'content'),
('blogs.publish', 'Publish Blogs', 'content', 'Publish blogs', 'content'),

-- News
('news.view', 'View News', 'content', 'View news', 'content'),
('news.create', 'Create News', 'content', 'Create new news', 'content'),
('news.edit', 'Edit News', 'content', 'Edit existing news', 'content'),
('news.delete', 'Delete News', 'content', 'Delete news', 'content'),
('news.publish', 'Publish News', 'content', 'Publish news', 'content'),

-- Jobs
('jobs.view', 'View Jobs', 'jobs', 'View job postings', 'jobs'),
('jobs.create', 'Create Jobs', 'jobs', 'Create new job postings', 'jobs'),
('jobs.edit', 'Edit Jobs', 'jobs', 'Edit existing job postings', 'jobs'),
('jobs.delete', 'Delete Jobs', 'jobs', 'Delete job postings', 'jobs'),
('jobs.publish', 'Publish Jobs', 'jobs', 'Publish job postings', 'jobs'),

-- Scholarships
('scholarships.view', 'View Scholarships', 'scholarships', 'View scholarships', 'scholarships'),
('scholarships.create', 'Create Scholarships', 'scholarships', 'Create new scholarships', 'scholarships'),
('scholarships.edit', 'Edit Scholarships', 'scholarships', 'Edit existing scholarships', 'scholarships'),
('scholarships.delete', 'Delete Scholarships', 'scholarships', 'Delete scholarships', 'scholarships'),
('scholarships.publish', 'Publish Scholarships', 'scholarships', 'Publish scholarships', 'scholarships'),

-- Organizations
('organizations.view', 'View Organizations', 'organizations', 'View organizations', 'organizations'),
('organizations.create', 'Create Organizations', 'organizations', 'Create new organizations', 'organizations'),
('organizations.edit', 'Edit Organizations', 'organizations', 'Edit existing organizations', 'organizations'),
('organizations.delete', 'Delete Organizations', 'organizations', 'Delete organizations', 'organizations'),
('organizations.publish', 'Publish Organizations', 'organizations', 'Publish organizations', 'organizations'),

-- Analytics
('analytics.view', 'View Analytics', 'analytics', 'View analytics and insights', 'analytics'),

-- Newsletter
('newsletter.view', 'View Newsletter', 'newsletter', 'View newsletter', 'newsletter'),
('newsletter.create', 'Create Newsletter', 'newsletter', 'Create newsletter', 'newsletter'),
('newsletter.send', 'Send Newsletter', 'newsletter', 'Send newsletter', 'newsletter'),

-- Marketing
('marketing.view', 'View Marketing', 'marketing', 'View marketing tools', 'marketing'),
('marketing.manage', 'Manage Marketing', 'marketing', 'Manage marketing campaigns', 'marketing'),

-- Team
('team.view', 'View Team', 'team', 'View team members', 'team'),

-- Announcements
('announcements.view', 'View Announcements', 'announcements', 'View announcements', 'announcements'),

-- Users
('users.view', 'View Users', 'users', 'View user list', 'users'),
('users.manage_permissions', 'Manage User Permissions', 'users', 'Manage user roles and permissions', 'users'),

-- System
('system.settings', 'System Settings', 'system', 'Access system settings', 'system');

-- ================================================
-- ROLE PERMISSIONS ASSIGNMENT
-- ================================================

-- Get role IDs
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @content_editor_role_id = (SELECT id FROM roles WHERE name = 'content_editor' OR name = 'Content Editor' LIMIT 1);
SET @program_manager_role_id = (SELECT id FROM roles WHERE name = 'program_manager' OR name = 'Program Manager' LIMIT 1);
SET @marketing_officer_role_id = (SELECT id FROM roles WHERE name = 'marketing_officer' OR name = 'Marketing Officer' LIMIT 1);
SET @analyst_role_id = (SELECT id FROM roles WHERE name = 'analyst' OR name = 'Analyst' LIMIT 1);
SET @blogger_role_id = (SELECT id FROM roles WHERE name = 'blogger' OR name = 'Blogger' LIMIT 1);

-- Create roles if they don't exist
INSERT IGNORE INTO roles (name, display_name, description) VALUES
('admin', 'Admin', 'Full access to all modules'),
('content_editor', 'Content Editor', 'Focuses on creating, updating, and publishing website content, blogs, and news'),
('program_manager', 'Program Manager', 'Manages all program-related items (jobs, scholarships, organizations, etc.)'),
('marketing_officer', 'Marketing Officer', 'Handles promotion, newsletter, and analytics insights for outreach'),
('analyst', 'Analyst', 'Can only view analytics, insights, and reports'),
('blogger', 'Blogger', 'Focuses on creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter');

-- Re-get role IDs after insert
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @content_editor_role_id = (SELECT id FROM roles WHERE name = 'content_editor' LIMIT 1);
SET @program_manager_role_id = (SELECT id FROM roles WHERE name = 'program_manager' LIMIT 1);
SET @marketing_officer_role_id = (SELECT id FROM roles WHERE name = 'marketing_officer' LIMIT 1);
SET @analyst_role_id = (SELECT id FROM roles WHERE name = 'analyst' LIMIT 1);
SET @blogger_role_id = (SELECT id FROM roles WHERE name = 'blogger' LIMIT 1);

-- Clear existing role permissions
DELETE FROM role_permissions WHERE role_id IN (@admin_role_id, @content_editor_role_id, @program_manager_role_id, @marketing_officer_role_id, @analyst_role_id, @blogger_role_id);

-- ================================================
-- ADMIN - Full access to all modules
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, id FROM permissions;

-- ================================================
-- CONTENT EDITOR - Content, blogs, and news
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @content_editor_role_id, id FROM permissions WHERE name IN (
    'dashboard.view',
    'content.view', 'content.create', 'content.edit', 'content.publish',
    'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.publish',
    'news.view', 'news.create', 'news.edit', 'news.publish'
);

-- ================================================
-- PROGRAM MANAGER - Jobs, scholarships, organizations
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @program_manager_role_id, id FROM permissions WHERE name IN (
    'dashboard.view',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish',
    'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete', 'scholarships.publish',
    'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete', 'organizations.publish'
);

-- ================================================
-- MARKETING OFFICER - Newsletter, analytics, marketing
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @marketing_officer_role_id, id FROM permissions WHERE name IN (
    'dashboard.view',
    'newsletter.view', 'newsletter.create', 'newsletter.send',
    'analytics.view',
    'marketing.view', 'marketing.manage'
);

-- ================================================
-- ANALYST - Analytics only (read-only)
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @analyst_role_id, id FROM permissions WHERE name IN (
    'dashboard.view',
    'analytics.view'
);

-- ================================================
-- BLOGGER - Content, blogs, news, jobs, scholarships, newsletter
-- ================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @blogger_role_id, id FROM permissions WHERE name IN (
    'dashboard.view',
    'content.view', 'content.create', 'content.edit', 'content.publish',
    'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.publish',
    'news.view', 'news.create', 'news.edit', 'news.publish',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.publish',
    'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.publish',
    'newsletter.view', 'newsletter.create'
);

-- ================================================
-- VERIFICATION
-- ================================================
SELECT 
    r.name as role_name,
    r.display_name,
    COUNT(rp.permission_id) as permission_count,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('admin', 'content_editor', 'program_manager', 'marketing_officer', 'analyst', 'blogger')
GROUP BY r.id, r.name, r.display_name
ORDER BY r.name;

-- Show what blogger can see
SELECT 
    'Blogger Permissions:' as info,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR '\n') as permissions
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = @blogger_role_id;
