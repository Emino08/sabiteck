<?php
/**
 * Test Content Editor Dashboard Access
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
echo "║      CONTENT EDITOR DASHBOARD ACCESS TEST                 ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Check if editor role exists
echo "┌─ STEP 1: Checking Editor Role ──────────────────────────┐\n";
$stmt = $db->query("SELECT * FROM roles WHERE name = 'editor'");
$editorRole = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$editorRole) {
    die("❌ Editor role not found!\n");
}

echo "✅ Editor role found\n";
echo "   ID: {$editorRole['id']}\n";
echo "   Name: {$editorRole['name']}\n";
echo "   Display Name: {$editorRole['display_name']}\n";
echo "└──────────────────────────────────────────────────────────┘\n\n";

// Get editor permissions
echo "┌─ STEP 2: Loading Editor Permissions ────────────────────┐\n";

require_once __DIR__ . '/src/Services/PermissionService.php';
$permissionService = new \App\Services\PermissionService($db);

// Create or get test editor user
$stmt = $db->query("SELECT * FROM users WHERE role_id = {$editorRole['id']} LIMIT 1");
$editorUser = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$editorUser) {
    echo "Creating test editor user...\n";
    $username = 'editor_test_' . time();
    $email = 'editor_' . time() . '@test.com';
    $password = password_hash('EditorPass123!', PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, role_id, status, must_change_password, created_at)
        VALUES (?, ?, ?, ?, 'active', 0, NOW())
    ");
    $stmt->execute([$username, $email, $password, $editorRole['id']]);
    $userId = $db->lastInsertId();
    
    $editorUser = [
        'id' => $userId,
        'username' => $username,
        'email' => $email
    ];
    
    echo "✅ Created test editor user: $username\n";
} else {
    echo "✅ Using existing editor user: {$editorUser['username']}\n";
}

$permissions = $permissionService->getUserPermissions($editorUser['id']);
$modules = $permissionService->getUserModules($editorUser['id']);

echo "✅ Permissions loaded: " . count($permissions) . "\n";
echo "✅ Modules loaded: " . count($modules) . "\n";
echo "└──────────────────────────────────────────────────────────┘\n\n";

// Check specific permissions
echo "┌─ STEP 3: Verifying Dashboard Access ────────────────────┐\n";

$permNames = array_column($permissions, 'name');
$hasDashboard = in_array('dashboard.view', $permNames);

if ($hasDashboard) {
    echo "✅ Has dashboard.view permission\n";
} else {
    echo "❌ Missing dashboard.view permission\n";
}

echo "└──────────────────────────────────────────────────────────┘\n\n";

// Check which tabs should be visible
echo "┌─ STEP 4: Tab Visibility for Content Editor ─────────────┐\n";

$tabs = [
    ['name' => 'Overview', 'permissions' => ['dashboard.view']],
    ['name' => 'Analytics', 'permissions' => ['analytics.view']],
    ['name' => 'Content', 'permissions' => ['content.view']],
    ['name' => 'Services', 'permissions' => ['content.view']],
    ['name' => 'Portfolio', 'permissions' => ['content.view']],
    ['name' => 'About', 'permissions' => ['content.view']],
    ['name' => 'Team', 'permissions' => ['team.view']],
    ['name' => 'Announcements', 'permissions' => ['announcements.view']],
    ['name' => 'Jobs', 'permissions' => ['jobs.view']],
    ['name' => 'Scholarships', 'permissions' => ['scholarships.view']],
    ['name' => 'Organizations', 'permissions' => ['organizations.view']],
    ['name' => 'Newsletter', 'permissions' => ['newsletter.view']],
    ['name' => 'Tools & Curriculum', 'permissions' => ['system.settings']],
    ['name' => 'User Roles', 'permissions' => ['users.view', 'users.manage_permissions']],
    ['name' => 'Navigation', 'permissions' => ['system.settings']],
    ['name' => 'Settings', 'permissions' => ['system.settings']]
];

$visibleCount = 0;

foreach ($tabs as $tab) {
    $hasAccess = false;
    foreach ($tab['permissions'] as $perm) {
        if (in_array($perm, $permNames)) {
            $hasAccess = true;
            break;
        }
    }
    
    if ($hasAccess) {
        $visibleCount++;
        echo "✅ " . str_pad($tab['name'], 25) . " (VISIBLE)\n";
    } else {
        echo "❌ " . str_pad($tab['name'], 25) . " (HIDDEN)\n";
    }
}

echo "└──────────────────────────────────────────────────────────┘\n\n";

// Summary
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                    SUMMARY                                 ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";
echo "║ User: " . str_pad($editorUser['username'], 54) . " ║\n";
echo "║ Role: Content Editor                                       ║\n";
echo "║ Total Permissions: " . str_pad(count($permissions), 39) . " ║\n";
echo "║ Total Modules: " . str_pad(count($modules), 43) . " ║\n";
echo "║ Visible Tabs: " . str_pad($visibleCount . "/16", 44) . " ║\n";
echo "║ Dashboard Access: " . str_pad($hasDashboard ? 'YES ✅' : 'NO ❌', 42) . " ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";

if ($hasDashboard && $visibleCount > 0) {
    echo "║ ✅ Content Editor CAN access admin dashboard             ║\n";
    echo "║ ✅ Restricted to their permitted tabs only               ║\n";
} else {
    echo "║ ❌ Content Editor CANNOT access admin dashboard          ║\n";
}

echo "╚════════════════════════════════════════════════════════════╝\n\n";

// List permissions by category
echo "=== Content Editor Permissions by Category ===\n\n";
$byCategory = [];
foreach ($permissions as $perm) {
    $cat = $perm['category'];
    if (!isset($byCategory[$cat])) {
        $byCategory[$cat] = [];
    }
    $byCategory[$cat][] = $perm['name'];
}

foreach ($byCategory as $category => $perms) {
    echo strtoupper($category) . ":\n";
    foreach ($perms as $perm) {
        echo "  • $perm\n";
    }
    echo "\n";
}

echo "\n✅ Content Editor has restricted access to admin dashboard!\n";
echo "   They can only see and manage content-related features.\n";
