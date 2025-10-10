<?php
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$stmt = $db->query('SHOW COLUMNS FROM user_permissions');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "user_permissions table structure:\n";
foreach ($columns as $col) {
    echo "  {$col['Field']} - {$col['Type']}\n";
}
