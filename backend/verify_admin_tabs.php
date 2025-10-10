<?php
/**
 * Verify Admin Gets All Tabs
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, "'\"");
        }
    }
}

$db = new PDO(
    'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '4306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'devco_db'),
    $_ENV['DB_USER'] ?? 'root',
    $_ENV['DB_PASS'] ?? '1212',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║         ADMIN TAB VISIBILITY VERIFICATION                  ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Get admin user
$stmt = $db->query("SELECT u.id, u.username, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1");
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    die("❌ No admin user found!\n");
}

echo "Testing permissions for: {$admin['username']} (Role: {$admin['role']})\n\n";

// Get all permissions for admin
require_once __DIR__ . '/src/Services/PermissionService.php';
$permissionService = new \App\Services\PermissionService($db);
$permissions = $permissionService->getUserPermissions($admin['id']);
$permissionNames = array_column($permissions, 'name');

echo "Admin has " . count($permissionNames) . " permissions\n\n";

// Define tabs with their required permissions (updated to match database)
$tabs = [
    ['name' => 'Overview', 'permissions' => ['dashboard.view']],
    ['name' => 'Content', 'permissions' => ['content.view']],
    ['name' => 'Services', 'permissions' => ['content.view']],
    ['name' => 'Portfolio', 'permissions' => ['content.view']],
    ['name' => 'About', 'permissions' => ['content.view']],
    ['name' => 'Team', 'permissions' => ['team.view']],
    ['name' => 'Announcements', 'permissions' => ['announcements.view']],
    ['name' => 'Jobs', 'permissions' => ['jobs.view']],
    ['name' => 'Scholarships', 'permissions' => ['scholarships.view']],
    ['name' => 'Organizations', 'permissions' => ['organizations.view']],
    ['name' => 'Analytics', 'permissions' => ['analytics.view']],
    ['name' => 'Newsletter', 'permissions' => ['newsletter.view']],
    ['name' => 'Tools & Curriculum', 'permissions' => ['system.settings']],
    ['name' => 'User Roles', 'permissions' => ['users.view', 'users.manage_permissions']],
    ['name' => 'Navigation', 'permissions' => ['system.settings']],
    ['name' => 'Settings', 'permissions' => ['system.settings']]
];

echo "┌─ TAB VISIBILITY CHECK ───────────────────────────────────┐\n";

$visibleCount = 0;
$hiddenCount = 0;

foreach ($tabs as $tab) {
    $hasAccess = false;
    
    // Check if admin has ANY of the required permissions
    foreach ($tab['permissions'] as $requiredPerm) {
        if (in_array($requiredPerm, $permissionNames)) {
            $hasAccess = true;
            break;
        }
    }
    
    $status = $hasAccess ? "✅" : "❌";
    $tabName = str_pad($tab['name'], 25);
    $perms = implode(', ', $tab['permissions']);
    
    echo "$status $tabName ($perms)\n";
    
    if ($hasAccess) {
        $visibleCount++;
    } else {
        $hiddenCount++;
    }
}

echo "└──────────────────────────────────────────────────────────┘\n\n";

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                    SUMMARY                                 ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";
echo "║ Total Tabs: " . str_pad(count($tabs), 46) . " ║\n";
echo "║ Visible Tabs: " . str_pad($visibleCount, 44) . " ║\n";
echo "║ Hidden Tabs: " . str_pad($hiddenCount, 45) . " ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";

if ($hiddenCount === 0) {
    echo "║ ✅ ALL TABS VISIBLE - Admin has full access!             ║\n";
} else {
    echo "║ ❌ SOME TABS HIDDEN - Check permissions!                 ║\n";
    echo "╠════════════════════════════════════════════════════════════╣\n";
    echo "║ Missing Permissions:                                       ║\n";
    
    foreach ($tabs as $tab) {
        $hasAccess = false;
        foreach ($tab['permissions'] as $requiredPerm) {
            if (in_array($requiredPerm, $permissionNames)) {
                $hasAccess = true;
                break;
            }
        }
        
        if (!$hasAccess) {
            $missing = implode(', ', $tab['permissions']);
            echo "║   • " . str_pad($missing, 54) . " ║\n";
        }
    }
}

echo "╚════════════════════════════════════════════════════════════╝\n\n";

if ($hiddenCount === 0) {
    echo "✅ SUCCESS: Admin user can see all tabs!\n";
    echo "   Frontend permission checks are correctly aligned with database.\n";
} else {
    echo "⚠️  WARNING: Admin user missing access to $hiddenCount tab(s)!\n";
    echo "   Frontend may need permission alignment with database.\n";
}

echo "\n";
