<?php
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== Checking Admin Users ===\n";
$stmt = $db->query("SELECT u.id, u.username, u.email, r.name as role, r.id as role_id FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE r.name IN ('admin', 'super_admin') LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== Checking Admin Role Permissions ===\n";
$stmt = $db->query("SELECT COUNT(*) as perm_count FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'admin'");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Admin role permissions count: " . $result['perm_count'] . "\n";

echo "\n=== Checking All Permissions ===\n";
$stmt = $db->query("SELECT COUNT(*) as total FROM permissions");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Total permissions in system: " . $result['total'] . "\n";

echo "\n=== Testing Admin Login ===\n";
$stmt = $db->query("SELECT username, email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1");
$admin = $stmt->fetch(PDO::FETCH_ASSOC);
if ($admin) {
    echo "Admin found: {$admin['username']} / {$admin['email']}\n";
    echo "Try logging in with this username and a password you know.\n";
} else {
    echo "No admin user found!\n";
}
