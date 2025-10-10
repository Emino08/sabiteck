-- Create team_members table with comprehensive fields for team management
-- This migration ensures all necessary fields exist for both admin and public team pages
-- Phone and location fields are included for contact information
-- Skills must be stored as JSON array: ["Leadership", "Mentorship", "Strategy"]

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS `team_members`;

-- Create team_members table
CREATE TABLE `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL COMMENT 'Contact phone number',
  `location` varchar(255) DEFAULT NULL COMMENT 'Geographic location or office',
  `avatar` varchar(500) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `github_url` varchar(500) DEFAULT NULL,
  `website_url` varchar(500) DEFAULT NULL,
  `social_links` json DEFAULT NULL COMMENT 'JSON object with social media links',
  `skills` json DEFAULT NULL COMMENT 'JSON array of skills like ["Leadership", "Strategy"]',
  `years_experience` int(11) DEFAULT 0,
  `experience_years` int(11) DEFAULT 0,
  `education` text DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `featured` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `order_position` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_active` (`active`),
  KEY `idx_featured` (`featured`),
  KEY `idx_department` (`department`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_order_position` (`order_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample team members for testing
-- Note: Skills are stored as JSON arrays in the correct format
INSERT INTO `team_members` (`name`, `slug`, `position`, `department`, `bio`, `email`, `phone`, `location`, `photo_url`, `linkedin_url`, `twitter_url`, `website_url`, `social_links`, `skills`, `years_experience`, `active`, `featured`, `sort_order`) VALUES
('Alpha Ousman Barrie', 'alpha-ousman-barrie', 'CEO & Founder', 'Executive', 'Visionary leader driving innovation in education technology with 15+ years of experience in transforming how students access global opportunities.', 'alpha@sabiteck.com', '+232 78 618435', 'Sierra Leone', NULL, 'https://linkedin.com/in/alpha-barrie', NULL, 'https://sabiteck.com', JSON_OBJECT('linkedin', 'https://linkedin.com/in/alpha-barrie', 'twitter', '', 'website', 'https://sabiteck.com'), JSON_ARRAY('Leadership', 'Strategy', 'EdTech Innovation'), 15, 1, 1, 1),
('Sarah Johnson', 'sarah-johnson', 'Head of Study Abroad', 'Study Abroad', 'Expert in international education with a passion for helping students achieve their global academic dreams and cultural exchange.', 'sarah@sabiteck.com', '+44 20 7946 0958', 'London, UK', NULL, NULL, NULL, NULL, JSON_OBJECT('linkedin', '', 'twitter', '', 'website', ''), JSON_ARRAY('Education Consulting', 'Student Support', 'Cultural Affairs'), 10, 1, 1, 2),
('Mohamed Kamara', 'mohamed-kamara', 'Lead Developer', 'Technology', 'Full-stack developer specializing in modern web technologies and educational platform development.', 'mohamed@sabiteck.com', '+232 76 123456', 'Freetown, Sierra Leone', NULL, NULL, NULL, NULL, JSON_OBJECT('linkedin', '', 'twitter', '', 'website', ''), JSON_ARRAY('React', 'Node.js', 'Database Design'), 8, 1, 0, 3);

-- Add indexes for better performance
CREATE INDEX idx_active_featured ON team_members(active, featured);
CREATE INDEX idx_active_sort ON team_members(active, sort_order);

-- Add constraint check comments
-- Skills format: JSON array of strings ["Leadership", "Mentorship", "Strategy", "Software Development"]
-- Phone format: International format recommended +XXX XX XXXX XXXX
-- Location format: City, Country or just Country
