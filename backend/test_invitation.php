<?php
/**
 * Test User Invitation with Email
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
echo "║         USER INVITATION TEST (Direct Method)              ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Test email
$testEmail = 'test_invite_' . time() . '@example.com';
$roleId = 5; // User role

echo "Testing invitation for: $testEmail\n";
echo "Role ID: $roleId\n\n";

try {
    // Generate username from email
    $emailParts = explode('@', $testEmail);
    $baseUsername = preg_replace('/[^a-zA-Z0-9_]/', '', $emailParts[0]);
    
    // Ensure username is unique
    $username = $baseUsername;
    $counter = 1;
    while (true) {
        $checkStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
        $checkStmt->execute([$username]);
        if (!$checkStmt->fetch()) {
            break;
        }
        $username = $baseUsername . $counter;
        $counter++;
    }
    
    echo "✅ Generated username: $username\n";
    
    // Generate temporary password
    $tempPassword = bin2hex(random_bytes(8));
    $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);
    
    echo "✅ Generated temporary password: $tempPassword\n";
    
    // Create user
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, role_id, organization_id, status, must_change_password, created_at)
        VALUES (?, ?, ?, ?, NULL, 'active', 1, NOW())
    ");
    $stmt->execute([$username, $testEmail, $passwordHash, $roleId]);
    $userId = $db->lastInsertId();
    
    echo "✅ User created with ID: $userId\n\n";
    
    // Test email sending
    echo "┌─ Testing Email Sending ──────────────────────────────────┐\n";
    
    // Get role name for email
    $stmt = $db->prepare("SELECT name FROM roles WHERE id = ?");
    $stmt->execute([$roleId]);
    $role = $stmt->fetch();
    
    if ($role) {
        echo "✅ Role found: {$role['name']}\n";
        
        // Check if it's an admin role
        $isAdmin = in_array($role['name'], ['admin', 'super_admin', 'super-admin']);
        $loginUrl = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . ($isAdmin ? '/admin' : '/login');
        $accountType = $isAdmin ? 'Admin' : 'User';
        
        echo "✅ Account type: $accountType\n";
        echo "✅ Login URL: $loginUrl\n";
        echo "└──────────────────────────────────────────────────────────┘\n\n";
        
        // Try to send email
        echo "Attempting to send invitation email...\n";
        
        require_once __DIR__ . '/src/Services/EmailService.php';
        
        $emailConfig = [
            'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
            'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
            'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
            'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
            'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
            'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
            'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabiteck Authentication'
        ];
        
        $emailService = new \App\Services\EmailService($emailConfig);
        
        $subject = 'Test Invitation - Sabiteck Limited';
        
        $body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background: #007bff; color: white; padding: 20px; text-align: center;'>
                <h1>Welcome to Sabiteck Limited</h1>
            </div>
            <div style='padding: 30px; background: #f8f9fa;'>
                <h2>You've been invited to join our platform!</h2>
                <p>Hello,</p>
                <p>You have been invited to create an <strong>{$accountType} account</strong> on Sabiteck Limited.</p>
                
                <div style='background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;'>
                    <p><strong>Account Type:</strong> {$accountType}</p>
                    <p><strong>Username:</strong> {$username}</p>
                    <p><strong>Email:</strong> {$testEmail}</p>
                    <p><strong>Temporary Password:</strong> <code style='background: #e9ecef; padding: 4px 8px; border-radius: 4px;'>{$tempPassword}</code></p>
                </div>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{$loginUrl}' style='background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>Login to Your Account</a>
                </div>
                
                <p style='background: #fff3cd; padding: 15px; border-radius: 6px;'><strong>Important:</strong> Please change your password after your first login.</p>
            </div>
        </div>";
        
        $result = $emailService->sendEmail($testEmail, $subject, $body, true);
        
        if ($result) {
            echo "✅ Email sent successfully!\n";
        } else {
            echo "❌ Email sending failed: " . $emailService->getLastError() . "\n";
        }
    } else {
        echo "❌ Role not found!\n";
    }
    
    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║                    TEST SUMMARY                            ║\n";
    echo "╠════════════════════════════════════════════════════════════╣\n";
    echo "║ User ID: " . str_pad($userId, 51) . " ║\n";
    echo "║ Username: " . str_pad($username, 50) . " ║\n";
    echo "║ Email: " . str_pad($testEmail, 53) . " ║\n";
    echo "║ Password: " . str_pad($tempPassword, 50) . " ║\n";
    echo "║ Status: active                                             ║\n";
    echo "║ Must Change Password: YES                                  ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
