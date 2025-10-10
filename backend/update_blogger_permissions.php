<?php
/**
 * Update Blogger Role Permissions to Match Description
 * "Focuses on creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter"
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');

echo "Updating Blogger Role Permissions\n";
echo "==================================\n\n";

// Get blogger role ID
$stmt = $db->prepare("SELECT id FROM roles WHERE name = 'blogger'");
$stmt->execute();
$bloggerRole = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bloggerRole) {
    die("Blogger role not found!\n");
}

$roleId = $bloggerRole['id'];
echo "Blogger Role ID: $roleId\n\n";

// Define what blogger SHOULD have based on description:
// "creating, updating, and publishing website content, blogs, news, jobs, scholarships, newsletter"
$requiredPermissions = [
    // Dashboard
    'dashboard.view',
    
    // Content (blogs, news, website content)
    'content.view',
    'content.create',
    'content.edit',
    'content.publish',
    
    // Jobs
    'jobs.view',
    'jobs.create',
    'jobs.edit',
    'jobs.publish',
    
    // Scholarships
    'scholarships.view',
    'scholarships.create',
    'scholarships.edit',
    'scholarships.publish',
    
    // Newsletter
    'newsletter.view',
    'newsletter.create'
];

echo "Required Permissions for Blogger:\n";
foreach ($requiredPermissions as $perm) {
    echo "  - $perm\n";
}
echo "\n";

// Remove ALL current blogger permissions
$stmt = $db->prepare("DELETE FROM role_permissions WHERE role_id = ?");
$stmt->execute([$roleId]);
echo "✓ Cleared existing blogger permissions\n\n";

// Add only the required permissions
echo "Adding blogger permissions:\n";
$added = 0;
foreach ($requiredPermissions as $permName) {
    $stmt = $db->prepare("SELECT id FROM permissions WHERE name = ?");
    $stmt->execute([$permName]);
    $perm = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($perm) {
        $stmt = $db->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
        $stmt->execute([$roleId, $perm['id']]);
        echo "  ✓ Added: $permName\n";
        $added++;
    } else {
        echo "  ✗ Not found: $permName\n";
    }
}

echo "\n✓ Added $added permissions to blogger role\n\n";

// Verify
$stmt = $db->prepare("
    SELECT p.name, p.display_name, p.module
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.name
");
$stmt->execute([$roleId]);
$currentPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Verification - Blogger now has:\n";
echo "================================\n";
foreach ($currentPerms as $perm) {
    echo "  ✓ {$perm['name']} [{$perm['module']}]\n";
}

echo "\n";

// Check what tabs blogger should see
echo "Frontend Tabs Blogger Should See:\n";
echo "==================================\n";
$modules = array_unique(array_column($currentPerms, 'module'));
echo "Modules: " . implode(', ', $modules) . "\n\n";

echo "Expected Tabs:\n";
echo "  ✓ Overview (dashboard.view)\n";
echo "  ✓ Content/Blogs/News (content.view)\n";
echo "  ✓ Jobs (jobs.view)\n";
echo "  ✓ Scholarships (scholarships.view)\n";
echo "  ✓ Newsletter (newsletter.view)\n\n";

echo "Should NOT see:\n";
echo "  ✗ Services (no content.view for services specifically)\n";
echo "  ✗ Portfolio (no portfolio permissions)\n";
echo "  ✗ About (no about permissions)\n";
echo "  ✗ Team (no team.view)\n";
echo "  ✗ Announcements (no announcements.view)\n";
echo "  ✗ Organizations (no organizations.view)\n";
echo "  ✗ Analytics (no analytics.view)\n";
echo "  ✗ Tools (no tools.view)\n";
echo "  ✗ User Roles (no users.view)\n";
echo "  ✗ Routes (no settings.edit)\n";
echo "  ✗ Settings (no settings.view)\n\n";

echo "✓ Blogger role permissions updated successfully!\n";
echo "\nNext: Ensure frontend tabs are configured correctly.\n";
