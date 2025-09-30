<?php
try {
    $pdo = new PDO('mysql:host=localhost;port=4306;dbname=devco_db;charset=utf8mb4', 'root', '1212');
    
    // Check if columns exist before adding them
    $result = $pdo->query("SHOW COLUMNS FROM content LIKE 'category'");
    if ($result->rowCount() == 0) {
        $pdo->exec('ALTER TABLE content 
            ADD COLUMN category VARCHAR(100),
            ADD COLUMN featured_image VARCHAR(500),
            ADD COLUMN gallery JSON,
            ADD COLUMN author VARCHAR(255),
            ADD COLUMN tags JSON,
            ADD COLUMN meta_description TEXT,
            ADD COLUMN views INT DEFAULT 0
        ');
    }
    
    // Insert sample blog content
    $pdo->exec("
    INSERT INTO content (title, slug, content_type, content, excerpt, category, featured_image, author, tags, published) VALUES
    ('The Future of AI in Software Development', 'future-ai-software-development', 'blog', 
     'Artificial Intelligence is revolutionizing the way we develop software. From automated code generation to intelligent debugging, AI tools are becoming indispensable for modern developers. This comprehensive guide explores the current state of AI in software development and what the future holds.', 
     'Explore how AI is transforming software development processes', 'Technology', 
     'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop', 
     'John Smith', '[\"AI\", \"Development\", \"Technology\"]', 1),
    ('DevCo Launches New Mobile App Development Service', 'devco-launches-mobile-app-service', 'news',
     'We are excited to announce our new mobile app development service, offering cross-platform solutions for businesses of all sizes. Our expert team specializes in React Native and Flutter development.', 
     'DevCo expands services with new mobile app development offerings', 'Company News',
     'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop',
     'DevCo Team', '[\"Mobile\", \"Apps\", \"Services\"]', 1),
    ('Best Practices for Modern Web Development', 'best-practices-modern-web-development', 'blog',
     'Modern web development requires a solid understanding of current best practices. From responsive design to performance optimization, here are the key principles every developer should follow.', 
     'Learn essential best practices for modern web development', 'Development',
     'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
     'Sarah Johnson', '[\"Web Development\", \"Best Practices\", \"Modern\"]', 1),
    ('New Partnership with Tech Giants', 'new-partnership-tech-giants', 'news',
     'DevCo is proud to announce strategic partnerships with leading technology companies to enhance our service offerings and provide cutting-edge solutions to our clients.', 
     'DevCo announces strategic partnerships with major tech companies', 'Partnership',
     'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
     'DevCo Team', '[\"Partnership\", \"Business\", \"Growth\"]', 1),
    ('Understanding Cloud Architecture Patterns', 'understanding-cloud-architecture-patterns', 'blog',
     'Cloud architecture patterns are fundamental to building scalable, reliable applications. This article explores the most important patterns and when to use them.', 
     'A comprehensive guide to cloud architecture patterns', 'Cloud Computing',
     'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=400&fit=crop',
     'Michael Chen', '[\"Cloud\", \"Architecture\", \"Patterns\"]', 1)
    ");
    
    echo 'Enhanced content structure created with sample data!' . PHP_EOL;
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
?>