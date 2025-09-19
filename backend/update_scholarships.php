<?php
$pdo = new PDO('mysql:host=localhost;port=4306;dbname=devco_db;charset=utf8mb4', 'root', '1212');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Update scholarship amounts to proper values
$updates = [
    ['15000', 'technology-excellence-scholarship'],
    ['12000', 'community-leadership-award'],
    ['8000', 'innovation-scholarship'],
    ['7500', 'updated-scholarship']
];

$stmt = $pdo->prepare('UPDATE scholarships SET amount = ? WHERE slug = ?');
foreach ($updates as $update) {
    $stmt->execute($update);
    echo "Updated {$update[1]} amount to {$update[0]}\n";
}

// Also set featured flag for some scholarships
$pdo->exec("UPDATE scholarships SET featured = 1 WHERE slug IN ('technology-excellence-scholarship', 'community-leadership-award')");
echo "Set featured scholarships\n";

// Verify the data
$stmt = $pdo->query("SELECT title, slug, amount, featured, status FROM scholarships");
$scholarships = $stmt->fetchAll();

echo "\nCurrent scholarships:\n";
foreach ($scholarships as $scholarship) {
    $featured = $scholarship['featured'] ? ' (Featured)' : '';
    echo "- {$scholarship['title']}: \${$scholarship['amount']} - {$scholarship['status']}{$featured}\n";
}

echo "\nDatabase updated successfully!\n";
?>
