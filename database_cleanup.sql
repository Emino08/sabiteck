-- Database Optimization Script
-- This script safely removes unused tables after checking for data
-- Run this in stages, testing between each stage

-- ===========================================
-- STAGE 1: SAFE TO REMOVE (High Confidence Duplicates)
-- ===========================================

-- Check if these tables exist and have data before dropping
SET @sql = NULL;

-- Drop duplicate analytics table if it exists and analytics_page_views exists
DROP TABLE IF EXISTS `analytics_pageviews`;

-- Drop blog tables if they're duplicates of content tables
-- (Only if content table handles blog functionality)
SELECT COUNT(*) AS blog_posts_count FROM `blog_posts` WHERE 1;
SELECT COUNT(*) AS content_blog_count FROM `content` WHERE content_type = 'blog';
-- If content handles blogs and blog_posts is empty or redundant:
-- DROP TABLE IF EXISTS `blog_posts`;
-- DROP TABLE IF EXISTS `blog_categories`;

-- Drop portfolio_projects if portfolio table handles projects
SELECT COUNT(*) AS portfolio_projects_count FROM `portfolio_projects` WHERE 1;
SELECT COUNT(*) AS portfolio_count FROM `portfolio` WHERE 1;
-- If portfolio handles projects:
-- DROP TABLE IF EXISTS `portfolio_projects`;

-- Drop team_members if team table handles members
SELECT COUNT(*) AS team_members_count FROM `team_members` WHERE 1;
SELECT COUNT(*) AS team_count FROM `team` WHERE 1;
-- If team handles members:
-- DROP TABLE IF EXISTS `team_members`;

-- ===========================================
-- STAGE 2: ANALYTICS TABLES (If not using analytics)
-- ===========================================

-- Check if analytics tables have recent data
SELECT 'analytics_events' as table_name, COUNT(*) as record_count, MAX(created_at) as latest_record FROM `analytics_events`;
SELECT 'analytics_visits' as table_name, COUNT(*) as record_count, MAX(created_at) as latest_record FROM `analytics_visits`;
SELECT 'analytics_sessions' as table_name, COUNT(*) as record_count, MAX(created_at) as latest_record FROM `analytics_sessions`;

-- If analytics is not being used (no recent data), uncomment these:
-- DROP TABLE IF EXISTS `analytics_events`;
-- DROP TABLE IF EXISTS `analytics_page_views`;
-- DROP TABLE IF EXISTS `analytics_realtime`;
-- DROP TABLE IF EXISTS `analytics_sessions`;
-- DROP TABLE IF EXISTS `analytics_settings`;
-- DROP TABLE IF EXISTS `analytics_visitors`;
-- DROP TABLE IF EXISTS `analytics_visits`;

-- ===========================================
-- STAGE 3: NEWSLETTER TABLES (If not using newsletter)
-- ===========================================

-- Check if newsletter functionality is active
SELECT 'newsletter_subscribers' as table_name, COUNT(*) as record_count, MAX(subscribed_at) as latest_record FROM `newsletter_subscribers`;
SELECT 'newsletter_campaigns' as table_name, COUNT(*) as record_count, MAX(created_at) as latest_record FROM `newsletter_campaigns`;

-- If newsletter is not being used, uncomment these:
-- DROP TABLE IF EXISTS `newsletter_campaigns`;
-- DROP TABLE IF EXISTS `newsletter_subscribers`;
-- DROP TABLE IF EXISTS `newsletter_subscriptions`;
-- DROP TABLE IF EXISTS `newsletter_templates`;

-- ===========================================
-- STAGE 4: ANNOUNCEMENT TABLES (If not using announcements)
-- ===========================================

-- Check if announcements are active
SELECT 'announcements' as table_name, COUNT(*) as record_count, COUNT(*) as active_count FROM `announcements` WHERE active = 1;

-- If not using announcements, uncomment these:
-- DROP TABLE IF EXISTS `announcements`;
-- DROP TABLE IF EXISTS `announcement_types`;

-- ===========================================
-- STAGE 5: SOCIAL MEDIA TABLES (If not using social integration)
-- ===========================================

-- Check social posts usage
SELECT 'social_posts' as table_name, COUNT(*) as record_count, MAX(created_at) as latest_record FROM `social_posts`;

-- If not using social media integration:
-- DROP TABLE IF EXISTS `social_posts`;

-- ===========================================
-- STAGE 6: COMPANY INFO CONSOLIDATION
-- ===========================================

-- Check if there are duplicate company info tables
SELECT 'company_info' as table_name, COUNT(*) as record_count FROM `company_info`;
SELECT 'company_content' as table_name, COUNT(*) as record_count FROM `company_content`;

-- If company_info contains all needed data:
-- DROP TABLE IF EXISTS `company_content`;

-- ===========================================
-- STAGE 7: CONFIGURATION CLEANUP
-- ===========================================

-- Check configuration tables usage
SELECT 'api_configurations' as table_name, COUNT(*) as record_count FROM `api_configurations`;
SELECT 'app_configurations' as table_name, COUNT(*) as record_count FROM `app_configurations`;
SELECT 'route_settings' as table_name, COUNT(*) as record_count FROM `route_settings`;

-- If these configs are handled elsewhere or unused:
-- DROP TABLE IF EXISTS `api_configurations`;
-- DROP TABLE IF EXISTS `app_configurations`;
-- DROP TABLE IF EXISTS `route_settings`;
-- DROP TABLE IF EXISTS `static_messages`;
-- DROP TABLE IF EXISTS `default_field_values`;

-- ===========================================
-- STAGE 8: UNUSED CATEGORIZATION TABLES
-- ===========================================

-- Check if categorization tables are used
SELECT 'portfolio_categories' as table_name, COUNT(*) as record_count FROM `portfolio_categories`;
SELECT 'service_categories' as table_name, COUNT(*) as record_count FROM `service_categories`;
SELECT 'organization_categories' as table_name, COUNT(*) as record_count FROM `organization_categories`;

-- If categories are handled in main tables:
-- DROP TABLE IF EXISTS `portfolio_categories`;
-- DROP TABLE IF EXISTS `service_categories`;
-- DROP TABLE IF EXISTS `organization_categories`;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Run these to verify critical tables are intact
SELECT 'users' as table_name, COUNT(*) as record_count FROM `users`;
SELECT 'content' as table_name, COUNT(*) as record_count FROM `content`;
SELECT 'jobs' as table_name, COUNT(*) as record_count FROM `jobs`;
SELECT 'scholarships' as table_name, COUNT(*) as record_count FROM `scholarships`;
SELECT 'services' as table_name, COUNT(*) as record_count FROM `services`;
SELECT 'portfolio' as table_name, COUNT(*) as record_count FROM `portfolio`;
SELECT 'settings' as table_name, COUNT(*) as record_count FROM `settings`;

-- Show remaining tables after cleanup
SHOW TABLES;