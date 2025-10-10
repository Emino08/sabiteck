#!/usr/bin/env php
<?php
/**
 * Test blogger login and permission checking
 * This simulates what happens when a blogger logs in
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection
$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== BLOGGER LOGIN SIMULATION TEST ===\n\n";

// Get blogger user
$stmt = $db->prepare("
    SELECT u.*, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = ?
");
$stmt->execute(['encictyear1']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "ERROR: Blogger user 'encictyear1' not found!\n";
    exit(1);
}

echo "User Found:\n";
echo "  ID: {$user['id']}\n";
echo "  Username: {$user['username']}\n";
echo "  Email: {$user['email']}\n";
echo "  role: {$user['role']}\n";
echo "  role_id: {$user['role_id']}\n";
echo "  role_name: {$user['role_name']}\n\n";

// Verify role consistency
if ($user['role'] !== $user['role_name']) {
    echo "❌ ERROR: Role inconsistency detected!\n";
    echo "  role column: {$user['role']}\n";
    echo "  role_name (from role_id): {$user['role_name']}\n";
    echo "  This WILL cause permission issues!\n\n";
    exit(1);
} else {
    echo "✓ Role is consistent: {$user['role']}\n\n";
}

// Get user permissions
$stmt = $db->prepare("
    SELECT p.name, p.display_name, p.module
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN roles r ON rp.role_id = r.id
    WHERE r.id = ?
    ORDER BY p.module, p.name
");
$stmt->execute([$user['role_id']]);
$permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "User Permissions (" . count($permissions) . " total):\n";
$permissionNames = [];
foreach ($permissions as $perm) {
    $permissionNames[] = $perm['name'];
    echo "  - {$perm['name']}\n";
}
echo "\n";

// Simulate what the frontend login response would be
$loginResponse = [
    'success' => true,
    'message' => 'Login successful',
    'data' => [
        'token' => 'simulated-jwt-token',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'role_name' => $user['role_name'],
            'must_change_password' => (bool)$user['must_change_password']
        ],
        'permissions' => $permissions,
        'modules' => []
    ]
];

echo "=== SIMULATED LOGIN RESPONSE ===\n";
echo json_encode($loginResponse, JSON_PRETTY_PRINT) . "\n\n";

// Define admin tabs (from Admin.jsx)
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

// Simulate frontend permission checking logic (from Admin.jsx lines 213-222)
function checkTabAccess($user, $tab, $permissionNames) {
    // Check if user role is truly admin (must match BOTH role and role_name)
    $isTrueAdmin = (
        (in_array($user['role'], ['admin', 'super_admin'])) &&
        (in_array($user['role_name'], ['admin', 'super_admin', 'Administrator']))
    );
    
    if ($isTrueAdmin) {
        return true;
    }
    
    // For all other users, check if they have ANY of the required permissions
    foreach ($tab['permissions'] as $requiredPerm) {
        if (in_array($requiredPerm, $permissionNames)) {
            return true;
        }
    }
    
    return false;
}

echo "=== FRONTEND TAB FILTERING SIMULATION ===\n\n";

$allowedTabs = [];
$blockedTabs = [];

foreach ($adminTabs as $tab) {
    $hasAccess = checkTabAccess($user, $tab, $permissionNames);
    
    if ($hasAccess) {
        $allowedTabs[] = $tab;
    } else {
        $blockedTabs[] = $tab;
    }
}

echo "✅ ALLOWED TABS (" . count($allowedTabs) . "):\n";
foreach ($allowedTabs as $tab) {
    $reason = [];
    foreach ($tab['permissions'] as $perm) {
        if (in_array($perm, $permissionNames)) {
            $reason[] = $perm;
        }
    }
    echo "  ✓ {$tab['label']} (has: " . implode(', ', $reason) . ")\n";
}

echo "\n❌ BLOCKED TABS (" . count($blockedTabs) . "):\n";
foreach ($blockedTabs as $tab) {
    echo "  ✗ {$tab['label']} (needs: " . implode(' OR ', $tab['permissions']) . ")\n";
}

echo "\n\n=== TEST RESULT ===\n";

$expectedAllowed = ['overview', 'content', 'jobs', 'scholarships', 'newsletter'];
$actualAllowed = array_column($allowedTabs, 'id');

sort($expectedAllowed);
sort($actualAllowed);

if ($expectedAllowed === $actualAllowed) {
    echo "✅✅✅ SUCCESS! Tab filtering is working correctly!\n";
    echo "Blogger sees exactly the expected " . count($expectedAllowed) . " tabs.\n";
    exit(0);
} else {
    echo "❌ FAILURE! Tab filtering mismatch!\n";
    echo "Expected: " . implode(', ', $expectedAllowed) . "\n";
    echo "Got: " . implode(', ', $actualAllowed) . "\n";
    
    $extra = array_diff($actualAllowed, $expectedAllowed);
    $missing = array_diff($expectedAllowed, $actualAllowed);
    
    if (!empty($extra)) {
        echo "Extra tabs (shouldn't see): " . implode(', ', $extra) . "\n";
    }
    if (!empty($missing)) {
        echo "Missing tabs (should see): " . implode(', ', $missing) . "\n";
    }
    
    exit(1);
}
