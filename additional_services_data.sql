-- Additional Services Dummy Data for Sabiteck Website
-- This file adds more comprehensive services to showcase the full range of offerings

-- Insert Additional Services
INSERT INTO services (title, slug, description, content, icon, price_range, duration, active, popular, sort_order) VALUES

-- Digital Marketing & SEO Services
('Digital Marketing Solutions', 'digital-marketing-solutions', 'Comprehensive digital marketing strategies to boost your online presence and drive customer engagement.',
'<p>In the digital age, having a strong online presence is crucial for business success. Our digital marketing solutions help Sierra Leonean businesses reach their target audience, increase brand awareness, and drive meaningful customer engagement.</p><p>We create customized marketing strategies that leverage the power of social media, search engines, and digital advertising to grow your business.</p><h3>Our Digital Marketing Services:</h3><ul><li>Social Media Marketing and Management</li><li>Search Engine Optimization (SEO)</li><li>Pay-Per-Click (PPC) Advertising</li><li>Email Marketing Campaigns</li><li>Content Marketing Strategy</li><li>Online Reputation Management</li><li>Analytics and Performance Tracking</li></ul>',
'megaphone', '$200 - $2500', '1-6 months', 1, 1, 7),

('Search Engine Optimization', 'search-engine-optimization', 'Professional SEO services to improve your website visibility and search engine rankings.',
'<p>Get found by your customers when they search for your services online. Our SEO experts optimize your website to rank higher in search results, driving more organic traffic and potential customers to your business.</p><p>We use proven SEO strategies tailored for Sierra Leone businesses to help you dominate local search results.</p><h3>SEO Services Include:</h3><ul><li>Keyword Research and Analysis</li><li>On-Page SEO Optimization</li><li>Technical SEO Audits</li><li>Local SEO for Sierra Leone</li><li>Content Optimization</li><li>Link Building Strategies</li><li>SEO Performance Reporting</li></ul>',
'search', '$150 - $1500', '2-12 months', 1, 0, 8),

-- E-commerce Solutions
('E-commerce Development', 'ecommerce-development', 'Complete e-commerce solutions to help you sell products and services online across Sierra Leone.',
'<p>Expand your business reach with a professional e-commerce platform. We build secure, user-friendly online stores that make it easy for customers to browse, purchase, and pay for your products or services.</p><p>Our e-commerce solutions are optimized for Sierra Leone, supporting local payment methods and delivery systems.</p><h3>E-commerce Features:</h3><ul><li>Custom Online Store Design</li><li>Mobile-Optimized Shopping Experience</li><li>Secure Payment Gateway Integration</li><li>Inventory Management System</li><li>Order Processing and Tracking</li><li>Customer Account Management</li><li>Multi-language Support</li><li>Local Delivery Integration</li></ul>',
'shopping-cart', '$600 - $5000', '3-12 weeks', 1, 1, 9),

-- Data & Analytics
('Data Analytics & Business Intelligence', 'data-analytics-business-intelligence', 'Transform your business data into actionable insights for better decision making.',
'<p>Make data-driven decisions with our comprehensive analytics and business intelligence solutions. We help businesses in Sierra Leone understand their data, identify trends, and optimize their operations for better performance.</p><p>Our analytics solutions provide clear insights into customer behavior, sales patterns, and business performance metrics.</p><h3>Analytics Services:</h3><ul><li>Business Intelligence Dashboards</li><li>Data Visualization and Reporting</li><li>Customer Analytics</li><li>Sales Performance Analysis</li><li>Market Research and Analysis</li><li>Predictive Analytics</li><li>Database Design and Optimization</li></ul>',
'bar-chart', '$300 - $3000', '2-8 weeks', 1, 0, 10),

-- Cloud Services
('Cloud Solutions & Migration', 'cloud-solutions-migration', 'Modern cloud infrastructure solutions for scalable and secure business operations.',
'<p>Modernize your business with cloud technology. Our cloud solutions provide secure, scalable, and cost-effective infrastructure that grows with your business needs.</p><p>We help Sierra Leone businesses migrate to the cloud safely and efficiently, ensuring minimal disruption to operations.</p><h3>Cloud Services:</h3><ul><li>Cloud Infrastructure Setup</li><li>Data Migration and Backup</li><li>Cloud Security Implementation</li><li>Application Hosting</li><li>Disaster Recovery Planning</li><li>Cloud Cost Optimization</li><li>24/7 Cloud Monitoring</li></ul>',
'cloud', '$400 - $4000', '2-10 weeks', 1, 0, 11),

-- Cybersecurity
('Cybersecurity Solutions', 'cybersecurity-solutions', 'Protect your business from cyber threats with comprehensive security solutions.',
'<p>In an increasingly digital world, cybersecurity is essential for protecting your business data and customer information. Our security experts implement robust protection measures to safeguard your digital assets.</p><p>We provide comprehensive security audits and implement protection systems tailored for Sierra Leone businesses.</p><h3>Security Services:</h3><ul><li>Security Assessment and Auditing</li><li>Firewall and Network Security</li><li>Data Encryption and Protection</li><li>Employee Security Training</li><li>Incident Response Planning</li><li>Compliance and Regulatory Support</li><li>24/7 Security Monitoring</li></ul>',
'shield', '$250 - $2500', '1-6 weeks', 1, 0, 12),

-- AI & Automation
('AI & Automation Solutions', 'ai-automation-solutions', 'Innovative AI and automation technologies to streamline your business processes.',
'<p>Embrace the future with AI and automation solutions that improve efficiency and reduce operational costs. We implement smart technologies that automate repetitive tasks and provide intelligent insights.</p><p>Our AI solutions are designed for Sierra Leone businesses looking to gain a competitive advantage through technology innovation.</p><h3>AI & Automation Services:</h3><ul><li>Process Automation</li><li>Chatbot Development</li><li>Predictive Analytics</li><li>Document Processing Automation</li><li>Customer Service Automation</li><li>Inventory Management Automation</li><li>AI-Powered Business Insights</li></ul>',
'brain', '$500 - $6000', '3-16 weeks', 1, 1, 13),

-- Content Management
('Content Management Systems', 'content-management-systems', 'Easy-to-use content management solutions for websites and digital platforms.',
'<p>Take control of your website content with user-friendly content management systems. We build custom CMS solutions that make it easy for you to update, manage, and publish content without technical expertise.</p><p>Our CMS solutions are perfect for Sierra Leone businesses that want to maintain their online presence independently.</p><h3>CMS Features:</h3><ul><li>User-Friendly Content Editor</li><li>Multi-User Management</li><li>SEO-Optimized Content Structure</li><li>Media Management</li><li>Workflow and Publishing Controls</li><li>Mobile-Responsive Design</li><li>Security and Backup Systems</li></ul>',
'edit', '$400 - $2500', '2-8 weeks', 1, 0, 14),

-- Video Production
('Video Production & Editing', 'video-production-editing', 'Professional video production services for marketing, training, and entertainment content.',
'<p>Tell your story through compelling video content. Our video production team creates high-quality promotional videos, training materials, and entertainment content that engages your audience and enhances your brand.</p><p>We specialize in creating video content that resonates with Sierra Leone audiences and showcases local culture and values.</p><h3>Video Services:</h3><ul><li>Corporate Video Production</li><li>Marketing and Promotional Videos</li><li>Training and Educational Content</li><li>Event Coverage and Documentation</li><li>Animation and Motion Graphics</li><li>Video Editing and Post-Production</li><li>Social Media Video Content</li></ul>',
'video', '$300 - $3500', '1-6 weeks', 1, 1, 15),

-- Graphic Design
('Graphic Design & Branding', 'graphic-design-branding', 'Creative graphic design and branding services to establish your unique visual identity.',
'<p>Create a memorable brand identity with our professional graphic design services. We design logos, marketing materials, and brand assets that represent your business values and appeal to your target audience.</p><p>Our designs reflect Sierra Leone culture while meeting international standards for professionalism and quality.</p><h3>Design Services:</h3><ul><li>Logo and Brand Identity Design</li><li>Marketing Material Design</li><li>Website and Digital Graphics</li><li>Print Design and Layout</li><li>Packaging and Product Design</li><li>Social Media Graphics</li><li>Brand Guidelines Development</li></ul>',
'palette', '$100 - $1500', '1-4 weeks', 1, 0, 16),

-- IT Support
('IT Support & Maintenance', 'it-support-maintenance', 'Reliable IT support and maintenance services to keep your technology running smoothly.',
'<p>Keep your technology infrastructure running smoothly with our comprehensive IT support services. We provide ongoing maintenance, troubleshooting, and technical support to ensure your business operations continue without interruption.</p><p>Our support team understands the unique technology challenges faced by Sierra Leone businesses and provides practical, cost-effective solutions.</p><h3>IT Support Services:</h3><ul><li>Help Desk and Technical Support</li><li>Hardware Maintenance and Repair</li><li>Software Installation and Updates</li><li>Network Administration</li><li>Data Backup and Recovery</li><li>System Monitoring and Optimization</li><li>Emergency Technical Response</li></ul>',
'headphones', '$150 - $1000', 'Ongoing', 1, 0, 17),

-- Software Integration
('Software Integration Solutions', 'software-integration-solutions', 'Seamless integration of different software systems for improved business efficiency.',
'<p>Connect your business systems for maximum efficiency. Our software integration services help different applications work together seamlessly, eliminating data silos and improving workflow automation.</p><p>We specialize in integrating popular business software used by Sierra Leone companies, ensuring smooth data flow and improved productivity.</p><h3>Integration Services:</h3><ul><li>API Development and Integration</li><li>Database Synchronization</li><li>Third-Party Software Connectivity</li><li>Workflow Automation</li><li>Data Migration and Mapping</li><li>System Architecture Planning</li><li>Integration Testing and Validation</li></ul>',
'link', '$300 - $2500', '2-10 weeks', 1, 0, 18),

-- Quality Assurance
('Quality Assurance & Testing', 'quality-assurance-testing', 'Comprehensive software testing services to ensure your applications work flawlessly.',
'<p>Ensure your software works perfectly with our thorough quality assurance and testing services. We identify and fix issues before they reach your users, guaranteeing a smooth and reliable user experience.</p><p>Our testing methodology covers all aspects of software quality, from functionality to performance and security.</p><h3>QA & Testing Services:</h3><ul><li>Functional Testing</li><li>Performance and Load Testing</li><li>Security Testing</li><li>Mobile App Testing</li><li>User Acceptance Testing</li><li>Automated Testing Solutions</li><li>Bug Tracking and Resolution</li></ul>',
'check-circle', '$200 - $1500', '1-6 weeks', 1, 0, 19),

-- Project Management
('Project Management & Consulting', 'project-management-consulting', 'Professional project management services to ensure successful technology implementations.',
'<p>Ensure your technology projects succeed with our expert project management services. We provide structured planning, execution, and monitoring to deliver projects on time and within budget.</p><p>Our project managers have extensive experience with Sierra Leone business environment and understand local challenges and opportunities.</p><h3>Project Management Services:</h3><ul><li>Project Planning and Scheduling</li><li>Resource Management</li><li>Risk Assessment and Mitigation</li><li>Quality Control and Monitoring</li><li>Stakeholder Communication</li><li>Budget Management</li><li>Project Documentation and Reporting</li></ul>',
'clipboard-list', '$150 - $2000', '1-12 months', 1, 0, 20),

-- Blockchain & Fintech
('Blockchain & Fintech Solutions', 'blockchain-fintech-solutions', 'Innovative blockchain and financial technology solutions for modern businesses.',
'<p>Explore the future of finance with our blockchain and fintech solutions. We develop secure, transparent, and efficient financial applications that can revolutionize how businesses handle transactions and financial data.</p><p>Our fintech solutions are designed with Sierra Leone regulations and financial infrastructure in mind.</p><h3>Blockchain & Fintech Services:</h3><ul><li>Cryptocurrency Integration</li><li>Smart Contract Development</li><li>Digital Wallet Solutions</li><li>Payment Gateway Development</li><li>Financial Data Analytics</li><li>Regulatory Compliance Solutions</li><li>Blockchain Consulting</li></ul>',
'dollar-sign', '$800 - $8000', '4-20 weeks', 1, 1, 21)

ON DUPLICATE KEY UPDATE title = title;

-- Update existing services to mark some as popular for better display variety
UPDATE services SET popular = 1 WHERE slug IN (
    'digital-marketing-solutions',
    'ecommerce-development',
    'ai-automation-solutions',
    'video-production-editing',
    'blockchain-fintech-solutions'
);

-- Add more variety to existing services icons for better visual display
UPDATE services SET icon = 'fa-code' WHERE slug = 'custom-software-development';
UPDATE services SET icon = 'fa-mobile-alt' WHERE slug = 'mobile-app-development';
UPDATE services SET icon = 'fa-graduation-cap' WHERE slug = 'technology-training-programs';
UPDATE services SET icon = 'fa-briefcase' WHERE slug = 'business-consultancy';
UPDATE services SET icon = 'fa-camera' WHERE slug = 'photography-services';
UPDATE services SET icon = 'fa-globe' WHERE slug = 'web-design-development';
