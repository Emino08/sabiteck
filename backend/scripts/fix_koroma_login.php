<?php
/**
 * Fix koromaemmanuel66@gmail.com login issue
 * Reset password to a known value and verify hash
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DevCo\Models\Database;

try {
    echo "\n=== Fixing Login for koromaemmanuel66@gmail.com ===\n\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    $db = Database::getInstance();

    // Check current user state
    echo "Step 1: Checking current user state...\n";
    $stmt = $db->prepare("
        SELECT id, username, email, password_hash, role, status, email_verified 
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "  ✗ User not found!\n";
        exit(1);
    }

    echo "  ✓ User found: {$user['username']}\n";
    echo "  Current status: {$user['status']}\n";
    echo "  Email verified: " . ($user['email_verified'] ? 'Yes' : 'No') . "\n";
    echo "  Current password hash: " . substr($user['password_hash'], 0, 20) . "...\n\n";

    // Test the provided password
    echo "Step 2: Testing provided password (5f0e5d6db76e5591)...\n";
    $providedPassword = '5f0e5d6db76e5591';
    
    if (password_verify($providedPassword, $user['password_hash'])) {
        echo "  ✓ Provided password is CORRECT - hash is valid\n";
        echo "  Issue might be with status or email verification\n\n";
    } else {
        echo "  ✗ Provided password does NOT match current hash\n";
        echo "  Updating password hash...\n";
        
        // Create new hash
        $newHash = password_hash($providedPassword, PASSWORD_DEFAULT);
        
        // Update password
        $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$newHash, $user['id']]);
        
        echo "  ✓ Password hash updated\n\n";
        
        // Verify the update
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $newUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($providedPassword, $newUser['password_hash'])) {
            echo "  ✓ Verification successful - password now works\n\n";
        } else {
            echo "  ✗ Verification failed - something went wrong\n\n";
        }
    }

    // Step 3: Ensure user is active
    echo "Step 3: Ensuring user is active and verified...\n";
    $stmt = $db->prepare("
        UPDATE users 
        SET status = 'active', 
            email_verified = 1,
            failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);
    echo "  ✓ User status set to active\n";
    echo "  ✓ Email verified\n";
    echo "  ✓ Failed login attempts reset\n";
    echo "  ✓ Account unlocked\n\n";

    // Step 4: Verify final state
    echo "Step 4: Final verification...\n";
    $stmt = $db->prepare("
        SELECT id, username, email, role, status, email_verified, 
               failed_login_attempts, locked_until 
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $finalUser = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "  Username: {$finalUser['username']}\n";
    echo "  Email: {$finalUser['email']}\n";
    echo "  Role: {$finalUser['role']}\n";
    echo "  Status: {$finalUser['status']}\n";
    echo "  Email Verified: " . ($finalUser['email_verified'] ? 'Yes' : 'No') . "\n";
    echo "  Failed Login Attempts: {$finalUser['failed_login_attempts']}\n";
    echo "  Locked Until: " . ($finalUser['locked_until'] ?? 'Not locked') . "\n\n";

    // Step 5: Test password one more time
    echo "Step 5: Final password test...\n";
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE email = ?");
    $stmt->execute(['koromaemmanuel66@gmail.com']);
    $testUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (password_verify($providedPassword, $testUser['password_hash'])) {
        echo "  ✓ Password verification SUCCESSFUL\n";
        echo "\n╔════════════════════════════════════════════════════════════╗\n";
        echo "║                    LOGIN CREDENTIALS                       ║\n";
        echo "╚════════════════════════════════════════════════════════════╝\n";
        echo "  Email:    koromaemmanuel66@gmail.com\n";
        echo "  Password: 5f0e5d6db76e5591\n";
        echo "  Status:   READY TO LOGIN\n";
        echo "\n";
    } else {
        echo "  ✗ Password verification FAILED\n";
        echo "  Creating alternative password...\n";
        
        $altPassword = 'Koroma@2025';
        $altHash = password_hash($altPassword, PASSWORD_DEFAULT);
        
        $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$altHash, $user['id']]);
        
        echo "\n╔════════════════════════════════════════════════════════════╗\n";
        echo "║                    NEW LOGIN CREDENTIALS                   ║\n";
        echo "╚════════════════════════════════════════════════════════════╝\n";
        echo "  Email:    koromaemmanuel66@gmail.com\n";
        echo "  Password: Koroma@2025\n";
        echo "  Status:   READY TO LOGIN\n";
        echo "\n";
    }

    echo "✓ Login fix complete!\n\n";
    echo "You can now try to login with the credentials shown above.\n";

} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
