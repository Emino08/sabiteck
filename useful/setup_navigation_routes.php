<?php
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

try {
    // Database connection
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Connected to database successfully.\n";

    // Clear existing route settings to avoid duplicates
    $pdo->exec("DELETE FROM route_settings");
    echo "Cleared existing route settings.\n";

    // Navigation routes based on the current frontend navigation structure
    $navigationRoutes = [
        // Main navigation routes with proper display order
        ['home', 1, 'Home', 'Main landing page of the website', 1],
        ['about', 1, 'About Us', 'Our story, mission & vision', 2],
        ['services', 1, 'Services', 'Our comprehensive service offerings', 3],
        ['portfolio', 1, 'Portfolio', 'Showcase of our work & case studies', 4],
        ['team', 1, 'Our Team', 'Meet our talented professionals', 5],
        ['jobs', 1, 'Career Opportunities', 'Current job openings and careers', 6],
        ['scholarships', 1, 'Scholarships', 'Educational funding opportunities', 7],
        ['announcements', 1, 'Announcements', 'Latest news & company updates', 8],
        ['contact', 1, 'Contact Us', 'Get in touch with our team', 9],

        // Service-specific pages (sub-navigation)
        ['study-abroad', 1, 'Study Abroad', 'International education guidance', 10],
        ['business-intelligence', 1, 'Business Intelligence', 'Data-driven insights and analytics', 11],
        ['consulting', 1, 'Business Consulting', 'Strategic business advice and consulting', 12],
        ['internships', 1, 'Internship Programs', 'Professional development and training', 13],

        // Analytics page for admin
        ['analytics', 1, 'Analytics Dashboard', 'Website and business analytics', 14]
    ];

    // Insert navigation routes
    $stmt = $pdo->prepare("
        INSERT INTO route_settings (route_name, is_visible, display_name, description, display_order)
        VALUES (?, ?, ?, ?, ?)
    ");

    foreach ($navigationRoutes as $route) {
        $stmt->execute($route);
        echo "Inserted route: {$route[0]} - {$route[2]}\n";
    }

    echo "\nNavigation routes setup completed successfully!\n";
    echo "Total routes inserted: " . count($navigationRoutes) . "\n";

    // Verify the insertion
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM route_settings");
    $result = $stmt->fetch();
    echo "Total routes in database: {$result['total']}\n";

    // Show all inserted routes
    echo "\nAll routes in database:\n";
    $stmt = $pdo->query("SELECT route_name, display_name, is_visible, display_order FROM route_settings ORDER BY display_order");
    $routes = $stmt->fetchAll();

    foreach ($routes as $route) {
        $status = $route['is_visible'] ? 'Visible' : 'Hidden';
        echo "- {$route['route_name']}: {$route['display_name']} ({$status}) [Order: {$route['display_order']}]\n";
    }

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
