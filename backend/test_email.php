<?php
/**
 * Email Configuration Test Script
 * This script tests the email configuration for user invitations
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

use App\Services\EmailService;

echo "=== Email Configuration Test ===\n\n";

// Display configuration
echo "AUTH_SMTP_HOST: " . ($_ENV['AUTH_SMTP_HOST'] ?? 'NOT SET') . "\n";
echo "AUTH_SMTP_PORT: " . ($_ENV['AUTH_SMTP_PORT'] ?? 'NOT SET') . "\n";
echo "AUTH_SMTP_USER: " . ($_ENV['AUTH_SMTP_USER'] ?? 'NOT SET') . "\n";
echo "AUTH_SMTP_ENCRYPTION: " . ($_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'NOT SET') . "\n";
echo "AUTH_FROM_EMAIL: " . ($_ENV['AUTH_FROM_EMAIL'] ?? 'NOT SET') . "\n\n";

// Test email configuration
$emailConfig = [
    'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
    'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
    'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
    'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
    'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
    'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
    'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabitech Authentication'
];

$emailService = new EmailService($emailConfig);

echo "Testing SMTP connection...\n";
$connectionTest = $emailService->testConnection();

if ($connectionTest['success']) {
    echo "✓ SMTP connection successful!\n\n";
    echo "Configuration used:\n";
    print_r($connectionTest['config']);
    
    // Ask if user wants to send a test email
    echo "\n\nDo you want to send a test invitation email? (yes/no): ";
    $handle = fopen("php://stdin", "r");
    $answer = trim(fgets($handle));
    
    if (strtolower($answer) === 'yes' || strtolower($answer) === 'y') {
        echo "Enter recipient email address: ";
        $testEmail = trim(fgets($handle));
        
        if (filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
            echo "\nSending test invitation email to $testEmail...\n";
            
            $subject = 'Test Invitation - Sabiteck Limited';
            $testUsername = 'test_user';
            $testPassword = 'TestPass123!';
            $loginUrl = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . '/login';
            
            $body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: #007bff; color: white; padding: 20px; text-align: center;'>
                    <h1>Welcome to Sabiteck Limited</h1>
                </div>
                <div style='padding: 30px; background: #f8f9fa;'>
                    <h2>Test Invitation Email</h2>
                    <p>Hello,</p>
                    <p>This is a test invitation email to verify email configuration.</p>
                    
                    <div style='background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;'>
                        <p><strong>Username:</strong> {$testUsername}</p>
                        <p><strong>Email:</strong> {$testEmail}</p>
                        <p><strong>Temporary Password:</strong> <code style='background: #e9ecef; padding: 4px 8px; border-radius: 4px;'>{$testPassword}</code></p>
                    </div>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$loginUrl}' style='background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>Login to Your Account</a>
                    </div>
                    
                    <p>This is a test email. If you received this, the email configuration is working correctly!</p>
                </div>
                <div style='background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;'>
                    <p>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
                </div>
            </div>";
            
            $result = $emailService->sendEmail($testEmail, $subject, $body, true, 'Test User');
            
            if ($result) {
                echo "✓ Test email sent successfully!\n";
                echo "Please check your inbox at $testEmail\n";
            } else {
                echo "✗ Failed to send test email\n";
                echo "Error: " . $emailService->getLastError() . "\n";
            }
        } else {
            echo "Invalid email address format.\n";
        }
    }
    
    fclose($handle);
} else {
    echo "✗ SMTP connection failed!\n";
    echo "Error: " . $connectionTest['message'] . "\n";
    echo "\nPlease check your email configuration in .env file:\n";
    echo "- AUTH_SMTP_HOST\n";
    echo "- AUTH_SMTP_PORT\n";
    echo "- AUTH_SMTP_USER\n";
    echo "- AUTH_SMTP_PASS\n";
    echo "- AUTH_SMTP_ENCRYPTION\n";
}

echo "\n=== Test Complete ===\n";
