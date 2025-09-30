-- Migration: Create Important Links Tables
-- Description: Creates tables for managing important links with categories
-- Author: Claude Code Assistant
-- Date: 2025-09-27

-- Important Links Categories Table
CREATE TABLE IF NOT EXISTS important_links_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Link',
    color VARCHAR(50) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order),
    INDEX idx_name (name)
);

-- Important Links Table
CREATE TABLE IF NOT EXISTS important_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    file_path VARCHAR(500),
    link_type ENUM('website', 'download') DEFAULT 'website',
    is_downloadable BOOLEAN DEFAULT FALSE,
    file_size VARCHAR(50),
    file_type VARCHAR(50),
    target_blank BOOLEAN DEFAULT TRUE,
    icon VARCHAR(50) DEFAULT 'ExternalLink',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    click_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES important_links_categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_link_type (link_type),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_title (title)
);

-- Insert default categories
INSERT INTO important_links_categories (name, description, icon, color, display_order) VALUES
('Technology', 'Technology-related resources and tools', 'Monitor', 'blue', 1),
('Books & Literature', 'Educational books and reading materials', 'Book', 'green', 2),
('Software & Tools', 'Useful software applications and development tools', 'Code', 'purple', 3),
('Documentation', 'Technical documentation and guides', 'FileText', 'orange', 4),
('Research & Academic', 'Academic papers and research resources', 'GraduationCap', 'red', 5),
('General Resources', 'Miscellaneous helpful resources', 'Globe', 'gray', 6)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample links
INSERT INTO important_links (category_id, title, description, url, link_type, target_blank, icon, display_order) VALUES
(1, 'GitHub', 'Version control and collaboration platform', 'https://github.com', 'website', TRUE, 'Github', 1),
(1, 'Stack Overflow', 'Programming Q&A community', 'https://stackoverflow.com', 'website', TRUE, 'MessageSquare', 2),
(2, 'Project Gutenberg', 'Free eBooks collection', 'https://www.gutenberg.org', 'website', TRUE, 'Book', 1),
(3, 'Visual Studio Code', 'Popular code editor', 'https://code.visualstudio.com', 'website', TRUE, 'Code', 1),
(4, 'MDN Web Docs', 'Web development documentation', 'https://developer.mozilla.org', 'website', TRUE, 'FileText', 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Add tool configuration for Important Links
INSERT INTO tools_config (name, description, icon, component, visible, display_order, gradient, color, featured) VALUES
('Important Links', 'Access curated collection of important links and downloadable resources organized by categories', 'Link', 'ImportantLinks', TRUE, 3, 'from-indigo-500 via-purple-500 to-pink-500', 'indigo', FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name);