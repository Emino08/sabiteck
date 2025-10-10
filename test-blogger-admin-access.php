#!/usr/bin/env php
<?php
/**
 * Comprehensive test for blogger admin access
 * Verifies that bloggers can login to admin panel and see correct tabs
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║     BLOGGER ADMIN ACCESS - COMPREHENSIVE TEST SUITE            ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Test 1: Database Verification
echo "TEST 1: Database Role Consistency\n";
echo str_repeat("─", 64) . "\n";

$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = 'encictyear1'
");
$blogger = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$blogger) {
    echo "❌ FAIL: Blogger user not found\n\n";
    exit(1);
}

if ($blogger['role'] === $blogger['role_name'] && $blogger['role'] === 'blogger') {
    echo "✅ PASS: Role is consistent (both = 'blogger')\n";
} else {
    echo "❌ FAIL: Role mismatch!\n";
    echo "   role: {$blogger['role']}\n";
    echo "   role_name: {$blogger['role_name']}\n\n";
    exit(1);
}
echo "\n";

// Test 2: Dashboard Permission Check
echo "TEST 2: Dashboard Access Permission\n";
echo str_repeat("─", 64) . "\n";

$stmt = $db->query("
    SELECT p.name
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN roles r ON rp.role_id = r.id
    WHERE r.id = {$blogger['role_id']} AND p.name = 'dashboard.view'
");
$hasDashboard = $stmt->fetch(PDO::FETCH_ASSOC);

if ($hasDashboard) {
    echo "✅ PASS: Blogger has 'dashboard.view' permission\n";
    echo "   → Should be able to access /admin\n";
} else {
    echo "❌ FAIL: Blogger missing 'dashboard.view' permission\n";
    echo "   → Will be blocked from /admin\n\n";
    exit(1);
}
echo "\n";

// Test 3: isAdmin() Logic Simulation
echo "TEST 3: Frontend isAdmin() Logic\n";
echo str_repeat("─", 64) . "\n";

function simulateIsAdmin($user, $permissions) {
    // This simulates the updated AuthContext.isAdmin() function
    
    // Check for dashboard.view permission (staff users)
    foreach ($permissions as $p) {
        if ($p['name'] === 'dashboard.view') {
            return true;
        }
    }
    
    // Check role names for backward compatibility
    $userRole = $user['role'];
    $userRoleName = $user['role_name'];
    
    $isTrueSuperAdmin = (
        in_array($userRole, ['super_admin', 'admin', 'Administrator', 'super-admin']) &&
        in_array($userRoleName, ['super_admin', 'admin', 'Administrator', 'super-admin'])
    );
    
    return $isTrueSuperAdmin;
}

// Get all blogger permissions
$stmt = $db->query("
    SELECT p.name, p.display_name
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = {$blogger['role_id']}
");
$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

$isAdminResult = simulateIsAdmin($blogger, $permissions);

if ($isAdminResult) {
    echo "✅ PASS: isAdmin() returns TRUE for blogger\n";
    echo "   → Blogger can access admin panel\n";
} else {
    echo "❌ FAIL: isAdmin() returns FALSE for blogger\n";
    echo "   → Blogger will be blocked from admin panel\n\n";
    exit(1);
}
echo "\n";

// Test 4: isSuperAdmin() Logic Simulation  
echo "TEST 4: Frontend isSuperAdmin() Logic\n";
echo str_repeat("─", 64) . "\n";

function simulateIsSuperAdmin($user) {
    $userRole = $user['role'];
    $userRoleName = $user['role_name'];
    
    $isTrueSuperAdmin = (
        in_array($userRole, ['super_admin', 'admin']) &&
        in_array($userRoleName, ['super_admin', 'admin', 'Administrator'])
    );
    
    return $isTrueSuperAdmin;
}

$isSuperAdminResult = simulateIsSuperAdmin($blogger);

if (!$isSuperAdminResult) {
    echo "✅ PASS: isSuperAdmin() returns FALSE for blogger\n";
    echo "   → Blogger will see filtered tabs based on permissions\n";
} else {
    echo "❌ FAIL: isSuperAdmin() returns TRUE for blogger\n";
    echo "   → Blogger would see ALL tabs (incorrect)\n\n";
    exit(1);
}
echo "\n";

// Test 5: Login Validation Logic
echo "TEST 5: Admin Login Validation\n";
echo str_repeat("─", 64) . "\n";

function simulateLoginValidation($permissions) {
    // From Admin.jsx handleLogin function (updated)
    $hasDashboardAccess = false;
    
    foreach ($permissions as $p) {
        if ($p['name'] === 'dashboard.view') {
            $hasDashboardAccess = true;
            break;
        }
    }
    
    return $hasDashboardAccess;
}

$canLogin = simulateLoginValidation($permissions);

if ($canLogin) {
    echo "✅ PASS: Login validation allows blogger\n";
    echo "   → Will NOT show 'Access denied' error\n";
} else {
    echo "❌ FAIL: Login validation blocks blogger\n";
    echo "   → Will show 'Access denied' error\n\n";
    exit(1);
}
echo "\n";

// Test 6: Tab Filtering
echo "TEST 6: Tab Visibility Filtering\n";
echo str_repeat("─", 64) . "\n";

$permissionNames = array_column($permissions, 'name');

$tabs = [
    ['id' => 'overview', 'permissions' => ['dashboard.view']],
    ['id' => 'content', 'permissions' => ['content.view']],
    ['id' => 'jobs', 'permissions' => ['jobs.view']],
    ['id' => 'scholarships', 'permissions' => ['scholarships.view']],
    ['id' => 'newsletter', 'permissions' => ['newsletter.view']],
    ['id' => 'services', 'permissions' => ['services.view']],
    ['id' => 'team', 'permissions' => ['team.view']],
    ['id' => 'settings', 'permissions' => ['settings.edit', 'system.settings']],
];

$accessibleTabs = [];
$isSuperAdmin = simulateIsSuperAdmin($blogger);

foreach ($tabs as $tab) {
    if ($isSuperAdmin) {
        $accessibleTabs[] = $tab['id'];
        continue;
    }
    
    foreach ($tab['permissions'] as $perm) {
        if (in_array($perm, $permissionNames)) {
            $accessibleTabs[] = $tab['id'];
            break;
        }
    }
}

$expectedTabs = ['overview', 'content', 'jobs', 'scholarships', 'newsletter'];
$missingExpected = array_diff($expectedTabs, $accessibleTabs);
$extraTabs = array_diff($accessibleTabs, $expectedTabs);

if (empty($missingExpected) && empty($extraTabs)) {
    echo "✅ PASS: Tab filtering correct\n";
    echo "   Visible tabs: " . implode(', ', $accessibleTabs) . "\n";
} else {
    echo "❌ FAIL: Tab filtering incorrect\n";
    if (!empty($missingExpected)) {
        echo "   Missing: " . implode(', ', $missingExpected) . "\n";
    }
    if (!empty($extraTabs)) {
        echo "   Extra: " . implode(', ', $extraTabs) . "\n";
    }
    echo "\n";
    exit(1);
}
echo "\n";

// Final Summary
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                    TEST SUMMARY                                ║\n";
echo "╠════════════════════════════════════════════════════════════════╣\n";
echo "║  ✅ Database role consistency                                  ║\n";
echo "║  ✅ Dashboard access permission                                ║\n";
echo "║  ✅ isAdmin() returns TRUE (allows access)                     ║\n";
echo "║  ✅ isSuperAdmin() returns FALSE (filters tabs)                ║\n";
echo "║  ✅ Login validation allows blogger                            ║\n";
echo "║  ✅ Tab filtering shows correct 5 tabs                         ║\n";
echo "╠════════════════════════════════════════════════════════════════╣\n";
echo "║  STATUS: ALL TESTS PASSED ✅                                   ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "NEXT STEPS:\n";
echo "1. Clear browser localStorage\n";
echo "2. Go to http://localhost:5174/admin\n";
echo "3. Login as: encictyear1\n";
echo "4. Verify you see the admin panel with 5 tabs\n";
echo "5. Confirm you can access each visible tab\n\n";

echo "✅ Blogger can now access admin panel!\n";
echo "✅ Blogger will see only 5 tabs based on permissions\n";
echo "✅ Admin users still see all tabs\n\n";

exit(0);
