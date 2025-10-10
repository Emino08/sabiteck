<?php
/**
 * Final RBAC System Verification
 * Run this to ensure everything is working correctly
 */

echo "╔════════════════════════════════════════╗\n";
echo "║   RBAC System Final Verification      ║\n";
echo "╚════════════════════════════════════════╝\n\n";

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$allPassed = true;

// Test 1: Check tables exist
echo "Test 1: Verifying RBAC Tables\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$tables = ['roles', 'permissions', 'role_permissions', 'user_roles', 'user_permissions'];
foreach ($tables as $table) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    $exists = $stmt->rowCount() > 0;
    echo ($exists ? "✓" : "✗") . " Table '$table' exists\n";
    if (!$exists) $allPassed = false;
}
echo "\n";

// Test 2: Check data counts
echo "Test 2: Verifying Data Counts\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$counts = [
    'roles' => [6, 'roles'],
    'permissions' => [56, 'permissions'],
    'role_permissions' => [128, 'role-permission mappings'],
];

foreach ($counts as $table => $expected) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM $table");
    $count = $stmt->fetch()['count'];
    $match = $count == $expected[0];
    echo ($match ? "✓" : "✗") . " $table: $count (expected {$expected[0]} {$expected[1]})\n";
    if (!$match) $allPassed = false;
}
echo "\n";

// Test 3: Check user_permissions table structure
echo "Test 3: Verifying user_permissions Structure\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$stmt = $db->query("SHOW COLUMNS FROM user_permissions");
$columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
$requiredColumns = ['id', 'user_id', 'permission_id', 'granted', 'created_at'];

foreach ($requiredColumns as $col) {
    $exists = in_array($col, $columns);
    echo ($exists ? "✓" : "✗") . " Column '$col' exists\n";
    if (!$exists) $allPassed = false;
}

// Check that old 'permission' column doesn't exist
$hasOldColumn = in_array('permission', $columns);
echo ($hasOldColumn ? "✗" : "✓") . " Old 'permission' column " . ($hasOldColumn ? "exists (PROBLEM!)" : "doesn't exist (correct)") . "\n";
if ($hasOldColumn) $allPassed = false;
echo "\n";

// Test 4: Verify Permission Service
echo "Test 4: Testing Permission Service\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
require_once __DIR__ . '/src/Services/PermissionService.php';
$permissionService = new \App\Services\PermissionService($db);

// Get a test user (admin)
$stmt = $db->query("SELECT id, username FROM users WHERE role = 'admin' LIMIT 1");
$admin = $stmt->fetch();

if ($admin) {
    try {
        $hasDashboard = $permissionService->hasPermission($admin['id'], 'dashboard.view');
        echo ($hasDashboard ? "✓" : "✗") . " Admin has dashboard.view permission\n";
        if (!$hasDashboard) $allPassed = false;
        
        $permissions = $permissionService->getUserPermissions($admin['id']);
        $count = count($permissions);
        $isCorrect = $count == 56;
        echo ($isCorrect ? "✓" : "✗") . " Admin has $count permissions (expected 56)\n";
        if (!$isCorrect) $allPassed = false;
    } catch (Exception $e) {
        echo "✗ Permission Service error: " . $e->getMessage() . "\n";
        $allPassed = false;
    }
} else {
    echo "⚠ No admin user found for testing\n";
}
echo "\n";

// Test 5: Verify Blogger Role
echo "Test 5: Verifying Blogger Role\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$stmt = $db->query("
    SELECT u.id, u.username, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'blogger' OR u.role = 'blogger'
    LIMIT 1
");
$blogger = $stmt->fetch();

if ($blogger) {
    // Check role consistency
    $roleMatch = $blogger['role'] == $blogger['role_name'];
    echo ($roleMatch ? "✓" : "✗") . " Role column matches role_id ('{$blogger['role']}' vs '{$blogger['role_name']}')\n";
    if (!$roleMatch) $allPassed = false;
    
    // Check user_roles entry
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_roles WHERE user_id = ?");
    $stmt->execute([$blogger['id']]);
    $hasEntry = $stmt->fetch()['count'] > 0;
    echo ($hasEntry ? "✓" : "✗") . " user_roles entry exists\n";
    if (!$hasEntry) $allPassed = false;
    
    // Check permissions
    $permissions = $permissionService->getUserPermissions($blogger['id']);
    $count = count($permissions);
    $isCorrect = $count == 15;
    echo ($isCorrect ? "✓" : "✗") . " Blogger has $count permissions (expected 15)\n";
    if (!$isCorrect) $allPassed = false;
} else {
    echo "⚠ No blogger user found\n";
}
echo "\n";

// Test 6: Check index.php permission query
echo "Test 6: Verifying index.php Permission Query\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$indexContent = file_get_contents(__DIR__ . '/public/index.php');
$hasOldQuery = strpos($indexContent, "up.permission = 'dashboard.view'") !== false;
$hasNewQuery = strpos($indexContent, "p.name = 'dashboard.view'") !== false;

echo ($hasNewQuery ? "✓" : "✗") . " Uses new RBAC query structure\n";
echo ($hasOldQuery ? "✗" : "✓") . " " . ($hasOldQuery ? "Still has old query (PROBLEM!)" : "No old query found (correct)") . "\n";
if ($hasOldQuery || !$hasNewQuery) $allPassed = false;
echo "\n";

// Final Summary
echo "╔════════════════════════════════════════╗\n";
if ($allPassed) {
    echo "║     ✓ ALL TESTS PASSED!               ║\n";
    echo "║     RBAC System is fully functional   ║\n";
} else {
    echo "║     ✗ SOME TESTS FAILED               ║\n";
    echo "║     Please review errors above        ║\n";
}
echo "╚════════════════════════════════════════╝\n\n";

if ($allPassed) {
    echo "🎉 RBAC system is ready for production!\n\n";
    echo "Next steps:\n";
    echo "1. Have users logout and login again for fresh JWT tokens\n";
    echo "2. Update frontend to check permissions dynamically\n";
    echo "3. Apply PermissionMiddleware to protected routes\n";
} else {
    echo "⚠️  Please fix the issues above before using the system.\n";
}

exit($allPassed ? 0 : 1);
