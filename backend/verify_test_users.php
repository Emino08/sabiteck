<?php
require_once __DIR__ . '/vendor/autoload.php';

// Database connection
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

echo "Checking test users in database...\n\n";

$stmt = $db->query("
    SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.status,
        r.name as role_name,
        SUBSTRING(u.password_hash, 1, 20) as hash_preview
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username LIKE 'test_%'
    ORDER BY u.id
");

$users = $stmt->fetchAll();

if (empty($users)) {
    echo "❌ No test users found in database!\n";
    echo "Run: php create_test_users_direct.php\n";
    exit(1);
}

echo "Found " . count($users) . " test users:\n\n";
echo str_pad("Username", 20) . str_pad("Email", 30) . str_pad("Role", 15) . str_pad("Role Name", 20) . "Status\n";
echo str_repeat("-", 100) . "\n";

foreach ($users as $user) {
    echo str_pad($user['username'], 20) . 
         str_pad($user['email'], 30) . 
         str_pad($user['role'], 15) . 
         str_pad($user['role_name'] ?? 'N/A', 20) . 
         $user['status'] . "\n";
}

echo "\n";

// Test password verification
$testPassword = 'Test123!';
echo "Testing password verification with: $testPassword\n\n";

foreach ($users as $user) {
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();
    
    $isValid = password_verify($testPassword, $userData['password_hash']);
    
    $status = $isValid ? "✅ VALID" : "❌ INVALID";
    echo "$status - {$user['username']}\n";
}

echo "\n";

// Test a login attempt
echo "Testing login API call for test_blogger...\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8002/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'username' => 'test_blogger',
    'password' => 'Test123!'
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response:\n";
print_r(json_decode($response, true));

?>
