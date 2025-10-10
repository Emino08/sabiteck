<?php
/**
 * Test blogger user permissions and what they should see in the admin panel
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "=== BLOGGER ROLE ANALYSIS ===\n\n";

// Get blogger role info
$stmt = $db->query("SELECT * FROM roles WHERE name = 'blogger'");
$bloggerRole = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bloggerRole) {
    echo "ERROR: Blogger role not found!\n";
    exit(1);
}

echo "Blogger Role ID: {$bloggerRole['id']}\n";
echo "Role Name: {$bloggerRole['name']}\n";
echo "Display Name: {$bloggerRole['display_name']}\n\n";

// Get blogger permissions
$stmt = $db->query("
    SELECT p.name, p.display_name, p.module
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = {$bloggerRole['id']}
    ORDER BY p.module, p.name
");

$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== BLOGGER PERMISSIONS (" . count($permissions) . " total) ===\n";
$byModule = [];
foreach ($permissions as $perm) {
    $module = $perm['module'] ?: 'general';
    if (!isset($byModule[$module])) {
        $byModule[$module] = [];
    }
    $byModule[$module][] = $perm;
}

foreach ($byModule as $module => $perms) {
    echo "\n[$module]\n";
    foreach ($perms as $perm) {
        echo "  - {$perm['name']}\n";
    }
}

echo "\n\n=== ADMIN TABS BLOGGER SHOULD SEE ===\n";

// Define admin tabs with their requirements (from Admin.jsx)
$adminTabs = [
    ['id' => 'overview', 'label' => 'Overview', 'permissions' => ['dashboard.view']],
    ['id' => 'content', 'label' => 'Content', 'permissions' => ['content.view']],
    ['id' => 'services', 'label' => 'Services', 'permissions' => ['services.view']],
    ['id' => 'portfolio', 'label' => 'Portfolio', 'permissions' => ['portfolio.view']],
    ['id' => 'about', 'label' => 'About', 'permissions' => ['about.view']],
    ['id' => 'team', 'label' => 'Team', 'permissions' => ['team.view']],
    ['id' => 'announcements', 'label' => 'Announcements', 'permissions' => ['announcements.view']],
    ['id' => 'jobs', 'label' => 'Jobs', 'permissions' => ['jobs.view']],
    ['id' => 'scholarships', 'label' => 'Scholarships', 'permissions' => ['scholarships.view']],
    ['id' => 'organizations', 'label' => 'Organizations', 'permissions' => ['organizations.view']],
    ['id' => 'analytics', 'label' => 'Analytics', 'permissions' => ['analytics.view']],
    ['id' => 'newsletter', 'label' => 'Newsletter', 'permissions' => ['newsletter.view']],
    ['id' => 'tools-management', 'label' => 'Tools & Curriculum', 'permissions' => ['tools.use', 'system.settings']],
    ['id' => 'roles', 'label' => 'User Roles', 'permissions' => ['users.create', 'roles.manage']],
    ['id' => 'routes', 'label' => 'Navigation', 'permissions' => ['system.settings']],
    ['id' => 'settings', 'label' => 'Settings', 'permissions' => ['settings.edit', 'system.settings']]
];

$permissionNames = array_column($permissions, 'name');

$accessibleTabs = [];
$blockedTabs = [];

foreach ($adminTabs as $tab) {
    $hasAccess = false;
    foreach ($tab['permissions'] as $requiredPerm) {
        if (in_array($requiredPerm, $permissionNames)) {
            $hasAccess = true;
            break; // ANY permission grants access (not ALL)
        }
    }
    
    if ($hasAccess) {
        $accessibleTabs[] = $tab;
    } else {
        $blockedTabs[] = $tab;
    }
}

echo "\nTabs Blogger SHOULD SEE (" . count($accessibleTabs) . "):\n";
foreach ($accessibleTabs as $tab) {
    echo "  ✓ {$tab['label']} (requires: " . implode(' OR ', $tab['permissions']) . ")\n";
}

echo "\nTabs Blogger SHOULD NOT SEE (" . count($blockedTabs) . "):\n";
foreach ($blockedTabs as $tab) {
    echo "  ✗ {$tab['label']} (requires: " . implode(' OR ', $tab['permissions']) . ")\n";
}

// Check for test blogger user
echo "\n\n=== CHECKING FOR TEST BLOGGER USER ===\n";
$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'blogger' OR u.role = 'blogger'
    LIMIT 5
");
$bloggerUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($bloggerUsers) > 0) {
    echo "Found " . count($bloggerUsers) . " blogger user(s):\n";
    foreach ($bloggerUsers as $user) {
        echo "  - ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}\n";
        echo "    Role: {$user['role']}, Role Name: {$user['role_name']}\n";
    }
} else {
    echo "No blogger users found in database.\n";
    echo "\nCreate a test blogger user by running:\n";
    echo "php backend/create_blogger_user.php\n";
}

echo "\n\n=== EXPECTED BEHAVIOR ===\n";
echo "When a blogger logs in:\n";
echo "1. They should see ONLY these tabs:\n";
foreach ($accessibleTabs as $tab) {
    echo "   - {$tab['label']}\n";
}
echo "\n2. They should NOT see:\n";
foreach ($blockedTabs as $tab) {
    echo "   - {$tab['label']}\n";
}
echo "\n3. Public navigation (Header) should show ALL enabled routes\n";
echo "4. Admin panel tabs should be filtered by permissions\n";

echo "\n\n=== ISSUE DIAGNOSIS ===\n";
echo "If blogger is seeing ALL tabs:\n";
echo "1. Check if Admin.jsx is properly filtering tabs (lines 194-224)\n";
echo "2. Verify user.permissions array is being populated on login\n";
echo "3. Check AuthContext login function receives permissions correctly\n";
echo "4. Ensure localStorage has correct user.permissions\n";
echo "\nRun this to check current logged-in user:\n";
echo "Open browser console → localStorage.getItem('user') → Check permissions array\n";
