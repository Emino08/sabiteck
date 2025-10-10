<?php
/**
 * Update all staff users to have role='admin' in the role column
 * while maintaining their specific role via role_id and role_name
 */

$db = new PDO('mysql:host=localhost;port=4306;dbname=devco_db', 'root', '1212');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "═══════════════════════════════════════════════════════════════\n";
echo "  CONVERTING STAFF USERS TO ADMIN ROLE WITH VARIED PERMISSIONS  \n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Get all staff roles (non-regular users)
$stmt = $db->query("
    SELECT id, name, display_name 
    FROM roles 
    WHERE name NOT IN ('user', 'guest')
    ORDER BY id
");
$staffRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Staff Roles Found:\n";
foreach ($staffRoles as $role) {
    echo "  - {$role['name']} (ID: {$role['id']}) - {$role['display_name']}\n";
}
echo "\n";

// Get all users with staff roles
$staffRoleIds = array_column($staffRoles, 'id');
$placeholders = implode(',', array_fill(0, count($staffRoleIds), '?'));

$stmt = $db->prepare("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name, r.display_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role_id IN ($placeholders)
    ORDER BY u.id
");
$stmt->execute($staffRoleIds);
$staffUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Staff Users to Update (" . count($staffUsers) . "):\n";
echo str_repeat("─", 80) . "\n";

foreach ($staffUsers as $user) {
    echo "ID: {$user['id']}, Username: {$user['username']}\n";
    echo "  Current role column: '{$user['role']}'\n";
    echo "  Role type (role_name): '{$user['role_name']}'\n";
    echo "  Display: {$user['display_name']}\n";
    
    if ($user['role'] !== 'admin') {
        echo "  → Will update to role='admin'\n";
    } else {
        echo "  → Already admin\n";
    }
    echo "\n";
}

echo "\n";
echo "PROPOSED CHANGES:\n";
echo str_repeat("─", 80) . "\n";
echo "All staff users will have:\n";
echo "  - role = 'admin' (for admin panel access)\n";
echo "  - role_id = [their specific role ID] (for permission tracking)\n";
echo "  - Permissions determined by their role_id\n\n";

echo "Example:\n";
echo "  Blogger user:\n";
echo "    - role = 'admin' (can access /admin)\n";
echo "    - role_id = 12 (blogger role)\n";
echo "    - role_name = 'blogger' (from roles table)\n";
echo "    - Permissions = content.*, jobs.*, scholarships.*, newsletter.*, dashboard.view\n\n";

$confirm = readline("Proceed with update? (yes/no): ");

if (strtolower(trim($confirm)) !== 'yes') {
    echo "\n❌ Update cancelled.\n";
    exit(0);
}

echo "\n";
echo "UPDATING USERS...\n";
echo str_repeat("─", 80) . "\n";

$updateStmt = $db->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
$updated = 0;

foreach ($staffUsers as $user) {
    if ($user['role'] !== 'admin') {
        $updateStmt->execute([$user['id']]);
        echo "✓ Updated {$user['username']} (ID: {$user['id']})\n";
        $updated++;
    } else {
        echo "- Skipped {$user['username']} (ID: {$user['id']}) - already admin\n";
    }
}

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  UPDATE COMPLETE\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "Updated: {$updated} user(s)\n";
echo "Skipped: " . (count($staffUsers) - $updated) . " user(s)\n\n";

// Verify the changes
echo "VERIFICATION:\n";
echo str_repeat("─", 80) . "\n";

$stmt = $db->query("
    SELECT u.id, u.username, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role = 'admin'
    ORDER BY u.id
");
$adminUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "All Admin Users (" . count($adminUsers) . "):\n";
foreach ($adminUsers as $user) {
    echo "  ✓ {$user['username']} - role='admin', type='{$user['role_name']}'\n";
}

echo "\n";
echo "✅ All staff users now have role='admin'\n";
echo "✅ Their specific roles are tracked via role_id and role_name\n";
echo "✅ Permissions are determined by role_id\n\n";

echo "NEXT STEPS:\n";
echo "1. Frontend will check: user.role === 'admin' (allows admin panel access)\n";
echo "2. Permissions will filter based on role_name (blogger, content_editor, etc.)\n";
echo "3. All staff can access /admin but see different tabs\n";
