<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$dbname = $_ENV['DB_NAME'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];
$port = $_ENV['DB_PORT'] ?? 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Adding curriculum and tools permissions...\n\n";

    // Add permissions
    $permissions = [
        ['name' => 'curriculum.view', 'display_name' => 'View Curriculum', 'description' => 'Can view curriculum and tools', 'category' => 'curriculum', 'module' => 'curriculum'],
        ['name' => 'curriculum.create', 'display_name' => 'Create Curriculum', 'description' => 'Can create curriculum items', 'category' => 'curriculum', 'module' => 'curriculum'],
        ['name' => 'curriculum.edit', 'display_name' => 'Edit Curriculum', 'description' => 'Can edit curriculum items', 'category' => 'curriculum', 'module' => 'curriculum'],
        ['name' => 'curriculum.delete', 'display_name' => 'Delete Curriculum', 'description' => 'Can delete curriculum items', 'category' => 'curriculum', 'module' => 'curriculum'],
        ['name' => 'tools.view', 'display_name' => 'View Tools', 'description' => 'Can view tools configuration', 'category' => 'tools', 'module' => 'tools'],
        ['name' => 'tools.create', 'display_name' => 'Create Tools', 'description' => 'Can create tools', 'category' => 'tools', 'module' => 'tools'],
        ['name' => 'tools.edit', 'display_name' => 'Edit Tools', 'description' => 'Can edit tools', 'category' => 'tools', 'module' => 'tools'],
        ['name' => 'tools.delete', 'display_name' => 'Delete Tools', 'description' => 'Can delete tools', 'category' => 'tools', 'module' => 'tools'],
    ];

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO permissions (name, display_name, description, category, module, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");

    foreach ($permissions as $perm) {
        $stmt->execute([
            $perm['name'],
            $perm['display_name'],
            $perm['description'],
            $perm['category'],
            $perm['module']
        ]);

        if ($stmt->rowCount() > 0) {
            echo "✓ Added permission: {$perm['name']}\n";
        } else {
            echo "- Permission already exists: {$perm['name']}\n";
        }
    }

    // Assign to admin role
    echo "\nAssigning permissions to admin role...\n";
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'admin'
        AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete')
        AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp
            WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    ");
    $stmt->execute();
    echo "✓ Assigned to admin role\n";

    // Assign to content_editor role
    echo "Assigning permissions to content_editor role...\n";
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'content_editor'
        AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete')
        AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp
            WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    ");
    $stmt->execute();
    echo "✓ Assigned to content_editor role\n";

    // Assign to program_manager role
    echo "Assigning permissions to program_manager role...\n";
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'program_manager'
        AND p.name IN ('curriculum.view', 'curriculum.create', 'curriculum.edit', 'curriculum.delete', 'tools.view', 'tools.create', 'tools.edit', 'tools.delete')
        AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp
            WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    ");
    $stmt->execute();
    echo "✓ Assigned to program_manager role\n";

    // Assign roles to unassigned users
    echo "\nAssigning admin role to unassigned users...\n";
    $stmt = $pdo->query("
        INSERT IGNORE INTO user_roles (user_id, role_id, created_at)
        SELECT u.id, r.id, NOW()
        FROM users u
        CROSS JOIN roles r
        WHERE r.name = 'admin'
        AND NOT EXISTS (
            SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
        )
    ");
    $affected = $stmt->rowCount();
    echo "✓ Assigned admin role to $affected users\n";

    echo "\n✅ All permissions added and assigned successfully!\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
