<?php
/**
 * Check Database Structure
 * Quick script to see what columns exist in key tables
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    echo "=== Database Structure Check ===\n\n";

    // Check users table
    echo "USERS table columns:\n";
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }

    echo "\nROLES table columns:\n";
    $stmt = $db->query("DESCRIBE roles");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }

    echo "\nPERMISSIONS table columns:\n";
    $stmt = $db->query("DESCRIBE permissions");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }

    echo "\nUSER_PERMISSIONS table columns:\n";
    $stmt = $db->query("DESCRIBE user_permissions");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }

    echo "\nExisting roles:\n";
    $stmt = $db->query("SELECT * FROM roles");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($roles as $role) {
        echo "  ID: {$role['id']}, Name: {$role['name']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
