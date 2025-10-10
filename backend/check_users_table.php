<?php
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$stmt = $db->query("SHOW COLUMNS FROM users");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Users table structure:\n";
foreach ($columns as $col) {
    echo "  {$col['Field']}: {$col['Type']} - {$col['Null']} - {$col['Default']}\n";
}

// Check if we need to alter role column
$stmt = $db->query("SHOW COLUMNS FROM users LIKE 'role'");
$roleCol = $stmt->fetch(PDO::FETCH_ASSOC);

if ($roleCol && strpos($roleCol['Type'], 'enum') !== false) {
    echo "\nRole column is ENUM - converting to VARCHAR...\n";
    $db->exec("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'user'");
    echo "✓ Role column updated to VARCHAR\n";
}
