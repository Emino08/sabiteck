<?php
try {
    $pdo = new PDO('mysql:host=localhost;port=4306;dbname=devco_db;charset=utf8mb4', 'root', '1212');
    
    // Create newsletter templates table
    $pdo->exec('
    CREATE TABLE IF NOT EXISTS newsletter_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        content LONGTEXT NOT NULL,
        template_type VARCHAR(50) DEFAULT "custom",
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )');
    
    // Create newsletter campaigns table
    $pdo->exec('
    CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        content LONGTEXT NOT NULL,
        template_id INT,
        recipients_count INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT "draft",
        scheduled_at TIMESTAMP NULL,
        sent_at TIMESTAMP NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES newsletter_templates(id),
        FOREIGN KEY (created_by) REFERENCES admin_users(id)
    )');
    
    // Check if columns exist before adding them
    $result = $pdo->query("SHOW COLUMNS FROM newsletter_subscribers LIKE 'tags'");
    if ($result->rowCount() == 0) {
        $pdo->exec('
        ALTER TABLE newsletter_subscribers 
        ADD COLUMN tags JSON,
        ADD COLUMN segment VARCHAR(100),
        ADD COLUMN preferences JSON,
        ADD COLUMN last_opened TIMESTAMP NULL,
        ADD COLUMN engagement_score INT DEFAULT 0
        ');
    }
    
    echo 'Enhanced newsletter tables created successfully!' . PHP_EOL;
    
    // Insert sample templates
    $pdo->exec("
    INSERT IGNORE INTO newsletter_templates (name, subject, content, template_type) VALUES
    ('Welcome Email', 'Welcome to DevCo Newsletter!', 
     '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;\"><h1 style=\"color: white; margin: 0;\">Welcome to DevCo!</h1></div><div style=\"padding: 30px 20px; background: white;\"><h2>Thank you for subscribing!</h2><p>We are excited to have you join our community.</p></div></div>', 'welcome'),
    ('Monthly Newsletter', 'DevCo Monthly Update', 
     '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><div style=\"background: #2d3748; padding: 20px; text-align: center;\"><h1 style=\"color: white; margin: 10px 0;\">Monthly Update</h1></div><div style=\"padding: 30px 20px; background: white;\">Monthly content goes here...</div></div>', 'monthly')
    ");
    
    echo 'Sample templates inserted!' . PHP_EOL;
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
?>