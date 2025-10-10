<?php
/**
 * Audit all users for role inconsistencies
 * Finds users where role column doesn't match role_id reference
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== USER ROLE CONSISTENCY AUDIT ===\n\n";

// Get all users with role info
$stmt = $db->query("
    SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role as role_column,
        u.role_id,
        r.name as actual_role_name,
        r.display_name as role_display_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.id
");

$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total users: " . count($users) . "\n\n";

$inconsistent = [];
$consistent = [];

foreach ($users as $user) {
    $isInconsistent = ($user['role_column'] !== $user['actual_role_name']);
    
    if ($isInconsistent) {
        $inconsistent[] = $user;
    } else {
        $consistent[] = $user;
    }
}

if (count($inconsistent) > 0) {
    echo "❌ INCONSISTENT USERS (" . count($inconsistent) . "):\n";
    echo str_repeat("=", 80) . "\n\n";
    
    foreach ($inconsistent as $user) {
        echo "User ID: {$user['id']}\n";
        echo "  Username: {$user['username']}\n";
        echo "  Email: {$user['email']}\n";
        echo "  ❌ role column: '{$user['role_column']}'\n";
        echo "  ❌ role_id: {$user['role_id']} → '{$user['actual_role_name']}'\n";
        echo "  Status: MISMATCH - role should be '{$user['actual_role_name']}'\n";
        echo "\n";
    }
    
    echo "\n=== FIX RECOMMENDATION ===\n";
    echo "Run the following SQL to fix inconsistent users:\n\n";
    
    foreach ($inconsistent as $user) {
        echo "UPDATE users SET role = '{$user['actual_role_name']}' WHERE id = {$user['id']}; ";
        echo "-- Fix {$user['username']}\n";
    }
    
    echo "\nOr run: php fix-all-user-roles.php\n";
} else {
    echo "✅ ALL USERS HAVE CONSISTENT ROLES!\n";
}

echo "\n\n✅ CONSISTENT USERS (" . count($consistent) . "):\n";
echo str_repeat("=", 80) . "\n\n";

$roleGroups = [];
foreach ($consistent as $user) {
    $role = $user['actual_role_name'];
    if (!isset($roleGroups[$role])) {
        $roleGroups[$role] = [];
    }
    $roleGroups[$role][] = $user;
}

foreach ($roleGroups as $role => $users) {
    echo "[$role] - " . count($users) . " user(s)\n";
    foreach ($users as $user) {
        echo "  ✓ {$user['username']} (ID: {$user['id']}, Email: {$user['email']})\n";
    }
    echo "\n";
}

echo "\n=== ROLE DISTRIBUTION ===\n";
$stmt = $db->query("
    SELECT r.name, r.display_name, COUNT(u.id) as user_count
    FROM roles r
    LEFT JOIN users u ON r.id = u.role_id
    GROUP BY r.id, r.name, r.display_name
    ORDER BY user_count DESC
");

$roleStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($roleStats as $stat) {
    $bar = str_repeat("█", min(50, $stat['user_count']));
    echo sprintf("%-20s [%3d users] %s\n", $stat['name'], $stat['user_count'], $bar);
}

echo "\n\n=== AUDIT COMPLETE ===\n";

if (count($inconsistent) > 0) {
    echo "⚠️  Action Required: Fix " . count($inconsistent) . " inconsistent user(s)\n";
    exit(1);
} else {
    echo "✅ All users have consistent role assignments\n";
    exit(0);
}
