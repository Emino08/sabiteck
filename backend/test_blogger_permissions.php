<?php
/**
 * Test blogger permissions and navigation
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Services/PermissionService.php';

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

try {
    $db = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '4306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'devco_db'),
        $_ENV['DB_USER'] ?? 'root',
        $_ENV['DB_PASS'] ?? '1212',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         BLOGGER PERMISSIONS TEST                              ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    // Find blogger user
    $stmt = $db->query("
        SELECT u.id, u.username, u.email, r.name as role_name, r.display_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'blogger'
        LIMIT 1
    ");
    $blogger = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$blogger) {
        echo "❌ No blogger user found. Please create one first.\n";
        exit(1);
    }

    echo "Testing for user: {$blogger['username']} (ID: {$blogger['id']})\n";
    echo "Role: {$blogger['display_name']}\n\n";

    $permissionService = new \App\Services\PermissionService($db);
    $permissions = $permissionService->getUserPermissions($blogger['id']);
    $modules = $permissionService->getUserModules($blogger['id']);

    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         USER PERMISSIONS (" . count($permissions) . " total)                          ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    foreach ($permissions as $perm) {
        echo "  ✅ " . str_pad($perm['display_name'], 35) . " → " . $perm['name'] . "\n";
    }

    echo "\n\n╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         ACCESSIBLE MODULES                                    ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    foreach ($modules as $module) {
        echo "  📂 " . ucfirst($module) . "\n";
    }

    echo "\n\n╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         ADMIN NAVIGATION TABS ACCESS                          ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    // Define admin tabs exactly as in Admin.jsx
    $tabs = [
        ['name' => 'Overview', 'permissions' => ['dashboard.view']],
        ['name' => 'Content', 'permissions' => ['content.view']],
        ['name' => 'Services', 'permissions' => ['services.view']], // Content editors only
        ['name' => 'Portfolio', 'permissions' => ['portfolio.view']], // Content editors only
        ['name' => 'About', 'permissions' => ['about.view']], // Content editors only
        ['name' => 'Team', 'permissions' => ['team.view']],
        ['name' => 'Announcements', 'permissions' => ['announcements.view']],
        ['name' => 'Jobs', 'permissions' => ['jobs.view']],
        ['name' => 'Scholarships', 'permissions' => ['scholarships.view']],
        ['name' => 'Organizations', 'permissions' => ['organizations.view']],
        ['name' => 'Analytics', 'permissions' => ['analytics.view']],
        ['name' => 'Newsletter', 'permissions' => ['newsletter.view']],
        ['name' => 'Tools & Curriculum', 'permissions' => ['tools.use', 'system.settings']],
        ['name' => 'User Roles', 'permissions' => ['users.create', 'roles.manage']],
        ['name' => 'Navigation', 'permissions' => ['system.settings']],
        ['name' => 'Settings', 'permissions' => ['settings.edit', 'system.settings']],
    ];

    $permNames = array_column($permissions, 'name');

    $visibleCount = 0;
    $hiddenCount = 0;

    foreach ($tabs as $tab) {
        // Check if user has ANY of the required permissions
        $hasPermission = false;
        foreach ($tab['permissions'] as $reqPerm) {
            if (in_array($reqPerm, $permNames)) {
                $hasPermission = true;
                break;
            }
        }

        if ($hasPermission) {
            echo "  ✅ " . str_pad($tab['name'], 25) . " (VISIBLE)\n";
            $visibleCount++;
        } else {
            echo "  ❌ " . str_pad($tab['name'], 25) . " (HIDDEN)\n";
            $hiddenCount++;
        }
    }

    echo "\n\n╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         SUMMARY                                               ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    echo "  📊 Visible Tabs: {$visibleCount}\n";
    echo "  🔒 Hidden Tabs: {$hiddenCount}\n";
    echo "  📝 Total Permissions: " . count($permissions) . "\n";
    echo "  📂 Total Modules: " . count($modules) . "\n\n";

    echo "Expected visible tabs for Blogger:\n";
    echo "  ✅ Overview, Content, Jobs, Scholarships, Newsletter\n\n";

    echo "Expected hidden tabs for Blogger:\n";
    echo "  ❌ Services, Portfolio, About, Team, Announcements\n";
    echo "  ❌ Organizations, Analytics, Tools & Curriculum\n";
    echo "  ❌ User Roles, Navigation, Settings\n\n";

    if ($visibleCount == 5 && $hiddenCount == 11) {
        echo "✅ SUCCESS! Blogger role has correct access.\n";
    } else {
        echo "⚠️  WARNING: Blogger should see 5 tabs, hiding 11. Currently seeing {$visibleCount} tabs, hiding {$hiddenCount}.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
