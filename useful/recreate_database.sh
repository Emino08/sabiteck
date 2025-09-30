#!/bin/bash

# Recreate and populate the DevCo database with all tables and sample data

echo "Recreating DevCo database..."

# Create all tables
echo "Creating tables..."

sqlite3 database/devco.db "
-- Portfolio projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    featured_image VARCHAR(255),
    gallery TEXT,
    technologies TEXT,
    category VARCHAR(50) NOT NULL,
    client_name VARCHAR(255),
    client_type VARCHAR(100),
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    duration VARCHAR(50),
    team_size INTEGER,
    budget_range VARCHAR(50),
    featured INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    icon VARCHAR(100),
    features TEXT,
    technologies TEXT,
    pricing VARCHAR(255),
    timeline VARCHAR(100),
    process_steps TEXT,
    popular INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(255),
    email VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    twitter_url VARCHAR(500),
    skills TEXT,
    experience_years INTEGER,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Social media posts
CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT,
    scheduled_at DATETIME NOT NULL,
    posted_at DATETIME,
    status VARCHAR(20) DEFAULT 'scheduled',
    engagement_stats TEXT,
    post_url VARCHAR(500),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    client_position VARCHAR(255),
    client_avatar VARCHAR(255),
    testimonial TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    project_id INTEGER,
    featured INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES portfolio_projects(id)
);
"

echo "Tables created successfully!"

echo "Inserting sample data..."

# Insert blog posts
sqlite3 database/devco.db "
INSERT OR IGNORE INTO blog_posts (title, slug, content, excerpt, featured_image, author, category, tags, published, featured, views) VALUES
('The Future of Web Development in 2024', 'future-web-development-2024', 
'Web development continues to evolve rapidly with new technologies and frameworks. In this comprehensive guide, we explore the latest trends and technologies that are shaping the future of web development...

## Key Trends in 2024

### 1. AI-Powered Development
Artificial Intelligence is revolutionizing how we build applications. From code generation to automated testing, AI tools are becoming integral parts of the development workflow.

### 2. Edge Computing
With the rise of edge computing, web applications are becoming faster and more responsive. This technology allows data processing closer to the user, reducing latency significantly.',
'Explore the cutting-edge trends and technologies that are revolutionizing web development in 2024, from AI-powered tools to edge computing.',
'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
'John Smith',
'Technology',
'[\"web development\", \"2024 trends\", \"AI\", \"edge computing\"]',
1, 1, 234),

('Building Scalable Mobile Apps with React Native', 'building-scalable-mobile-apps-react-native',
'React Native has become the go-to framework for cross-platform mobile development. In this article, we discuss best practices for building scalable and maintainable mobile applications...',
'Learn best practices for building scalable and maintainable mobile applications with React Native.',
'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop',
'Sarah Johnson',
'Mobile Development',
'[\"React Native\", \"mobile development\", \"scalability\", \"best practices\"]',
1, 1, 189),

('Cloud Architecture: AWS vs Azure vs Google Cloud', 'cloud-architecture-aws-azure-google-cloud',
'Choosing the right cloud platform is crucial for your application success. We compare the three major cloud providers and help you make the right choice...',
'A comprehensive comparison of AWS, Azure, and Google Cloud to help you choose the right cloud platform for your needs.',
'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=400&fit=crop',
'Michael Chen',
'Cloud Computing',
'[\"AWS\", \"Azure\", \"Google Cloud\", \"cloud architecture\"]',
1, 0, 156);
"

# Insert portfolio projects
sqlite3 database/devco.db "
INSERT OR IGNORE INTO portfolio_projects (title, slug, description, short_description, featured_image, gallery, technologies, category, client_name, client_type, project_url, github_url, duration, team_size, budget_range, featured) VALUES
('E-Commerce Platform Revolution', 'ecommerce-platform-revolution',
'A comprehensive e-commerce solution built for a growing retail company. The platform features a modern React frontend, robust Node.js backend, and advanced analytics dashboard.',
'Full-stack e-commerce solution with React, Node.js, and advanced analytics dashboard.',
'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
'[\"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop\", \"https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop\"]',
'[\"React\", \"Node.js\", \"MongoDB\", \"Stripe\", \"Redux\", \"Express\", \"AWS\"]',
'web',
'TechMart Inc.',
'Retail Technology',
'https://demo-ecommerce.devco.com',
'https://github.com/devco/ecommerce-platform',
'4 months',
5,
'$50,000 - $100,000',
1),

('FinTech Mobile Banking App', 'fintech-mobile-banking-app',
'A secure and intuitive mobile banking application built with React Native. The app features biometric authentication, real-time transaction tracking, and investment portfolio management.',
'Cross-platform mobile banking app with biometric authentication and real-time features.',
'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
'[\"https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop\"]',
'[\"React Native\", \"TypeScript\", \"Firebase\", \"Plaid API\", \"Redux Toolkit\", \"AWS Cognito\"]',
'mobile',
'SecureBank Pro',
'Financial Services',
'https://apps.apple.com/fintech-app',
null,
'8 months',
8,
'$100,000+',
1),

('Healthcare Management System', 'healthcare-management-system',
'HIPAA-compliant patient management system with appointment scheduling, medical records, and telemedicine capabilities.',
'HIPAA-compliant patient management system with telemedicine capabilities.',
'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
'[\"https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop\"]',
'[\"React\", \"Python\", \"Django\", \"PostgreSQL\", \"Redis\", \"WebRTC\", \"AWS\", \"Docker\"]',
'enterprise',
'MedCare Solutions',
'Healthcare',
null,
'https://github.com/devco/healthcare-system',
'12 months',
12,
'$200,000+',
1);
"

# Insert services
sqlite3 database/devco.db "
INSERT OR IGNORE INTO services (title, slug, short_description, full_description, icon, features, technologies, pricing, timeline, process_steps, popular, active, sort_order) VALUES
('Web Development', 'web-development',
'Custom web applications built with modern frameworks and best practices.',
'We create powerful, scalable web applications using the latest technologies and best practices. From simple websites to complex enterprise solutions, our team delivers high-quality code that performs.',
'Code',
'[\"Responsive Design\", \"Modern JavaScript Frameworks\", \"RESTful API Development\", \"Database Architecture\", \"Performance Optimization\", \"SEO Implementation\", \"Security Best Practices\", \"Cross-browser Compatibility\"]',
'[\"React\", \"Vue.js\", \"Angular\", \"Node.js\", \"PHP\", \"Python\", \"Laravel\", \"Express\", \"MongoDB\", \"PostgreSQL\"]',
'Starting at $5,000',
'4-12 weeks',
'[\"Requirements Analysis\", \"UI/UX Design\", \"Development & Testing\", \"Deployment & Launch\", \"Maintenance & Support\"]',
1, 1, 1),

('Mobile App Development', 'mobile-app-development',
'Native and cross-platform mobile applications for iOS and Android.',
'Build engaging mobile experiences that delight users. We develop both native apps for optimal performance and cross-platform solutions for faster time-to-market.',
'Smartphone',
'[\"Native iOS & Android\", \"Cross-platform Development\", \"UI/UX Design\", \"App Store Optimization\", \"Push Notifications\", \"Offline Functionality\", \"Third-party Integrations\", \"App Analytics\"]',
'[\"React Native\", \"Flutter\", \"Swift\", \"Kotlin\", \"TypeScript\", \"Firebase\", \"Native APIs\"]',
'Starting at $15,000',
'8-16 weeks',
'[\"Market Research\", \"App Design\", \"Development\", \"Testing\", \"App Store Submission\", \"Post-launch Support\"]',
1, 1, 2);
"

# Insert team members  
sqlite3 database/devco.db "
INSERT OR IGNORE INTO team_members (name, slug, position, department, bio, avatar, email, linkedin_url, github_url, skills, experience_years, featured, sort_order) VALUES
('Sarah Johnson', 'sarah-johnson', 'Lead Frontend Developer', 'Development',
'Sarah is a passionate frontend developer with over 8 years of experience building beautiful and functional user interfaces.',
'https://images.unsplash.com/photo-1494790108755-2616b612b750?w=300&h=300&fit=crop&crop=face',
'sarah@devco.com',
'https://linkedin.com/in/sarahjohnson',
'https://github.com/sarahj',
'[\"React\", \"Vue.js\", \"TypeScript\", \"CSS3\", \"Webpack\", \"Testing\", \"UI/UX Design\"]',
8, 1, 1),

('Michael Chen', 'michael-chen', 'Senior Backend Developer', 'Development',
'Michael brings 10 years of backend development expertise to our team. Expert in cloud architecture, API design, and database optimization.',
'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
'michael@devco.com',
'https://linkedin.com/in/michaelchen',
'https://github.com/mchen',
'[\"Node.js\", \"Python\", \"AWS\", \"Docker\", \"PostgreSQL\", \"MongoDB\", \"GraphQL\", \"Microservices\"]',
10, 1, 2);
"

# Insert testimonials
sqlite3 database/devco.db "
INSERT OR IGNORE INTO testimonials (client_name, client_company, client_position, testimonial, rating, featured, approved) VALUES
('Jennifer Adams', 'TechMart Inc.', 'CTO', 'DevCo transformed our e-commerce platform completely. The new system is not only faster but also more secure and user-friendly. Our conversion rates increased by 35% within the first month of launch.', 5, 1, 1),
('Robert Chen', 'SecureBank Pro', 'Head of Digital', 'The mobile banking app DevCo built for us exceeded all expectations. The user experience is seamless, and the security features give us complete confidence.', 5, 1, 1);
"

# Insert social posts
sqlite3 database/devco.db "
INSERT OR IGNORE INTO social_posts (platform, content, scheduled_at, status, created_by) VALUES
('twitter', 'Excited to share our latest blog post about the future of web development in 2024! 🚀 Check out the key trends that are shaping the industry. #WebDev #Technology', datetime('now', '+1 day'), 'scheduled', 1),
('linkedin', 'Just completed another successful mobile app project! Our React Native expertise helped deliver a cross-platform solution that exceeded client expectations. #MobileDev #ReactNative', datetime('now', '+2 days'), 'scheduled', 1);
"

echo "Database recreated and populated successfully!"
echo "Tables available:"
sqlite3 database/devco.db ".tables"