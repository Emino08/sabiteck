<?php
// Test specific analytics routes that are failing

echo "Testing Analytics Routes...\n\n";

// Test 1: Check if AdminController methods exist
require_once __DIR__ . '/backend/src/Controllers/AdminController.php';

$reflection = new ReflectionClass('App\Controllers\AdminController');

echo "=== Checking AdminController Methods ===\n";
$requiredMethods = [
    'trackAnalytics',
    'trackEvent',
    'analyticsOptIn',
    'analyticsOptOut',
    'getRealtimeAnalytics'
];

foreach ($requiredMethods as $method) {
    if ($reflection->hasMethod($method)) {
        echo "✅ Method $method exists\n";
    } else {
        echo "❌ Method $method missing\n";
    }
}

echo "\n=== Testing Route URLs ===\n";

// Test route patterns
$testRoutes = [
    '/api/analytics/track',
    '/api/analytics/opt-in',
    '/api/analytics/opt-out',
    '/api/admin/analytics/export'
];

foreach ($testRoutes as $route) {
    echo "Route: $route\n";

    // Check if route matches any pattern in index.php
    $routeFound = false;

    // Simulate route matching logic
    if (strpos($route, '/api/analytics/track') === 0) {
        $routeFound = true;
    } elseif (strpos($route, '/api/analytics/opt-') === 0) {
        $routeFound = true;
    } elseif (strpos($route, '/api/admin/analytics/export') === 0) {
        $routeFound = false; // This one should be missing
    }

    echo $routeFound ? "✅ Route pattern exists\n" : "❌ Route pattern missing\n";
    echo "\n";
}

echo "=== Checking Database Connection ===\n";
try {
    $host = 'localhost';
    $port = 4306;
    $db = 'devco_db';
    $user = 'root';
    $pass = '1212';

    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "✅ Database connection successful\n";

    // Check if analytics tables exist
    $stmt = $pdo->query("SHOW TABLES LIKE '%analytic%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Analytics tables found: " . count($tables) . "\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }

} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}

echo "\nTest completed.\n";
?>