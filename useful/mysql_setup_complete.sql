-- Complete MySQL Database Setup for Sabiteck Website
-- This script creates all necessary tables and inserts dummy data for frontend functionality

-- Create database
CREATE DATABASE IF NOT EXISTS devco_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devco_db;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    category VARCHAR(100),
    author VARCHAR(100),
    featured_image VARCHAR(500),
    published TINYINT(1) DEFAULT 0,
    featured TINYINT(1) DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolio Projects Table
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    content LONGTEXT,
    category VARCHAR(100),
    client VARCHAR(100),
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    technologies JSON,
    featured_image VARCHAR(500),
    gallery JSON,
    completed TINYINT(1) DEFAULT 0,
    featured TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    content LONGTEXT,
    icon VARCHAR(100),
    featured_image VARCHAR(500),
    price_range VARCHAR(100),
    duration VARCHAR(100),
    active TINYINT(1) DEFAULT 1,
    popular TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    bio TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar VARCHAR(500),
    social_links JSON,
    skills JSON,
    active TINYINT(1) DEFAULT 1,
    featured TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active TINYINT(1) DEFAULT 1,
    unsubscribed_at TIMESTAMP NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value LONGTEXT,
    description TEXT,
    type ENUM('text', 'textarea', 'json', 'boolean', 'number') DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Route Settings Table
CREATE TABLE IF NOT EXISTS route_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route VARCHAR(100) UNIQUE NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    title VARCHAR(255),
    description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Content Management Table
CREATE TABLE IF NOT EXISTS content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT NOT NULL,
    type ENUM('page', 'blog', 'service', 'portfolio', 'announcement') NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    meta_title VARCHAR(255),
    meta_description TEXT,
    featured_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Default Admin User
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@sabiteck.com')
ON DUPLICATE KEY UPDATE username = username;

-- Insert Sample Blog Posts
INSERT INTO blog_posts (title, slug, excerpt, content, category, author, featured_image, published, featured) VALUES
('Welcome to Sabiteck - Your Premier Tech Partner', 'welcome-to-sabiteck', 'Discover how Sabiteck Limited is transforming Sierra Leone through innovative technology solutions, training, and digital services.',
'<p>Since our founding in 2020, Sabiteck Limited has been at the forefront of technological innovation in Sierra Leone. Based in Bo, we have grown to become the country''s premier technology solutions provider.</p><p>Our comprehensive services include custom software development, professional technology training, business consultancy, and creative photography services. We believe in empowering local talent and driving digital transformation across Sierra Leone.</p>',
'Company News', 'Emmanuel Koroma', '/src/assets/images/blog/sabiteck-office.jpg', 1, 1),

('The Future of Software Development in Sierra Leone', 'future-software-development-sierra-leone', 'Exploring the growing opportunities and potential for software development in Sierra Leone''s emerging tech ecosystem.',
'<p>Sierra Leone''s technology sector is experiencing unprecedented growth, and software development is at the heart of this transformation. As digital infrastructure improves and internet connectivity expands, local developers have more opportunities than ever before.</p><p>At Sabiteck, we''re training the next generation of Sierra Leonean developers, equipping them with modern programming skills and industry best practices. From web development to mobile applications, our training programs are designed to meet international standards.</p>',
'Technology', 'James Sesay', '/src/assets/images/blog/coding-training.jpg', 1, 1),

('Building Digital Solutions for Local Businesses', 'digital-solutions-local-businesses', 'How Sabiteck is helping Sierra Leonean businesses embrace digital transformation and grow their operations online.',
'<p>Local businesses across Sierra Leone are discovering the power of digital solutions to expand their reach and improve efficiency. From e-commerce platforms to inventory management systems, technology is reshaping how business is done.</p><p>Our team works closely with local entrepreneurs to understand their unique challenges and develop customized software solutions that address their specific needs. We''re proud to be part of Sierra Leone''s digital revolution.</p>',
'Business', 'Fatima Kamara', '/src/assets/images/blog/business-digital.jpg', 1, 0),

('Photography and Media Production in the Digital Age', 'photography-media-production-digital-age', 'Exploring how digital technology is revolutionizing photography and media production services in Sierra Leone.',
'<p>The intersection of technology and creativity has opened new possibilities for photography and media production in Sierra Leone. With advanced digital tools and techniques, we can now capture and produce content that rivals international standards.</p><p>Our photography and media production services leverage cutting-edge technology to deliver stunning visual content for events, corporate branding, and digital marketing campaigns.</p>',
'Creative Services', 'Mohamed Turay', '/src/assets/images/blog/photography-studio.jpg', 1, 0),

('Tech Training Programs: Empowering Sierra Leone Youth', 'tech-training-programs-empowering-youth', 'Discover how our comprehensive technology training programs are creating opportunities for young Sierra Leoneans in the digital economy.',
'<p>Education is the foundation of technological advancement, and our training programs are designed to provide practical, industry-relevant skills to Sierra Leonean youth. From basic computer literacy to advanced programming concepts, we offer a complete learning pathway.</p><p>Our graduates are now working in various sectors, contributing to Sierra Leone''s growing reputation as a hub for technology talent in West Africa.</p>',
'Education', 'Aminata Bangura', '/src/assets/images/blog/training-classroom.jpg', 1, 1)
ON DUPLICATE KEY UPDATE title = title;

-- Insert Sample Portfolio Projects
INSERT INTO portfolio_projects (title, slug, description, content, category, client, project_url, technologies, featured_image, completed, featured) VALUES
('Sierra Leone Tourism Board Website', 'sierra-leone-tourism-website', 'A comprehensive tourism portal showcasing Sierra Leone''s beautiful destinations and cultural heritage.',
'<p>We developed a modern, responsive website for the Sierra Leone Tourism Board to promote the country''s tourism potential. The site features interactive maps, destination guides, cultural information, and booking integration for hotels and tours.</p><p>Built with modern web technologies and optimized for mobile devices, the website has significantly increased online engagement and tourism inquiries.</p>',
'Web Development', 'Sierra Leone Tourism Board', 'https://visitsierraleone.org',
'["PHP", "JavaScript", "MySQL", "Bootstrap", "Google Maps API"]',
'/src/assets/images/portfolio/tourism-website.jpg', 1, 1),

('Local Bank Mobile Banking App', 'mobile-banking-app', 'Secure and user-friendly mobile banking application for one of Sierra Leone''s leading financial institutions.',
'<p>Developed a comprehensive mobile banking solution that allows customers to perform various banking operations securely from their smartphones. The app includes features like account balance checking, money transfers, bill payments, and transaction history.</p><p>Security was paramount in this project, implementing multi-factor authentication, encryption, and fraud detection systems to protect customer data and transactions.</p>',
'Mobile Development', 'First National Bank SL', '',
'["React Native", "Node.js", "MongoDB", "JWT", "SSL Encryption"]',
'/src/assets/images/portfolio/banking-app.jpg', 1, 1),

('Agricultural Cooperative Management System', 'agricultural-cooperative-system', 'Digital platform for managing agricultural cooperatives and connecting farmers with markets.',
'<p>Created a comprehensive management system for agricultural cooperatives in Sierra Leone, helping farmers organize their activities, track production, and connect with buyers. The system includes inventory management, member registration, and market price tracking.</p><p>This project has helped improve agricultural productivity and farmer incomes across multiple districts in Sierra Leone.</p>',
'Web Application', 'Sierra Leone Agricultural Cooperative Union', '',
'["Laravel", "Vue.js", "MySQL", "Chart.js", "SMS API"]',
'/src/assets/images/portfolio/agriculture-system.jpg', 1, 1),

('Educational Institution Portal', 'educational-institution-portal', 'Comprehensive school management system for academic institutions in Sierra Leone.',
'<p>Developed a complete school management solution that handles student enrollment, grade management, attendance tracking, fee payment, and parent-teacher communication. The system streamlines administrative processes and improves communication between all stakeholders.</p><p>The portal has been successfully implemented in several schools across Bo and surrounding areas.</p>',
'Education Technology', 'Bo Secondary School', '',
'["Django", "Python", "PostgreSQL", "Bootstrap", "Payment Gateway"]',
'/src/assets/images/portfolio/school-portal.jpg', 1, 0),

('E-commerce Platform for Local Retailers', 'ecommerce-platform-local-retailers', 'Multi-vendor e-commerce platform enabling Sierra Leonean businesses to sell online.',
'<p>Built a robust e-commerce platform that allows local retailers to create online stores and reach customers across Sierra Leone. The platform includes vendor management, payment processing, inventory tracking, and delivery coordination.</p><p>This project has enabled dozens of local businesses to expand their reach and increase sales through digital channels.</p>',
'E-commerce', 'Sierra Leone Retailers Association', 'https://shopsl.com',
'["WooCommerce", "WordPress", "PHP", "Stripe", "Mobile Money API"]',
'/src/assets/images/portfolio/ecommerce-platform.jpg', 1, 1),

('Healthcare Management System', 'healthcare-management-system', 'Digital health records and appointment management system for medical facilities.',
'<p>Developed a comprehensive healthcare management system that digitizes patient records, manages appointments, tracks medical inventory, and facilitates communication between healthcare providers. The system improves efficiency and patient care quality.</p><p>Successfully deployed in multiple clinics and hospitals across the Southern Province of Sierra Leone.</p>',
'Healthcare Technology', 'Bo Government Hospital', '',
'["React", "Express.js", "MongoDB", "Socket.io", "PDF Generation"]',
'/src/assets/images/portfolio/healthcare-system.jpg', 1, 0)
ON DUPLICATE KEY UPDATE title = title;

-- Insert Sample Services
INSERT INTO services (title, slug, description, content, icon, price_range, duration, active, popular, sort_order) VALUES
('Custom Software Development', 'custom-software-development', 'Tailored software solutions designed specifically for your business needs and requirements.',
'<p>Our custom software development services help businesses streamline their operations and achieve their goals through technology. We work closely with clients to understand their unique requirements and develop solutions that fit perfectly.</p><p>From web applications to desktop software, we use the latest technologies and best practices to deliver robust, scalable, and maintainable software solutions.</p><h3>What We Offer:</h3><ul><li>Web Application Development</li><li>Desktop Software Solutions</li><li>API Development and Integration</li><li>Database Design and Optimization</li><li>System Architecture and Planning</li></ul>',
'code', '$500 - $5000', '2-12 weeks', 1, 1, 1),

('Mobile App Development', 'mobile-app-development', 'Native and cross-platform mobile applications for iOS and Android devices.',
'<p>In today''s mobile-first world, having a mobile app is essential for reaching your customers. We develop high-quality mobile applications that provide excellent user experiences and drive business growth.</p><p>Whether you need a simple informational app or a complex business solution, our team has the expertise to bring your mobile app vision to life.</p><h3>Our Mobile Services:</h3><ul><li>iOS App Development</li><li>Android App Development</li><li>Cross-Platform Solutions</li><li>App Store Optimization</li><li>Mobile App Maintenance</li></ul>',
'smartphone', '$800 - $8000', '3-16 weeks', 1, 1, 2),

('Technology Training Programs', 'technology-training-programs', 'Comprehensive training programs in programming, digital literacy, and modern technology skills.',
'<p>Empower yourself or your team with our comprehensive technology training programs. We offer courses ranging from basic computer literacy to advanced programming and software development skills.</p><p>Our experienced instructors provide hands-on training that prepares students for real-world technology challenges and career opportunities.</p><h3>Training Areas:</h3><ul><li>Web Development (HTML, CSS, JavaScript, PHP)</li><li>Mobile App Development</li><li>Database Management</li><li>Digital Marketing</li><li>Computer Basics and Digital Literacy</li></ul>',
'graduation-cap', '$50 - $500', '1-12 weeks', 1, 1, 3),

('Business Consultancy', 'business-consultancy', 'Strategic technology consulting to help businesses leverage technology for growth and efficiency.',
'<p>Our business consultancy services help organizations identify technology opportunities and develop strategies for digital transformation. We provide expert guidance on technology adoption, process optimization, and digital strategy.</p><p>Whether you''re a startup looking to build your technology foundation or an established business seeking to modernize your operations, we can help you navigate the digital landscape.</p><h3>Consultancy Services:</h3><ul><li>Digital Transformation Strategy</li><li>Technology Assessment and Planning</li><li>Process Optimization</li><li>Vendor Selection and Management</li><li>Project Management and Oversight</li></ul>',
'chart-line', '$100 - $2000', '1-8 weeks', 1, 1, 4),

('Photography Services', 'photography-services', 'Professional photography services for events, corporate branding, and creative projects.',
'<p>Capture your most important moments with our professional photography services. We specialize in event photography, corporate portraits, product photography, and creative visual content.</p><p>Our team combines technical expertise with artistic vision to deliver stunning photographs that tell your story and represent your brand effectively.</p><h3>Photography Services:</h3><ul><li>Event Photography</li><li>Corporate Portraits</li><li>Product Photography</li><li>Wedding Photography</li><li>Commercial Photography</li></ul>',
'camera', '$100 - $1500', '1-3 days', 1, 0, 5),

('Web Design & Development', 'web-design-development', 'Modern, responsive websites that engage users and drive business results.',
'<p>Your website is often the first impression customers have of your business. We create beautiful, functional websites that not only look great but also perform well and achieve your business objectives.</p><p>From simple business websites to complex web applications, we use modern design principles and cutting-edge technologies to deliver exceptional web experiences.</p><h3>Web Services:</h3><ul><li>Responsive Web Design</li><li>E-commerce Websites</li><li>Content Management Systems</li><li>Website Maintenance and Support</li><li>SEO Optimization</li></ul>',
'globe', '$300 - $3000', '2-8 weeks', 1, 1, 6),

-- Additional Comprehensive Services for Sabiteck
('Digital Marketing Solutions', 'digital-marketing-solutions', 'Comprehensive digital marketing strategies to boost your online presence and drive customer engagement.',
'<p>In the digital age, having a strong online presence is crucial for business success. Our digital marketing solutions help Sierra Leonean businesses reach their target audience, increase brand awareness, and drive meaningful customer engagement.</p><p>We create customized marketing strategies that leverage the power of social media, search engines, and digital advertising to grow your business.</p><h3>Our Digital Marketing Services:</h3><ul><li>Social Media Marketing and Management</li><li>Search Engine Optimization (SEO)</li><li>Pay-Per-Click (PPC) Advertising</li><li>Email Marketing Campaigns</li><li>Content Marketing Strategy</li><li>Online Reputation Management</li><li>Analytics and Performance Tracking</li></ul>',
'megaphone', '$200 - $2500', '1-6 months', 1, 1, 7),

('Search Engine Optimization', 'search-engine-optimization', 'Professional SEO services to improve your website visibility and search engine rankings.',
'<p>Get found by your customers when they search for your services online. Our SEO experts optimize your website to rank higher in search results, driving more organic traffic and potential customers to your business.</p><p>We use proven SEO strategies tailored for Sierra Leone businesses to help you dominate local search results.</p><h3>SEO Services Include:</h3><ul><li>Keyword Research and Analysis</li><li>On-Page SEO Optimization</li><li>Technical SEO Audits</li><li>Local SEO for Sierra Leone</li><li>Content Optimization</li><li>Link Building Strategies</li><li>SEO Performance Reporting</li></ul>',
'search', '$150 - $1500', '2-12 months', 1, 0, 8),

('E-commerce Development', 'ecommerce-development', 'Complete e-commerce solutions to help you sell products and services online across Sierra Leone.',
'<p>Expand your business reach with a professional e-commerce platform. We build secure, user-friendly online stores that make it easy for customers to browse, purchase, and pay for your products or services.</p><p>Our e-commerce solutions are optimized for Sierra Leone, supporting local payment methods and delivery systems.</p><h3>E-commerce Features:</h3><ul><li>Custom Online Store Design</li><li>Mobile-Optimized Shopping Experience</li><li>Secure Payment Gateway Integration</li><li>Inventory Management System</li><li>Order Processing and Tracking</li><li>Customer Account Management</li><li>Multi-language Support</li><li>Local Delivery Integration</li></ul>',
'shopping-cart', '$600 - $5000', '3-12 weeks', 1, 1, 9),

('Data Analytics & Business Intelligence', 'data-analytics-business-intelligence', 'Transform your business data into actionable insights for better decision making.',
'<p>Make data-driven decisions with our comprehensive analytics and business intelligence solutions. We help businesses in Sierra Leone understand their data, identify trends, and optimize their operations for better performance.</p><p>Our analytics solutions provide clear insights into customer behavior, sales patterns, and business performance metrics.</p><h3>Analytics Services:</h3><ul><li>Business Intelligence Dashboards</li><li>Data Visualization and Reporting</li><li>Customer Analytics</li><li>Sales Performance Analysis</li><li>Market Research and Analysis</li><li>Predictive Analytics</li><li>Database Design and Optimization</li></ul>',
'bar-chart', '$300 - $3000', '2-8 weeks', 1, 0, 10),

('Cloud Solutions & Migration', 'cloud-solutions-migration', 'Modern cloud infrastructure solutions for scalable and secure business operations.',
'<p>Modernize your business with cloud technology. Our cloud solutions provide secure, scalable, and cost-effective infrastructure that grows with your business needs.</p><p>We help Sierra Leone businesses migrate to the cloud safely and efficiently, ensuring minimal disruption to operations.</p><h3>Cloud Services:</h3><ul><li>Cloud Infrastructure Setup</li><li>Data Migration and Backup</li><li>Cloud Security Implementation</li><li>Application Hosting</li><li>Disaster Recovery Planning</li><li>Cloud Cost Optimization</li><li>24/7 Cloud Monitoring</li></ul>',
'cloud', '$400 - $4000', '2-10 weeks', 1, 0, 11),

('Cybersecurity Solutions', 'cybersecurity-solutions', 'Protect your business from cyber threats with comprehensive security solutions.',
'<p>In an increasingly digital world, cybersecurity is essential for protecting your business data and customer information. Our security experts implement robust protection measures to safeguard your digital assets.</p><p>We provide comprehensive security audits and implement protection systems tailored for Sierra Leone businesses.</p><h3>Security Services:</h3><ul><li>Security Assessment and Auditing</li><li>Firewall and Network Security</li><li>Data Encryption and Protection</li><li>Employee Security Training</li><li>Incident Response Planning</li><li>Compliance and Regulatory Support</li><li>24/7 Security Monitoring</li></ul>',
'shield', '$250 - $2500', '1-6 weeks', 1, 0, 12),

('AI & Automation Solutions', 'ai-automation-solutions', 'Innovative AI and automation technologies to streamline your business processes.',
'<p>Embrace the future with AI and automation solutions that improve efficiency and reduce operational costs. We implement smart technologies that automate repetitive tasks and provide intelligent insights.</p><p>Our AI solutions are designed for Sierra Leone businesses looking to gain a competitive advantage through technology innovation.</p><h3>AI & Automation Services:</h3><ul><li>Process Automation</li><li>Chatbot Development</li><li>Predictive Analytics</li><li>Document Processing Automation</li><li>Customer Service Automation</li><li>Inventory Management Automation</li><li>AI-Powered Business Insights</li></ul>',
'brain', '$500 - $6000', '3-16 weeks', 1, 1, 13),

('Content Management Systems', 'content-management-systems', 'Easy-to-use content management solutions for websites and digital platforms.',
'<p>Take control of your website content with user-friendly content management systems. We build custom CMS solutions that make it easy for you to update, manage, and publish content without technical expertise.</p><p>Our CMS solutions are perfect for Sierra Leone businesses that want to maintain their online presence independently.</p><h3>CMS Features:</h3><ul><li>User-Friendly Content Editor</li><li>Multi-User Management</li><li>SEO-Optimized Content Structure</li><li>Media Management</li><li>Workflow and Publishing Controls</li><li>Mobile-Responsive Design</li><li>Security and Backup Systems</li></ul>',
'edit', '$400 - $2500', '2-8 weeks', 1, 0, 14),

('Video Production & Editing', 'video-production-editing', 'Professional video production services for marketing, training, and entertainment content.',
'<p>Tell your story through compelling video content. Our video production team creates high-quality promotional videos, training materials, and entertainment content that engages your audience and enhances your brand.</p><p>We specialize in creating video content that resonates with Sierra Leone audiences and showcases local culture and values.</p><h3>Video Services:</h3><ul><li>Corporate Video Production</li><li>Marketing and Promotional Videos</li><li>Training and Educational Content</li><li>Event Coverage and Documentation</li><li>Animation and Motion Graphics</li><li>Video Editing and Post-Production</li><li>Social Media Video Content</li></ul>',
'video', '$300 - $3500', '1-6 weeks', 1, 1, 15),

('Graphic Design & Branding', 'graphic-design-branding', 'Creative graphic design and branding services to establish your unique visual identity.',
'<p>Create a memorable brand identity with our professional graphic design services. We design logos, marketing materials, and brand assets that represent your business values and appeal to your target audience.</p><p>Our designs reflect Sierra Leone culture while meeting international standards for professionalism and quality.</p><h3>Design Services:</h3><ul><li>Logo and Brand Identity Design</li><li>Marketing Material Design</li><li>Website and Digital Graphics</li><li>Print Design and Layout</li><li>Packaging and Product Design</li><li>Social Media Graphics</li><li>Brand Guidelines Development</li></ul>',
'palette', '$100 - $1500', '1-4 weeks', 1, 0, 16),

('IT Support & Maintenance', 'it-support-maintenance', 'Reliable IT support and maintenance services to keep your technology running smoothly.',
'<p>Keep your technology infrastructure running smoothly with our comprehensive IT support services. We provide ongoing maintenance, troubleshooting, and technical support to ensure your business operations continue without interruption.</p><p>Our support team understands the unique technology challenges faced by Sierra Leone businesses and provides practical, cost-effective solutions.</p><h3>IT Support Services:</h3><ul><li>Help Desk and Technical Support</li><li>Hardware Maintenance and Repair</li><li>Software Installation and Updates</li><li>Network Administration</li><li>Data Backup and Recovery</li><li>System Monitoring and Optimization</li><li>Emergency Technical Response</li></ul>',
'headphones', '$150 - $1000', 'Ongoing', 1, 0, 17),

('Software Integration Solutions', 'software-integration-solutions', 'Seamless integration of different software systems for improved business efficiency.',
'<p>Connect your business systems for maximum efficiency. Our software integration services help different applications work together seamlessly, eliminating data silos and improving workflow automation.</p><p>We specialize in integrating popular business software used by Sierra Leone companies, ensuring smooth data flow and improved productivity.</p><h3>Integration Services:</h3><ul><li>API Development and Integration</li><li>Database Synchronization</li><li>Third-Party Software Connectivity</li><li>Workflow Automation</li><li>Data Migration and Mapping</li><li>System Architecture Planning</li><li>Integration Testing and Validation</li></ul>',
'link', '$300 - $2500', '2-10 weeks', 1, 0, 18),

('Quality Assurance & Testing', 'quality-assurance-testing', 'Comprehensive software testing services to ensure your applications work flawlessly.',
'<p>Ensure your software works perfectly with our thorough quality assurance and testing services. We identify and fix issues before they reach your users, guaranteeing a smooth and reliable user experience.</p><p>Our testing methodology covers all aspects of software quality, from functionality to performance and security.</p><h3>QA & Testing Services:</h3><ul><li>Functional Testing</li><li>Performance and Load Testing</li><li>Security Testing</li><li>Mobile App Testing</li><li>User Acceptance Testing</li><li>Automated Testing Solutions</li><li>Bug Tracking and Resolution</li></ul>',
'check-circle', '$200 - $1500', '1-6 weeks', 1, 0, 19),

('Project Management & Consulting', 'project-management-consulting', 'Professional project management services to ensure successful technology implementations.',
'<p>Ensure your technology projects succeed with our expert project management services. We provide structured planning, execution, and monitoring to deliver projects on time and within budget.</p><p>Our project managers have extensive experience with Sierra Leone business environment and understand local challenges and opportunities.</p><h3>Project Management Services:</h3><ul><li>Project Planning and Scheduling</li><li>Resource Management</li><li>Risk Assessment and Mitigation</li><li>Quality Control and Monitoring</li><li>Stakeholder Communication</li><li>Budget Management</li><li>Project Documentation and Reporting</li></ul>',
'clipboard-list', '$150 - $2000', '1-12 months', 1, 0, 20),

('Blockchain & Fintech Solutions', 'blockchain-fintech-solutions', 'Innovative blockchain and financial technology solutions for modern businesses.',
'<p>Explore the future of finance with our blockchain and fintech solutions. We develop secure, transparent, and efficient financial applications that can revolutionize how businesses handle transactions and financial data.</p><p>Our fintech solutions are designed with Sierra Leone regulations and financial infrastructure in mind.</p><h3>Blockchain & Fintech Services:</h3><ul><li>Cryptocurrency Integration</li><li>Smart Contract Development</li><li>Digital Wallet Solutions</li><li>Payment Gateway Development</li><li>Financial Data Analytics</li><li>Regulatory Compliance Solutions</li><li>Blockchain Consulting</li></ul>',
'dollar-sign', '$800 - $8000', '4-20 weeks', 1, 1, 21)
ON DUPLICATE KEY UPDATE title = title;

-- Insert Sample Team Members
INSERT INTO team_members (name, slug, position, department, bio, email, avatar, social_links, skills, active, featured, sort_order) VALUES
('Emmanuel Koroma', 'emmanuel-koroma', 'CEO & Founder', 'Executive', 'Visionary leader with over 8 years of experience in technology and business development. Emmanuel founded Sabiteck Limited in 2020 with the mission of transforming Sierra Leone through innovative technology solutions.', 'emmanuel@sabiteck.com', '/src/assets/images/team/emmanuel-koroma.jpg',
'{"linkedin": "https://linkedin.com/in/emmanuel-koroma", "twitter": "https://twitter.com/emmanuelkoroma"}',
'["Leadership", "Business Strategy", "Project Management", "Software Development"]', 1, 1, 1),

('James Sesay', 'james-sesay', 'Lead Software Developer', 'Development', 'Senior full-stack developer with expertise in modern web technologies. James leads our development team and ensures the delivery of high-quality software solutions for our clients.', 'james@sabiteck.com', '/src/assets/images/team/james-sesay.jpg',
'{"linkedin": "https://linkedin.com/in/james-sesay", "github": "https://github.com/james-sesay"}',
'["PHP", "JavaScript", "Python", "React", "Laravel", "Database Design"]', 1, 1, 2),

('Fatima Kamara', 'fatima-kamara', 'Business Development Manager', 'Business Development', 'Experienced business development professional specializing in client relations and strategic partnerships. Fatima helps businesses identify technology opportunities and develop growth strategies.', 'fatima@sabiteck.com', '/src/assets/images/team/fatima-kamara.jpg',
'{"linkedin": "https://linkedin.com/in/fatima-kamara"}',
'["Business Development", "Client Relations", "Strategic Planning", "Market Analysis"]', 1, 1, 3),

('Mohamed Turay', 'mohamed-turay', 'Creative Director & Photographer', 'Creative Services', 'Award-winning photographer and creative director with a passion for visual storytelling. Mohamed leads our photography and media production services, creating stunning visual content for clients.', 'mohamed@sabiteck.com', '/src/assets/images/team/mohamed-turay.jpg',
'{"instagram": "https://instagram.com/mohamedturay", "behance": "https://behance.net/mohamedturay"}',
'["Photography", "Video Production", "Graphic Design", "Creative Direction", "Adobe Creative Suite"]', 1, 1, 4),

('Aminata Bangura', 'aminata-bangura', 'Training Coordinator', 'Education', 'Dedicated educator with extensive experience in technology training and curriculum development. Aminata designs and delivers our comprehensive training programs for students and professionals.', 'aminata@sabiteck.com', '/src/assets/images/team/aminata-bangura.jpg',
'{"linkedin": "https://linkedin.com/in/aminata-bangura"}',
'["Training & Development", "Curriculum Design", "Educational Technology", "Public Speaking"]', 1, 1, 5),

('Ibrahim Conteh', 'ibrahim-conteh', 'Mobile App Developer', 'Development', 'Specialized mobile application developer with expertise in iOS and Android development. Ibrahim creates innovative mobile solutions that help businesses reach their customers on any device.', 'ibrahim@sabiteck.com', '/src/assets/images/team/ibrahim-conteh.jpg',
'{"github": "https://github.com/ibrahim-conteh", "linkedin": "https://linkedin.com/in/ibrahim-conteh"}',
'["React Native", "Flutter", "iOS Development", "Android Development", "Mobile UI/UX"]', 1, 0, 6),

('Mariama Jalloh', 'mariama-jalloh', 'UI/UX Designer', 'Design', 'Creative UI/UX designer passionate about creating intuitive and engaging user experiences. Mariama ensures that all our digital solutions are not only functional but also beautiful and user-friendly.', 'mariama@sabiteck.com', '/src/assets/images/team/mariama-jalloh.jpg',
'{"dribbble": "https://dribbble.com/mariama-jalloh", "behance": "https://behance.net/mariama-jalloh"}',
'["UI/UX Design", "User Research", "Prototyping", "Adobe XD", "Figma", "User Testing"]', 1, 0, 7),

('Abdul Rahman', 'abdul-rahman', 'Systems Administrator', 'IT Operations', 'Experienced systems administrator responsible for maintaining our IT infrastructure and ensuring optimal performance of all technology systems. Abdul keeps everything running smoothly behind the scenes.', 'abdul@sabiteck.com', '/src/assets/images/team/abdul-rahman.jpg',
'{"linkedin": "https://linkedin.com/in/abdul-rahman"}',
'["System Administration", "Network Management", "Cloud Computing", "Security", "Server Management"]', 1, 0, 8)
ON DUPLICATE KEY UPDATE name = name;

-- Insert Sample Settings
INSERT INTO settings (setting_key, setting_value, description, type) VALUES
('site_title', 'Sabiteck Limited - Premier Technology Solutions', 'Main website title', 'text'),
('site_description', 'Sierra Leone''s leading technology company offering software development, tech training, business consultancy, photography, and digital solutions since 2020.', 'Site meta description', 'textarea'),
('contact_email', 'info@sabiteck.com', 'Main contact email address', 'text'),
('contact_phone', '+232-78-618-435', 'Main contact phone number', 'text'),
('address', '6 Hancil Road, Bo, Sierra Leone', 'Company address', 'text'),
('social_facebook', 'https://facebook.com/sabiteck', 'Facebook page URL', 'text'),
('social_twitter', 'https://twitter.com/sabiteck', 'Twitter profile URL', 'text'),
('social_linkedin', 'https://linkedin.com/company/sabiteck', 'LinkedIn company page URL', 'text'),
('social_instagram', 'https://instagram.com/sabiteck', 'Instagram profile URL', 'text'),
('enable_blog', '1', 'Enable blog functionality', 'boolean'),
('enable_portfolio', '1', 'Enable portfolio functionality', 'boolean'),
('enable_newsletter', '1', 'Enable newsletter subscription', 'boolean')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Insert Route Settings
INSERT INTO route_settings (route, enabled, title, description) VALUES
('/', 1, 'Home - Sabiteck Limited', 'Premier technology solutions in Sierra Leone'),
('/services', 1, 'Our Services - Sabiteck Limited', 'Comprehensive technology services and solutions'),
('/portfolio', 1, 'Our Portfolio - Sabiteck Limited', 'Showcase of our successful projects and solutions'),
('/blog', 1, 'Blog - Sabiteck Limited', 'Latest news, insights, and updates from our team'),
('/team', 1, 'Our Team - Sabiteck Limited', 'Meet the talented professionals behind Sabiteck'),
('/contact', 1, 'Contact Us - Sabiteck Limited', 'Get in touch with our team for your technology needs'),
('/about', 1, 'About Us - Sabiteck Limited', 'Learn more about our company and mission')
ON DUPLICATE KEY UPDATE route = route;

-- Insert Sample Newsletter Subscribers
INSERT INTO newsletter_subscribers (email, name) VALUES
('john.doe@example.com', 'John Doe'),
('jane.smith@example.com', 'Jane Smith'),
('mike.johnson@example.com', 'Mike Johnson'),
('sarah.williams@example.com', 'Sarah Williams'),
('david.brown@example.com', 'David Brown'),
('lisa.davis@example.com', 'Lisa Davis'),
('ahmed.hassan@example.com', 'Ahmed Hassan'),
('fatou.traore@example.com', 'Fatou Traore'),
('samuel.kargbo@example.com', 'Samuel Kargbo'),
('marian.cole@example.com', 'Marian Cole')
ON DUPLICATE KEY UPDATE email = email;

-- Insert Sample Contact Messages
INSERT INTO contacts (name, email, company, phone, subject, message, status) VALUES
('John Williams', 'john.williams@business.sl', 'Sierra Leone Enterprises', '+232-77-123456', 'Website Development Inquiry', 'We are interested in developing a new website for our business. Could you please provide more information about your services and pricing?', 'new'),
('Mary Kamara', 'mary.kamara@ngo.org', 'Hope Foundation SL', '+232-78-987654', 'Training Program Information', 'Our NGO is looking to train our staff in basic computer skills. Do you offer group training sessions?', 'read'),
('Ibrahim Sesay', 'ibrahim@startup.sl', 'TechStart SL', '+232-76-555123', 'Mobile App Development', 'We have an idea for a mobile app that could help local farmers. Would love to discuss this project with your team.', 'replied'),
('Aminata Jalloh', 'aminata.jalloh@school.edu.sl', 'Bo Community School', '+232-78-444567', 'School Management System', 'We need a digital solution to manage our school records and communications. Can you help us with this?', 'new')
ON DUPLICATE KEY UPDATE name = name;

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX idx_portfolio_completed ON portfolio_projects(completed);
CREATE INDEX idx_portfolio_featured ON portfolio_projects(featured);
CREATE INDEX idx_portfolio_category ON portfolio_projects(category);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_popular ON services(popular);
CREATE INDEX idx_team_active ON team_members(active);
CREATE INDEX idx_team_featured ON team_members(featured);
CREATE INDEX idx_team_department ON team_members(department);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(active);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Display setup completion message
SELECT 'Database setup completed successfully!' as status,
       'Default admin credentials: admin / admin123' as credentials,
       'All tables created with sample data' as data_status;
