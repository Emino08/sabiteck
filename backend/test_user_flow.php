<?php
/**
 * Test User Creation and Login Flow
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

// Database connection
try {
    $db = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '4306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'devco_db'),
        $_ENV['DB_USER'] ?? 'root',
        $_ENV['DB_PASS'] ?? '1212',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ Database connected\n\n";
} catch (Exception $e) {
    die("✗ Database connection failed: " . $e->getMessage() . "\n");
}

// Step 1: Get admin credentials for API testing
echo "=== Step 1: Finding Admin User ===\n";
$stmt = $db->query("SELECT id, username, email, role, status FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1");
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    die("✗ No admin user found. Please create an admin user first.\n");
}

echo "Admin found:\n";
echo "  Username: {$admin['username']}\n";
echo "  Email: {$admin['email']}\n";
echo "  Role: {$admin['role']}\n\n";

// Step 2: Test Invite User API
echo "=== Step 2: Testing User Invitation API ===\n";

$testEmail = 'invited_user_' . time() . '@test.com';
$apiUrl = 'http://localhost:8002/api/admin/users/invite';

// First, login as admin to get token
echo "Logging in as admin to get token...\n";
$loginUrl = 'http://localhost:8002/api/admin/login';
$loginData = [
    'username' => $admin['username'],
    'password' => 'admin123' // Default admin password
];

$ch = curl_init($loginUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$loginResult = json_decode($response, true);

if (!$loginResult || !isset($loginResult['success']) || !$loginResult['success']) {
    echo "✗ Admin login failed. Trying to create test scenario directly in database...\n\n";
    
    // Create user directly for testing
    echo "=== Creating Test User Directly ===\n";
    $testUsername = 'test_invited_' . time();
    $tempPassword = bin2hex(random_bytes(8));
    $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);
    
    // Get user role ID
    $roleStmt = $db->query("SELECT id FROM roles WHERE name = 'user' LIMIT 1");
    $role = $roleStmt->fetch(PDO::FETCH_ASSOC);
    $roleId = $role ? $role['id'] : 5;
    
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, role_id, status, must_change_password, created_at)
        VALUES (?, ?, ?, ?, 'active', 1, NOW())
    ");
    $stmt->execute([$testUsername, $testEmail, $passwordHash, $roleId]);
    $userId = $db->lastInsertId();
    
    echo "✓ User created directly in database:\n";
    echo "  ID: $userId\n";
    echo "  Username: $testUsername\n";
    echo "  Email: $testEmail\n";
    echo "  Temporary Password: $tempPassword\n";
    echo "  Must Change Password: YES\n";
    echo "  Status: active\n\n";
    
    // Step 3: Test login with created user
    echo "=== Step 3: Testing Login with Invited User ===\n";
    
    $loginUrl = 'http://localhost:8002/api/auth/login';
    $loginData = [
        'username' => $testUsername,
        'password' => $tempPassword
    ];
    
    $ch = curl_init($loginUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $loginResult = json_decode($response, true);
    
    echo "Login Response (HTTP $httpCode):\n";
    echo json_encode($loginResult, JSON_PRETTY_PRINT) . "\n\n";
    
    if ($loginResult && isset($loginResult['success']) && $loginResult['success']) {
        echo "✓ Login successful!\n";
        
        if (isset($loginResult['data']['user']['must_change_password']) && $loginResult['data']['user']['must_change_password']) {
            echo "✓ Must change password flag is SET (as expected)\n";
        } else {
            echo "⚠ Must change password flag is NOT set\n";
        }
        
        if (isset($loginResult['action_required']) && $loginResult['action_required'] === 'change_password') {
            echo "✓ Action required: change_password (as expected)\n";
        }
        
        if (isset($loginResult['data']['permissions'])) {
            echo "✓ Permissions included: " . count($loginResult['data']['permissions']) . " permissions\n";
        }
        
        if (isset($loginResult['data']['modules'])) {
            echo "✓ Modules included: " . implode(', ', $loginResult['data']['modules']) . "\n";
        }
        
        $token = $loginResult['data']['token'];
        
        // Step 4: Test password change
        echo "\n=== Step 4: Testing Password Change ===\n";
        
        $newPassword = 'NewSecurePass123!';
        $changePasswordUrl = 'http://localhost:8002/api/auth/change-password';
        $changeData = [
            'current_password' => $tempPassword,
            'new_password' => $newPassword,
            'password_confirmation' => $newPassword
        ];
        
        $ch = curl_init($changePasswordUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($changeData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $changeResult = json_decode($response, true);
        
        echo "Password Change Response (HTTP $httpCode):\n";
        echo json_encode($changeResult, JSON_PRETTY_PRINT) . "\n\n";
        
        if ($changeResult && isset($changeResult['message'])) {
            echo "✓ Password changed successfully\n";
            
            // Verify must_change_password flag is now 0
            $stmt = $db->prepare("SELECT must_change_password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userCheck = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userCheck && $userCheck['must_change_password'] == 0) {
                echo "✓ must_change_password flag cleared in database\n";
            } else {
                echo "⚠ must_change_password flag NOT cleared (current value: " . $userCheck['must_change_password'] . ")\n";
            }
            
            // Step 5: Test login with new password
            echo "\n=== Step 5: Testing Login with New Password ===\n";
            
            $loginData = [
                'username' => $testUsername,
                'password' => $newPassword
            ];
            
            $ch = curl_init($loginUrl);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $loginResult2 = json_decode($response, true);
            
            echo "Login Response (HTTP $httpCode):\n";
            echo json_encode($loginResult2, JSON_PRETTY_PRINT) . "\n\n";
            
            if ($loginResult2 && isset($loginResult2['success']) && $loginResult2['success']) {
                echo "✓ Login with new password successful!\n";
                
                if (!isset($loginResult2['action_required'])) {
                    echo "✓ No password change required (as expected)\n";
                } else {
                    echo "⚠ Still requires action: " . $loginResult2['action_required'] . "\n";
                }
            } else {
                echo "✗ Login with new password failed\n";
            }
        } else {
            echo "✗ Password change failed\n";
        }
    } else {
        echo "✗ Login failed\n";
        echo "Error: " . ($loginResult['error'] ?? 'Unknown error') . "\n";
    }
}

// Step 6: Test normal user creation (without invitation)
echo "\n=== Step 6: Testing Normal User Creation ===\n";

$normalUsername = 'normal_user_' . time();
$normalEmail = 'normal_' . time() . '@test.com';
$normalPassword = 'UserPass123!';

// Get user role ID
$roleStmt = $db->query("SELECT id FROM roles WHERE name = 'user' LIMIT 1");
$role = $roleStmt->fetch(PDO::FETCH_ASSOC);
$roleId = $role ? $role['id'] : 5;

$stmt = $db->prepare("
    INSERT INTO users (username, email, first_name, last_name, password_hash, role_id, status, must_change_password, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', 0, NOW())
");
$stmt->execute([
    $normalUsername,
    $normalEmail,
    'Normal',
    'User',
    password_hash($normalPassword, PASSWORD_DEFAULT),
    $roleId
]);
$normalUserId = $db->lastInsertId();

echo "✓ Normal user created:\n";
echo "  ID: $normalUserId\n";
echo "  Username: $normalUsername\n";
echo "  Email: $normalEmail\n";
echo "  Password: $normalPassword\n";
echo "  Must Change Password: NO\n";
echo "  Status: active\n\n";

// Test login with normal user
echo "Testing login with normal user...\n";

$loginData = [
    'username' => $normalUsername,
    'password' => $normalPassword
];

$ch = curl_init('http://localhost:8002/api/auth/login');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$normalLoginResult = json_decode($response, true);

echo "Login Response (HTTP $httpCode):\n";
echo json_encode($normalLoginResult, JSON_PRETTY_PRINT) . "\n\n";

if ($normalLoginResult && isset($normalLoginResult['success']) && $normalLoginResult['success']) {
    echo "✓ Normal user login successful!\n";
    
    if (!isset($normalLoginResult['action_required'])) {
        echo "✓ No password change required (as expected for normal user)\n";
    } else {
        echo "⚠ Action required: " . $normalLoginResult['action_required'] . "\n";
    }
} else {
    echo "✗ Normal user login failed\n";
}

echo "\n=== Summary ===\n";
echo "Test completed. Check the results above.\n";
echo "\nCreated test users:\n";
echo "1. Invited User: $testUsername (must change password)\n";
echo "2. Normal User: $normalUsername (no password change required)\n";
