<?php
require_once __DIR__ . '/vendor/autoload.php';

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);

echo "Checking and fixing test user roles...\n\n";

// Check current state
$stmt = $db->query("SELECT username, role, role_id FROM users WHERE username LIKE 'test_%'");
$users = $stmt->fetchAll();

echo "BEFORE FIX:\n";
foreach ($users as $user) {
    echo "  {$user['username']}: role='{$user['role']}', role_id={$user['role_id']}\n";
}

// Fix the roles
echo "\nFixing roles to 'admin'...\n";
$stmt = $db->prepare("UPDATE users SET role = 'admin' WHERE username LIKE 'test_%' AND role != 'admin'");
$stmt->execute();
$affected = $stmt->rowCount();
echo "Updated $affected users\n\n";

// Verify
$stmt = $db->query("SELECT username, role, role_id FROM users WHERE username LIKE 'test_%'");
$users = $stmt->fetchAll();

echo "AFTER FIX:\n";
foreach ($users as $user) {
    echo "  {$user['username']}: role='{$user['role']}', role_id={$user['role_id']}\n";
}

echo "\n✅ All test users now have role='admin'\n";

?>
