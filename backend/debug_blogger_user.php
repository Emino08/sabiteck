<?php
/**
 * Debug blogger user and permissions
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

function getDB() {
    try {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '4306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '1212';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        return new PDO($dsn, $username, $password, $options);
    } catch (PDOException $e) {
        die('Database connection failed: ' . $e->getMessage() . "\n");
    }
}

$db = getDB();

echo "Checking Blogger Users\n";
echo "======================\n\n";

// Find blogger users
$stmt = $db->query("
    SELECT u.id, u.username, u.email, u.role, u.role_id, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role = 'blogger' OR r.name = 'blogger'
");
$bloggers = $stmt->fetchAll();

if (empty($bloggers)) {
    echo "No blogger users found.\n";
    exit;
}

foreach ($bloggers as $blogger) {
    echo "Blogger User: {$blogger['username']} (ID: {$blogger['id']})\n";
    echo "  Email: {$blogger['email']}\n";
    echo "  Role: {$blogger['role']}\n";
    echo "  Role ID: {$blogger['role_id']}\n";
    echo "  Role Name: {$blogger['role_name']}\n\n";
    
    // Check user_roles
    $stmt = $db->prepare("SELECT role_id FROM user_roles WHERE user_id = ?");
    $stmt->execute([$blogger['id']]);
    $userRoles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "  User Roles (user_roles table): " . implode(', ', $userRoles) . "\n";
    
    // Check permissions using PermissionService
    $permissionServicePath = __DIR__ . '/src/Services/PermissionService.php';
    require_once $permissionServicePath;
    
    $permissionService = new \App\Services\PermissionService($db);
    
    // Test dashboard.view permission
    $hasDashboard = $permissionService->hasPermission($blogger['id'], 'dashboard.view');
    echo "  Has dashboard.view: " . ($hasDashboard ? "YES" : "NO") . "\n";
    
    // Get all permissions
    $permissions = $permissionService->getUserPermissions($blogger['id']);
    echo "  Total permissions: " . count($permissions) . "\n";
    
    if (!empty($permissions)) {
        echo "  Permissions:\n";
        foreach (array_slice($permissions, 0, 10) as $perm) {
            echo "    - {$perm['name']} ({$perm['display_name']})\n";
        }
        if (count($permissions) > 10) {
            echo "    ... and " . (count($permissions) - 10) . " more\n";
        }
    }
    
    echo "\n";
}

// Check blogger role permissions
echo "Blogger Role Permissions\n";
echo "========================\n";
$stmt = $db->query("
    SELECT p.name, p.display_name
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'blogger'
    ORDER BY p.name
");
$bloggerPerms = $stmt->fetchAll();
echo "Total: " . count($bloggerPerms) . " permissions\n";
foreach ($bloggerPerms as $perm) {
    echo "  - {$perm['name']}\n";
}
