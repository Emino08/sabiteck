<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

$dbConfig = require __DIR__ . '/config/database.php';

try {
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $conn = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    
    echo "ALL TEAM MEMBERS DATA:\n";
    echo "=====================\n\n";
    
    $stmt = $conn->query("SELECT id, name, position, department, email, phone, location, skills FROM team ORDER BY id");
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($teams as $team) {
        echo "ID: {$team['id']}\n";
        echo "Name: {$team['name']}\n";
        echo "Position: {$team['position']}\n";
        echo "Department: " . ($team['department'] ? $team['department'] : "NULL") . "\n";
        echo "Email: " . ($team['email'] ? $team['email'] : "NULL") . "\n";
        echo "Phone: " . ($team['phone'] ? $team['phone'] : "NULL") . "\n";
        echo "Location: " . ($team['location'] ? $team['location'] : "NULL") . "\n";
        echo "Skills: " . ($team['skills'] ? substr($team['skills'], 0, 100) : "NULL") . "\n";
        echo str_repeat("-", 60) . "\n\n";
    }
    
    echo "\nTOTAL TEAM MEMBERS: " . count($teams) . "\n";
    
    // Check for NULL values
    $nullCount = ['department' => 0, 'phone' => 0, 'location' => 0];
    foreach ($teams as $team) {
        if (!$team['department']) $nullCount['department']++;
        if (!$team['phone']) $nullCount['phone']++;
        if (!$team['location']) $nullCount['location']++;
    }
    
    echo "\nNULL VALUE SUMMARY:\n";
    echo "Department NULL: {$nullCount['department']}\n";
    echo "Phone NULL: {$nullCount['phone']}\n";
    echo "Location NULL: {$nullCount['location']}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
