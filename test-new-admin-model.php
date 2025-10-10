#!/usr/bin/env php
<?php
/**
 * Test new admin model: All staff have role='admin', permissions vary by role_name
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║     NEW ADMIN MODEL - VERIFICATION TEST                         ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

// Test 1: Verify Database Structure
echo "TEST 1: Database Structure\n";
echo str_repeat("─", 70) . "\n";

$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role = 'admin'
    ORDER BY u.id
");
$adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Users with role='admin' (" . count($adminUsers) . "):\n";
foreach ($adminUsers as $user) {
    echo "  - {$user['username']}: role='admin', role_name='{$user['role_name']}'\n";
}

if (count($adminUsers) >= 2) {
    echo "\n✅ PASS: Multiple staff users have role='admin'\n";
} else {
    echo "\n❌ FAIL: Expected multiple admin users\n";
    exit(1);
}
echo "\n";

// Test 2: Blogger Specific Check
echo "TEST 2: Blogger User Configuration\n";
echo str_repeat("─", 70) . "\n";

$stmt = $db->query("
    SELECT u.*, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = 'encictyear1'
");
$blogger = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$blogger) {
    echo "❌ FAIL: Blogger user not found\n";
    exit(1);
}

echo "Blogger User (encictyear1):\n";
echo "  role: {$blogger['role']}\n";
echo "  role_id: {$blogger['role_id']}\n";
echo "  role_name: {$blogger['role_name']}\n\n";

if ($blogger['role'] === 'admin' && $blogger['role_name'] === 'blogger') {
    echo "✅ PASS: Blogger has role='admin' and role_name='blogger'\n";
} else {
    echo "❌ FAIL: Blogger configuration incorrect\n";
    echo "  Expected: role='admin', role_name='blogger'\n";
    echo "  Got: role='{$blogger['role']}', role_name='{$blogger['role_name']}'\n";
    exit(1);
}
echo "\n";

// Test 3: Permissions Check
echo "TEST 3: Permission System\n";
echo str_repeat("─", 70) . "\n";

$stmt = $db->query("
    SELECT p.name
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = {$blogger['role_id']}
");
$permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo "Blogger Permissions (" . count($permissions) . "):\n";
foreach ($permissions as $perm) {
    echo "  - $perm\n";
}

$hasDashboard = in_array('dashboard.view', $permissions);
if ($hasDashboard) {
    echo "\n✅ PASS: Blogger has dashboard.view permission\n";
} else {
    echo "\n❌ FAIL: Blogger missing dashboard.view permission\n";
    exit(1);
}
echo "\n";

// Test 4: Frontend Logic Simulation
echo "TEST 4: Frontend Logic Simulation\n";
echo str_repeat("─", 70) . "\n";

function simulateIsAdmin($user) {
    // New logic: Check role column
    $userRole = $user['role'];
    return in_array($userRole, ['admin', 'super_admin', 'Administrator']);
}

function simulateIsSuperAdmin($user) {
    // New logic: Check role_name
    $userRoleName = $user['role_name'];
    return in_array($userRoleName, ['admin', 'Administrator', 'super_admin']);
}

$isAdmin = simulateIsAdmin($blogger);
$isSuperAdmin = simulateIsSuperAdmin($blogger);

echo "Blogger Access Checks:\n";
echo "  isAdmin(): " . ($isAdmin ? 'TRUE' : 'FALSE') . "\n";
echo "  isSuperAdmin(): " . ($isSuperAdmin ? 'TRUE' : 'FALSE') . "\n\n";

if ($isAdmin && !$isSuperAdmin) {
    echo "✅ PASS: Blogger can access admin panel but sees filtered tabs\n";
} else if (!$isAdmin) {
    echo "❌ FAIL: Blogger cannot access admin panel\n";
    exit(1);
} else if ($isSuperAdmin) {
    echo "❌ FAIL: Blogger would see ALL tabs (incorrect)\n";
    exit(1);
}
echo "\n";

// Test 5: Tab Filtering
echo "TEST 5: Tab Visibility\n";
echo str_repeat("─", 70) . "\n";

$tabs = [
    ['id' => 'overview', 'permissions' => ['dashboard.view']],
    ['id' => 'content', 'permissions' => ['content.view']],
    ['id' => 'jobs', 'permissions' => ['jobs.view']],
    ['id' => 'scholarships', 'permissions' => ['scholarships.view']],
    ['id' => 'newsletter', 'permissions' => ['newsletter.view']],
    ['id' => 'settings', 'permissions' => ['settings.edit', 'system.settings']],
    ['id' => 'users', 'permissions' => ['users.view']],
];

$visibleTabs = [];
foreach ($tabs as $tab) {
    if ($isSuperAdmin) {
        $visibleTabs[] = $tab['id'];
        continue;
    }
    
    foreach ($tab['permissions'] as $perm) {
        if (in_array($perm, $permissions)) {
            $visibleTabs[] = $tab['id'];
            break;
        }
    }
}

echo "Visible tabs for blogger: " . implode(', ', $visibleTabs) . "\n";

$expectedTabs = ['overview', 'content', 'jobs', 'scholarships', 'newsletter'];
sort($expectedTabs);
sort($visibleTabs);

if ($expectedTabs === $visibleTabs) {
    echo "\n✅ PASS: Tab filtering correct (5 tabs)\n";
} else {
    echo "\n❌ FAIL: Tab filtering incorrect\n";
    echo "  Expected: " . implode(', ', $expectedTabs) . "\n";
    echo "  Got: " . implode(', ', $visibleTabs) . "\n";
    exit(1);
}
echo "\n";

// Summary
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║                    ALL TESTS PASSED ✅                           ║\n";
echo "╠══════════════════════════════════════════════════════════════════╣\n";
echo "║  ✅ All staff users have role='admin'                            ║\n";
echo "║  ✅ Blogger has role='admin', role_name='blogger'                ║\n";
echo "║  ✅ Blogger has dashboard.view permission                        ║\n";
echo "║  ✅ isAdmin() returns TRUE (allows admin panel)                  ║\n";
echo "║  ✅ isSuperAdmin() returns FALSE (filters tabs)                  ║\n";
echo "║  ✅ Tab filtering shows correct 5 tabs                           ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

echo "NEW MODEL EXPLANATION:\n";
echo str_repeat("─", 70) . "\n";
echo "• All staff users created by admin have role='admin'\n";
echo "• Their specific type is stored in role_name (blogger, content_editor, etc.)\n";
echo "• role='admin' grants access to /admin panel\n";
echo "• role_name='admin' grants access to ALL tabs (super admin)\n";
echo "• Other role_names see filtered tabs based on permissions\n\n";

echo "BLOGGER EXAMPLE:\n";
echo "  role='admin' → Can login to /admin ✅\n";
echo "  role_name='blogger' → Not super admin, sees filtered tabs ✅\n";
echo "  permissions=[content.*, jobs.*, scholarships.*, newsletter.*, dashboard.view]\n";
echo "  visible_tabs=[overview, content, jobs, scholarships, newsletter] ✅\n\n";

echo "NEXT STEPS:\n";
echo "1. Restart dev servers (already done)\n";
echo "2. Clear browser cache or use incognito mode\n";
echo "3. Go to http://localhost:5175/admin\n";
echo "4. Login as encictyear1\n";
echo "5. Should see admin panel with 5 tabs ✅\n\n";

exit(0);
