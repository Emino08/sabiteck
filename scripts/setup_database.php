<?php
// Database Setup Script for DevCo Website

require_once __DIR__ . '/../backend/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../backend');
$dotenv->safeLoad();

try {
    // Create database directory if it doesn't exist
    $dbDir = __DIR__ . '/../database';
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0755, true);
        echo "✅ Created database directory\n";
    }
    
    // Create SQLite database
    $dbPath = $dbDir . '/devco.db';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to SQLite database\n";
    
    // Read and execute migration
    $migrationFile = __DIR__ . '/../backend/migrations/001_initial_schema_sqlite.sql';
    $sql = file_get_contents($migrationFile);
    
    // Split SQL by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && strpos($statement, '--') !== 0) {
            $pdo->exec($statement);
        }
    }
    
    echo "✅ Database schema created successfully\n";
    echo "✅ Sample data inserted\n";
    
    // Test the connection by counting records
    $result = $pdo->query("SELECT COUNT(*) as count FROM admin_users");
    $count = $result->fetch()['count'];
    echo "✅ Admin users: $count\n";
    
    $result = $pdo->query("SELECT COUNT(*) as count FROM content");
    $count = $result->fetch()['count'];
    echo "✅ Content items: $count\n";
    
    $result = $pdo->query("SELECT COUNT(*) as count FROM newsletter_subscribers");
    $count = $result->fetch()['count'];
    echo "✅ Newsletter subscribers: $count\n";
    
    echo "\n🎉 Database setup completed successfully!\n";
    echo "Default admin credentials:\n";
    echo "  Username: admin\n";
    echo "  Password: admin123\n";
    
} catch (Exception $e) {
    echo "❌ Error setting up database: " . $e->getMessage() . "\n";
    exit(1);
}