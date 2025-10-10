<?php
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== All Permissions in System ===\n";
$stmt = $db->query("SELECT name, category, display_name FROM permissions ORDER BY category, name");
$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

$categories = [];
foreach ($permissions as $perm) {
    $cat = $perm['category'];
    if (!isset($categories[$cat])) {
        $categories[$cat] = [];
    }
    $categories[$cat][] = $perm['name'];
}

foreach ($categories as $category => $perms) {
    echo "\n$category:\n";
    foreach ($perms as $perm) {
        echo "  - $perm\n";
    }
}

echo "\n\n=== Permission Categories ===\n";
foreach (array_keys($categories) as $cat) {
    echo "- $cat\n";
}

echo "\n\n=== Required Tab Permissions ===\n";
$tabPermissions = [
    'overview' => ['view-dashboard'],
    'content' => ['view-content'],
    'services' => ['view-services'],
    'portfolio' => ['view-portfolio'],
    'about' => ['view-content'],
    'team' => ['view-team'],
    'announcements' => ['view-announcements'],
    'jobs' => ['view-jobs'],
    'scholarships' => ['view-scholarships'],
    'organizations' => ['view-organizations'],
    'analytics' => ['view-analytics'],
    'newsletter' => ['view-newsletter'],
    'tools-management' => ['view-tools'],
    'roles' => ['view-users', 'manage-user-permissions'],
    'routes' => ['edit-settings'],
    'settings' => ['view-settings']
];

foreach ($tabPermissions as $tab => $perms) {
    echo "\n$tab:\n";
    foreach ($perms as $perm) {
        // Check if permission exists
        $exists = false;
        foreach ($permissions as $p) {
            if ($p['name'] === $perm) {
                $exists = true;
                break;
            }
        }
        $status = $exists ? "✅" : "❌";
        echo "  $status $perm\n";
    }
}

echo "\n\n=== Missing Permissions ===\n";
$requiredPerms = [];
foreach ($tabPermissions as $perms) {
    foreach ($perms as $perm) {
        $requiredPerms[] = $perm;
    }
}
$requiredPerms = array_unique($requiredPerms);

$existingPerms = array_column($permissions, 'name');
$missing = array_diff($requiredPerms, $existingPerms);

if (empty($missing)) {
    echo "✅ All required permissions exist!\n";
} else {
    echo "❌ Missing permissions:\n";
    foreach ($missing as $m) {
        echo "  - $m\n";
    }
}
