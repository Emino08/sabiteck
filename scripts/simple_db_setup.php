<?php
// Simple Database Setup Script

$dbPath = __DIR__ . '/../database/devco.db';

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Setting up database...\n";
    
    // Create contacts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Create newsletter_subscribers table
    $pdo->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
    )");
    
    // Create admin_users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Create content table
    $pdo->exec("CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('page', 'blog', 'service', 'portfolio')),
        published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Insert default admin user
    $pdo->exec("INSERT OR IGNORE INTO admin_users (username, password_hash, email) VALUES 
        ('admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@devco.com')");
    
    // Insert sample content
    $pdo->exec("INSERT OR IGNORE INTO content (title, slug, content, type) VALUES 
        ('Welcome to DevCo', 'welcome-to-devco', 'We are a leading software development company specializing in modern web and mobile applications.', 'page')");
    
    // Insert sample newsletter subscribers
    $pdo->exec("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES 
        ('john@example.com'), ('jane@example.com'), ('mike@example.com')");
    
    echo "✅ Database setup completed!\n";
    echo "✅ Tables created successfully\n";
    echo "✅ Sample data inserted\n";
    echo "\nDefault admin login:\n";
    echo "Username: admin\n";
    echo "Password: admin123\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}