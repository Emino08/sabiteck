<?php
/**
 * Verify Blogger Role Configuration
 * Ensures blogger sees ONLY: Content, Jobs, Scholarships, Newsletter (plus Overview)
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "╔════════════════════════════════════════════╗\n";
echo "║   Blogger Role Verification                ║\n";
echo "╚════════════════════════════════════════════╝\n\n";

// Get blogger role
$stmt = $db->query("SELECT * FROM roles WHERE name = 'blogger'");
$blogger = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Role: {$blogger['display_name']}\n";
echo "Description: {$blogger['description']}\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Get permissions
$stmt = $db->prepare("
    SELECT p.name, p.display_name, p.module
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.module, p.name
");
$stmt->execute([$blogger['id']]);
$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Permissions (" . count($permissions) . "):\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$byModule = [];
foreach ($permissions as $perm) {
    $module = $perm['module'];
    if (!isset($byModule[$module])) {
        $byModule[$module] = [];
    }
    $byModule[$module][] = $perm;
}

foreach ($byModule as $module => $perms) {
    echo "\n[$module]\n";
    foreach ($perms as $perm) {
        echo "  ✓ {$perm['name']}\n";
    }
}

echo "\n\nFrontend Tab Visibility:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

// Define what tabs exist and their requirements
$tabs = [
    ['name' => 'Overview', 'permission' => 'dashboard.view', 'module' => 'dashboard'],
    ['name' => 'Content', 'permission' => 'content.view', 'module' => 'content'],
    ['name' => 'Services', 'permission' => 'services.view', 'module' => 'content'],
    ['name' => 'Portfolio', 'permission' => 'portfolio.view', 'module' => 'content'],
    ['name' => 'About', 'permission' => 'about.view', 'module' => 'content'],
    ['name' => 'Team', 'permission' => 'team.view', 'module' => 'team'],
    ['name' => 'Announcements', 'permission' => 'announcements.view', 'module' => 'announcements'],
    ['name' => 'Jobs', 'permission' => 'jobs.view', 'module' => 'jobs'],
    ['name' => 'Scholarships', 'permission' => 'scholarships.view', 'module' => 'scholarships'],
    ['name' => 'Organizations', 'permission' => 'organizations.view', 'module' => 'organizations'],
    ['name' => 'Analytics', 'permission' => 'analytics.view', 'module' => 'analytics'],
    ['name' => 'Newsletter', 'permission' => 'newsletter.view', 'module' => 'newsletter'],
    ['name' => 'Tools', 'permission' => 'tools.view', 'module' => 'tools'],
    ['name' => 'User Roles', 'permission' => 'users.view', 'module' => 'users'],
    ['name' => 'Routes', 'permission' => 'settings.edit', 'module' => 'settings'],
    ['name' => 'Settings', 'permission' => 'settings.view', 'module' => 'settings'],
];

$visibleTabs = [];
$hiddenTabs = [];
$permissionNames = array_column($permissions, 'name');
$moduleNames = array_column($permissions, 'module');

foreach ($tabs as $tab) {
    $hasPermission = in_array($tab['permission'], $permissionNames);
    $hasModule = in_array($tab['module'], $moduleNames);
    
    if ($hasPermission && $hasModule) {
        $visibleTabs[] = $tab['name'];
        echo "✓ {$tab['name']} (has {$tab['permission']})\n";
    } else {
        $hiddenTabs[] = $tab['name'];
        echo "✗ {$tab['name']} (missing {$tab['permission']})\n";
    }
}

echo "\n\n╔════════════════════════════════════════════╗\n";
echo "║   Summary                                  ║\n";
echo "╚════════════════════════════════════════════╝\n\n";

echo "✅ VISIBLE TABS (" . count($visibleTabs) . "):\n";
foreach ($visibleTabs as $tab) {
    echo "   • $tab\n";
}

echo "\n❌ HIDDEN TABS (" . count($hiddenTabs) . "):\n";
foreach ($hiddenTabs as $tab) {
    echo "   • $tab\n";
}

echo "\n\n📋 Expected for Blogger Role:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Based on: 'Focuses on creating, updating, and publishing \n";
echo "          website content, blogs, news, jobs, scholarships, newsletter'\n\n";

$expectedVisible = ['Overview', 'Content', 'Jobs', 'Scholarships', 'Newsletter'];
$shouldBeHidden = ['Services', 'Portfolio', 'About', 'Team', 'Announcements', 
                   'Organizations', 'Analytics', 'Tools', 'User Roles', 'Routes', 'Settings'];

$allCorrect = true;

echo "Should be VISIBLE:\n";
foreach ($expectedVisible as $expected) {
    $isVisible = in_array($expected, $visibleTabs);
    echo ($isVisible ? "  ✓" : "  ✗") . " $expected\n";
    if (!$isVisible) $allCorrect = false;
}

echo "\nShould be HIDDEN:\n";
foreach ($shouldBeHidden as $expected) {
    $isHidden = in_array($expected, $hiddenTabs);
    echo ($isHidden ? "  ✓" : "  ✗") . " $expected\n";
    if (!$isHidden) $allCorrect = false;
}

echo "\n";
if ($allCorrect) {
    echo "╔════════════════════════════════════════════╗\n";
    echo "║   ✅ CONFIGURATION CORRECT!               ║\n";
    echo "║   Blogger role properly configured         ║\n";
    echo "╚════════════════════════════════════════════╝\n";
} else {
    echo "╔════════════════════════════════════════════╗\n";
    echo "║   ⚠️  CONFIGURATION ISSUES FOUND          ║\n";
    echo "║   Please review the permissions above      ║\n";
    echo "╚════════════════════════════════════════════╝\n";
}

echo "\n📝 Action Required:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Blogger users must LOGOUT\n";
echo "2. Then LOGIN again\n";
echo "3. They should see ONLY the 5 expected tabs\n";
echo "4. All other tabs should be hidden\n\n";
