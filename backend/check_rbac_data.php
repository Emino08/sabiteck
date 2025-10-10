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

    echo "=== EXISTING ROLES ===\n";
    $stmt = $pdo->query("SELECT * FROM roles ORDER BY id");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($roles as $role) {
        echo sprintf("ID: %d | Name: %s | Display: %s\n",
            $role['id'], $role['name'], $role['display_name']);
        echo "  Description: {$role['description']}\n\n";
    }

    echo "=== EXISTING PERMISSIONS ===\n";
    $stmt = $pdo->query("SELECT * FROM permissions ORDER BY category, name");
    $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $byCategory = [];
    foreach ($permissions as $perm) {
        $cat = $perm['category'] ?? 'uncategorized';
        if (!isset($byCategory[$cat])) {
            $byCategory[$cat] = [];
        }
        $byCategory[$cat][] = $perm;
    }

    foreach ($byCategory as $cat => $perms) {
        echo "\n[$cat]\n";
        foreach ($perms as $perm) {
            echo sprintf("  - %s (%s)\n", $perm['name'], $perm['display_name']);
        }
    }

    echo "\n\n=== ROLE PERMISSIONS MAPPING ===\n";
    foreach ($roles as $role) {
        echo "\n{$role['display_name']} ({$role['name']}):\n";
        $stmt = $pdo->prepare("
            SELECT p.name, p.display_name, p.category
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.category, p.name
        ");
        $stmt->execute([$role['id']]);
        $rolePerms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $byCat = [];
        foreach ($rolePerms as $perm) {
            $cat = $perm['category'] ?? 'uncategorized';
            if (!isset($byCat[$cat])) {
                $byCat[$cat] = [];
            }
            $byCat[$cat][] = $perm['name'];
        }

        foreach ($byCat as $cat => $permNames) {
            echo "  [$cat]: " . implode(', ', $permNames) . "\n";
        }
    }

    echo "\n\n=== USER ROLE ASSIGNMENTS ===\n";
    $stmt = $pdo->query("
        SELECT u.id, u.username, u.email, u.role, r.name as role_name, r.display_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $user) {
        echo sprintf("User: %s (%s) | Legacy Role: %s | RBAC Role: %s\n",
            $user['username'],
            $user['email'],
            $user['role'] ?? 'none',
            $user['role_name'] ?? 'none'
        );
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
