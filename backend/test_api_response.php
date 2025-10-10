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
    
    echo "===========================================\n";
    echo "TEST API ENDPOINT: /api/admin/team/1\n";
    echo "===========================================\n\n";
    
    // Simulate what the TeamMemberController->getOne() does
    $id = 1;
    $stmt = $conn->prepare("SELECT * FROM team WHERE id = ?");
    $stmt->execute([$id]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$member) {
        echo "ERROR: Team member not found\n";
        exit(1);
    }
    
    // Parse JSON fields (simulating controller behavior)
    $member['skills'] = json_decode($member['skills'] ?? '[]', true);
    $member['social_links'] = json_decode($member['social_links'] ?? '{}', true);
    
    echo "RAW API RESPONSE:\n";
    echo "================\n";
    print_r($member);
    
    echo "\n\nKEY FIELDS CHECK:\n";
    echo "=================\n";
    echo "ID: " . ($member['id'] ?? 'MISSING') . "\n";
    echo "Name: " . ($member['name'] ?? 'MISSING') . "\n";
    echo "Position: " . ($member['position'] ?? 'MISSING') . "\n";
    echo "Department: " . ($member['department'] ?? 'MISSING') . " " . (empty($member['department']) ? "❌ EMPTY/NULL" : "✅ HAS VALUE") . "\n";
    echo "Email: " . ($member['email'] ?? 'MISSING') . " " . (empty($member['email']) ? "❌ EMPTY/NULL" : "✅ HAS VALUE") . "\n";
    echo "Phone: " . ($member['phone'] ?? 'MISSING') . " " . (empty($member['phone']) ? "❌ EMPTY/NULL" : "✅ HAS VALUE") . "\n";
    echo "Location: " . ($member['location'] ?? 'MISSING') . " " . (empty($member['location']) ? "❌ EMPTY/NULL" : "✅ HAS VALUE") . "\n";
    
    echo "\n\nJSON RESPONSE (as API would return):\n";
    echo "====================================\n";
    echo json_encode([
        'success' => true,
        'data' => $member
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    echo "\n\n";
    
    // Now test ALL team members
    echo "===========================================\n";
    echo "TEST API ENDPOINT: /api/admin/team (ALL)\n";
    echo "===========================================\n\n";
    
    $stmt = $conn->query("SELECT * FROM team ORDER BY sort_order ASC, featured DESC, created_at DESC");
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($members as &$member) {
        $member['skills'] = json_decode($member['skills'] ?? '[]', true);
        $member['social_links'] = json_decode($member['social_links'] ?? '{}', true);
    }
    
    echo "TOTAL MEMBERS: " . count($members) . "\n\n";
    
    foreach ($members as $member) {
        echo "ID {$member['id']}: {$member['name']}\n";
        echo "  Phone: " . ($member['phone'] ?? 'NULL') . " " . (empty($member['phone']) ? "❌" : "✅") . "\n";
        echo "  Location: " . ($member['location'] ?? 'NULL') . " " . (empty($member['location']) ? "❌" : "✅") . "\n";
        echo "  Department: " . ($member['department'] ?? 'NULL') . " " . (empty($member['department']) ? "❌" : "✅") . "\n";
        echo "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
