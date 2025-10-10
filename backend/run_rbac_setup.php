<?php
/**
 * Setup RBAC Role Permissions
 * Run this script to configure all role permissions as specified
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

try {
    $db = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '4306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'devco_db'),
        $_ENV['DB_USER'] ?? 'root',
        $_ENV['DB_PASS'] ?? '1212',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         RBAC ROLE PERMISSIONS SETUP                           ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";

    // Read and execute SQL file
    $sql = file_get_contents(__DIR__ . '/setup_role_permissions.sql');
    
    // Split into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $db->beginTransaction();
    
    foreach ($statements as $statement) {
        // Skip comments and empty statements
        if (empty($statement) || str_starts_with($statement, '--')) {
            continue;
        }
        
        // Skip SELECT statements for now (we'll run them separately)
        if (stripos($statement, 'SELECT') === 0) {
            continue;
        }
        
        try {
            $db->exec($statement);
        } catch (PDOException $e) {
            // Ignore duplicate entry errors
            if ($e->getCode() != 23000) {
                throw $e;
            }
        }
    }
    
    $db->commit();
    
    echo "✅ Permissions and roles created successfully\n\n";
    
    // Now verify the setup
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         VERIFICATION RESULTS                                  ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";
    
    $stmt = $db->query("
        SELECT 
            r.name as role_name,
            r.display_name,
            COUNT(rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.name IN ('admin', 'content_editor', 'program_manager', 'marketing_officer', 'analyst', 'blogger')
        GROUP BY r.id, r.name, r.display_name
        ORDER BY r.name
    ");
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $result) {
        echo str_pad($result['display_name'], 25) . " : " . $result['permission_count'] . " permissions\n";
    }
    
    echo "\n\n";
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║         BLOGGER ROLE PERMISSIONS (Sample)                     ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";
    
    $bloggerStmt = $db->query("
        SELECT p.name, p.display_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.name = 'blogger'
        ORDER BY p.name
    ");
    
    $bloggerPerms = $bloggerStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($bloggerPerms as $perm) {
        echo "  • " . str_pad($perm['display_name'], 40) . " (" . $perm['name'] . ")\n";
    }
    
    echo "\n✅ Setup completed successfully!\n";
    echo "\nNow you can:\n";
    echo "1. Login with your admin account\n";
    echo "2. Create/update users with the new roles\n";
    echo "3. Users will only see tabs they have permissions for\n\n";
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
