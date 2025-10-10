<?php
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== Roles Table Structure ===\n";
$stmt = $db->query('DESCRIBE roles');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Sample Roles ===\n";
$stmt = $db->query('SELECT * FROM roles LIMIT 5');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
