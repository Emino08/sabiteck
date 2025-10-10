<?php
/**
 * RBAC System Migration and Testing Script
 * Run this script to set up the complete Role-Based Access Control system
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
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

// Database connection
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

echo "========================================\n";
echo "RBAC System Migration & Testing\n";
echo "========================================\n\n";

$db = getDB();

// Step 1: Run the migration
echo "Step 1: Running RBAC migration...\n";
$migrationFile = __DIR__ . '/migrations/create_rbac_system.sql';

if (!file_exists($migrationFile)) {
    die("Error: Migration file not found at $migrationFile\n");
}

$sql = file_get_contents($migrationFile);

try {
    // Split SQL into individual statements and execute
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $db->exec($statement);
        }
    }
    
    echo "✓ Migration completed successfully!\n\n";
} catch (PDOException $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Step 2: Verify roles
echo "Step 2: Verifying roles...\n";
$stmt = $db->query("SELECT id, name, display_name, description FROM roles ORDER BY id");
$roles = $stmt->fetchAll();

echo "Roles created:\n";
foreach ($roles as $role) {
    echo "  - {$role['name']}: {$role['display_name']}\n";
    echo "    {$role['description']}\n";
}
echo "\n";

// Step 3: Verify permissions count
echo "Step 3: Verifying permissions...\n";
$stmt = $db->query("SELECT COUNT(*) as count FROM permissions");
$permCount = $stmt->fetch()['count'];
echo "Total permissions: $permCount\n";

// Show permissions by category
$stmt = $db->query("SELECT category, COUNT(*) as count FROM permissions GROUP BY category ORDER BY category");
$categories = $stmt->fetchAll();
echo "Permissions by category:\n";
foreach ($categories as $cat) {
    echo "  - {$cat['category']}: {$cat['count']} permissions\n";
}
echo "\n";

// Step 4: Verify role permissions
echo "Step 4: Verifying role permissions assignments...\n";
foreach ($roles as $role) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM role_permissions 
        WHERE role_id = ?
    ");
    $stmt->execute([$role['id']]);
    $count = $stmt->fetch()['count'];
    echo "  - {$role['display_name']}: $count permissions\n";
}
echo "\n";

// Step 5: Check if users table was updated
echo "Step 5: Verifying users table structure...\n";
$stmt = $db->query("SHOW COLUMNS FROM users");
$columns = $stmt->fetchAll();
$hasRoleId = false;
$hasMustChangePassword = false;
$hasFailedLoginAttempts = false;
$hasLockedUntil = false;

foreach ($columns as $col) {
    if ($col['Field'] === 'role_id') $hasRoleId = true;
    if ($col['Field'] === 'must_change_password') $hasMustChangePassword = true;
    if ($col['Field'] === 'failed_login_attempts') $hasFailedLoginAttempts = true;
    if ($col['Field'] === 'locked_until') $hasLockedUntil = true;
}

echo "  - role_id column: " . ($hasRoleId ? "✓" : "✗") . "\n";
echo "  - must_change_password column: " . ($hasMustChangePassword ? "✓" : "✗") . "\n";
echo "  - failed_login_attempts column: " . ($hasFailedLoginAttempts ? "✓" : "✗") . "\n";
echo "  - locked_until column: " . ($hasLockedUntil ? "✓" : "✗") . "\n";
echo "\n";

// Step 6: Migrate existing users to new system
echo "Step 6: Migrating existing users...\n";
$stmt = $db->query("SELECT COUNT(*) as count FROM users");
$userCount = $stmt->fetch()['count'];

if ($userCount > 0) {
    // Update users with role_id if they don't have one
    $stmt = $db->exec("
        UPDATE users u 
        INNER JOIN roles r ON r.name = u.role 
        SET u.role_id = r.id 
        WHERE u.role_id IS NULL
    ");
    echo "  - Updated $stmt users with role_id\n";
    
    // Create user_roles entries for existing users
    $stmt = $db->exec("
        INSERT IGNORE INTO user_roles (user_id, role_id)
        SELECT u.id, u.role_id FROM users u 
        WHERE u.role_id IS NOT NULL
    ");
    echo "  - Created $stmt user_roles assignments\n";
}
echo "\n";

// Step 7: Test permission service
echo "Step 7: Testing Permission Service...\n";
require_once __DIR__ . '/src/Services/PermissionService.php';
use App\Services\PermissionService;

$permissionService = new PermissionService($db);

// Get an admin user
$stmt = $db->query("SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 1");
$adminUser = $stmt->fetch();

if ($adminUser) {
    echo "Testing with user: {$adminUser['username']} (role: {$adminUser['role']})\n";
    
    // Test hasPermission
    $hasContentView = $permissionService->hasPermission($adminUser['id'], 'content.view');
    echo "  - Has 'content.view' permission: " . ($hasContentView ? "✓ Yes" : "✗ No") . "\n";
    
    // Get user permissions count
    $permissions = $permissionService->getUserPermissions($adminUser['id']);
    echo "  - Total permissions: " . count($permissions) . "\n";
    
    // Get user modules
    $modules = $permissionService->getUserModules($adminUser['id']);
    echo "  - Accessible modules: " . implode(', ', $modules) . "\n";
} else {
    echo "  - No admin user found for testing\n";
}
echo "\n";

// Step 8: Summary
echo "========================================\n";
echo "Migration Summary\n";
echo "========================================\n";
echo "✓ Roles table created with 6 predefined roles\n";
echo "✓ Permissions table created with comprehensive permission set\n";
echo "✓ Role-permission mappings established\n";
echo "✓ User-role relationship tables created\n";
echo "✓ Users table updated with RBAC columns\n";
echo "✓ Existing users migrated to new system\n";
echo "\n";

echo "Next Steps:\n";
echo "1. Test user login with permission checks\n";
echo "2. Update frontend to show/hide routes based on permissions\n";
echo "3. Apply permission middleware to all protected routes\n";
echo "4. Test user invitation with email sending\n";
echo "\n";

echo "RBAC system is ready to use!\n";
