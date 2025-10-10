<?php
/**
 * Ensure all blogger users are properly configured
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "Synchronizing Blogger Users\n";
echo "============================\n\n";

// Get blogger role
$stmt = $db->query("SELECT id FROM roles WHERE name = 'blogger'");
$bloggerRole = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bloggerRole) {
    die("Blogger role not found!\n");
}

$roleId = $bloggerRole['id'];

// Find all blogger users
$stmt = $db->prepare("
    SELECT id, username, email, role, role_id
    FROM users
    WHERE role = 'blogger' OR role_id = ?
");
$stmt->execute([$roleId]);
$bloggers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($bloggers) . " blogger user(s)\n\n";

foreach ($bloggers as $user) {
    echo "User: {$user['username']} (ID: {$user['id']})\n";
    echo "  Current role: {$user['role']}\n";
    echo "  Current role_id: {$user['role_id']}\n";
    
    $needsUpdate = false;
    
    // Ensure role column matches
    if ($user['role'] !== 'blogger') {
        echo "  ⚠ Updating role column to 'blogger'\n";
        $stmt = $db->prepare("UPDATE users SET role = 'blogger' WHERE id = ?");
        $stmt->execute([$user['id']]);
        $needsUpdate = true;
    }
    
    // Ensure role_id matches
    if ($user['role_id'] != $roleId) {
        echo "  ⚠ Updating role_id to $roleId\n";
        $stmt = $db->prepare("UPDATE users SET role_id = ? WHERE id = ?");
        $stmt->execute([$roleId, $user['id']]);
        $needsUpdate = true;
    }
    
    // Ensure user_roles entry exists
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM user_roles WHERE user_id = ? AND role_id = ?");
    $stmt->execute([$user['id'], $roleId]);
    $hasEntry = $stmt->fetch()['count'] > 0;
    
    if (!$hasEntry) {
        echo "  ⚠ Creating user_roles entry\n";
        $stmt = $db->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
        $stmt->execute([$user['id'], $roleId]);
        $needsUpdate = true;
    }
    
    // Check permissions via PermissionService
    require_once __DIR__ . '/src/Services/PermissionService.php';
    $permissionService = new \App\Services\PermissionService($db);
    $permissions = $permissionService->getUserPermissions($user['id']);
    
    echo "  Permissions: " . count($permissions) . " (expected: 15)\n";
    
    if ($needsUpdate) {
        echo "  ✓ User synchronized\n";
    } else {
        echo "  ✓ User already correct\n";
    }
    
    echo "\n";
}

echo "✓ All blogger users synchronized\n\n";

echo "Next Steps:\n";
echo "===========\n";
echo "1. Blogger users must LOGOUT completely\n";
echo "2. LOGIN again to get fresh JWT token\n";
echo "3. They will see ONLY these tabs:\n";
echo "   • Overview\n";
echo "   • Content (for blogs, news, website content)\n";
echo "   • Jobs\n";
echo "   • Scholarships\n";
echo "   • Newsletter\n\n";

echo "4. They will NOT see:\n";
echo "   • Services, Portfolio, About, Team, Announcements\n";
echo "   • Organizations, Analytics, Tools\n";
echo "   • User Roles, Routes, Settings\n\n";
