<?php
/**
 * Reset Password for koromaemmanuel66@gmail.com
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Resetting Password for koromaemmanuel66@gmail.com ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    $email = 'koromaemmanuel66@gmail.com';
    $newPassword = '5f0e5d6db76e5591';

    // Get user
    $stmt = $db->prepare("SELECT id, username FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "User not found!\n";
        exit(1);
    }

    echo "User: {$user['username']}\n";
    echo "Setting password: {$newPassword}\n\n";

    // Create new hash
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    echo "New hash: " . substr($newHash, 0, 30) . "...\n\n";

    // Update password
    $stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$newHash, $user['id']]);

    echo "✓ Password updated\n\n";

    // Test the password
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $testHash = $stmt->fetchColumn();

    if (password_verify($newPassword, $testHash)) {
        echo "✅ Password verification successful!\n\n";
        echo "Login Credentials:\n";
        echo "  Email: koromaemmanuel66@gmail.com\n";
        echo "  Password: 5f0e5d6db76e5591\n";
        echo "  Login at: /admin\n\n";
    } else {
        echo "✗ Verification failed\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
