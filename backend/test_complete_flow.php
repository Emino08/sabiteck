<?php
/**
 * Complete User Invitation and Login Test
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
$db = new PDO(
    'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '4306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'devco_db'),
    $_ENV['DB_USER'] ?? 'root',
    $_ENV['DB_PASS'] ?? '1212',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║    USER INVITATION & LOGIN COMPREHENSIVE TEST              ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// TEST 1: Create Invited User (with must_change_password = 1)
echo "┌─ TEST 1: Creating Invited User ─────────────────────────┐\n";

$invitedUsername = 'invited_' . time();
$invitedEmail = 'invited_' . time() . '@test.com';
$tempPassword = bin2hex(random_bytes(8));
$passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

$roleStmt = $db->query("SELECT id FROM roles WHERE name = 'user' LIMIT 1");
$role = $roleStmt->fetch(PDO::FETCH_ASSOC);
$roleId = $role ? $role['id'] : 5;

$stmt = $db->prepare("
    INSERT INTO users (username, email, password_hash, role_id, status, must_change_password, created_at)
    VALUES (?, ?, ?, ?, 'active', 1, NOW())
");
$stmt->execute([$invitedUsername, $invitedEmail, $passwordHash, $roleId]);
$invitedUserId = $db->lastInsertId();

echo "✅ Invited user created:\n";
echo "   • ID: $invitedUserId\n";
echo "   • Username: $invitedUsername\n";
echo "   • Email: $invitedEmail\n";
echo "   • Temp Password: $tempPassword\n";
echo "   • Status: active\n";
echo "   • Must Change Password: YES (1)\n";
echo "└──────────────────────────────────────────────────────────┘\n\n";

// TEST 2: Login with Invited User
echo "┌─ TEST 2: Login with Invited User Credentials ───────────┐\n";

$loginUrl = 'http://localhost:8002/api/auth/login';
$loginData = [
    'username' => $invitedUsername,
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

echo "HTTP Status: $httpCode\n";

if ($loginResult && isset($loginResult['success']) && $loginResult['success']) {
    echo "✅ Login SUCCESSFUL\n";
    echo "   • User ID: " . $loginResult['data']['user']['id'] . "\n";
    echo "   • Username: " . $loginResult['data']['user']['username'] . "\n";
    
    if (isset($loginResult['data']['user']['must_change_password'])) {
        $mustChange = $loginResult['data']['user']['must_change_password'];
        echo "   • Must Change Password: " . ($mustChange ? "YES ✅" : "NO ❌") . "\n";
    }
    
    if (isset($loginResult['action_required'])) {
        echo "   • Action Required: " . $loginResult['action_required'] . " ✅\n";
    } else {
        echo "   • Action Required: NONE ⚠️\n";
    }
    
    if (isset($loginResult['data']['permissions'])) {
        echo "   • Permissions: " . count($loginResult['data']['permissions']) . " permissions loaded ✅\n";
    }
    
    if (isset($loginResult['data']['modules'])) {
        $modules = is_array($loginResult['data']['modules']) ? $loginResult['data']['modules'] : [];
        echo "   • Modules: " . (count($modules) > 0 ? implode(', ', $modules) : 'none') . " ✅\n";
    }
    
    $token = $loginResult['data']['token'];
    echo "└──────────────────────────────────────────────────────────┘\n\n";
    
    // TEST 3: Change Password
    echo "┌─ TEST 3: Change Password (First Login) ─────────────────┐\n";
    
    $newPassword = 'SecureNewPass123!';
    $changePasswordUrl = 'http://localhost:8002/api/user/change-password';
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
    
    echo "HTTP Status: $httpCode\n";
    
    if ($changeResult && isset($changeResult['message'])) {
        echo "✅ Password change SUCCESSFUL\n";
        echo "   • Message: " . $changeResult['message'] . "\n";
        
        // Verify database update
        $stmt = $db->prepare("SELECT must_change_password FROM users WHERE id = ?");
        $stmt->execute([$invitedUserId]);
        $userCheck = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userCheck && $userCheck['must_change_password'] == 0) {
            echo "   • Database Flag Cleared: YES ✅\n";
        } else {
            echo "   • Database Flag Cleared: NO ❌ (value: " . $userCheck['must_change_password'] . ")\n";
        }
        
        echo "└──────────────────────────────────────────────────────────┘\n\n";
        
        // TEST 4: Login with New Password
        echo "┌─ TEST 4: Login with New Password ───────────────────────┐\n";
        
        $loginData = [
            'username' => $invitedUsername,
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
        
        echo "HTTP Status: $httpCode\n";
        
        if ($loginResult2 && isset($loginResult2['success']) && $loginResult2['success']) {
            echo "✅ Login SUCCESSFUL\n";
            
            if (!isset($loginResult2['action_required'])) {
                echo "   • No Password Change Required: YES ✅\n";
            } else {
                echo "   • Still Requires Action: " . $loginResult2['action_required'] . " ❌\n";
            }
        } else {
            echo "❌ Login FAILED\n";
        }
    } else {
        echo "❌ Password change FAILED\n";
        echo "   • Error: " . ($changeResult['error'] ?? 'Unknown') . "\n";
    }
} else {
    echo "❌ Login FAILED\n";
    echo "   • Error: " . ($loginResult['error'] ?? 'Unknown') . "\n";
}

echo "└──────────────────────────────────────────────────────────┘\n\n";

// TEST 5: Normal User Creation (without must_change_password)
echo "┌─ TEST 5: Normal User Creation ──────────────────────────┐\n";

$normalUsername = 'normal_' . time();
$normalEmail = 'normal_' . time() . '@test.com';
$normalPassword = 'NormalPass123!';

$stmt = $db->prepare("
    INSERT INTO users (username, email, first_name, last_name, password_hash, role_id, status, must_change_password, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', 0, NOW())
");
$stmt->execute([
    $normalUsername,
    $normalEmail,
    'Normal',
    'TestUser',
    password_hash($normalPassword, PASSWORD_DEFAULT),
    $roleId
]);
$normalUserId = $db->lastInsertId();

echo "✅ Normal user created:\n";
echo "   • ID: $normalUserId\n";
echo "   • Username: $normalUsername\n";
echo "   • Email: $normalEmail\n";
echo "   • Password: $normalPassword\n";
echo "   • Must Change Password: NO (0)\n";
echo "   • Status: active\n";
echo "└──────────────────────────────────────────────────────────┘\n\n";

// TEST 6: Login with Normal User
echo "┌─ TEST 6: Login with Normal User ────────────────────────┐\n";

$loginData = [
    'username' => $normalUsername,
    'password' => $normalPassword
];

$ch = curl_init($loginUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$normalLoginResult = json_decode($response, true);

echo "HTTP Status: $httpCode\n";

if ($normalLoginResult && isset($normalLoginResult['success']) && $normalLoginResult['success']) {
    echo "✅ Login SUCCESSFUL\n";
    
    if (!isset($normalLoginResult['action_required'])) {
        echo "   • No Password Change Required: YES ✅\n";
    } else {
        echo "   • Action Required: " . $normalLoginResult['action_required'] . " ❌\n";
    }
    
    if (isset($normalLoginResult['data']['permissions'])) {
        echo "   • Permissions Loaded: YES ✅\n";
    }
    
    if (isset($normalLoginResult['data']['modules'])) {
        echo "   • Modules Loaded: YES ✅\n";
    }
} else {
    echo "❌ Login FAILED\n";
}

echo "└──────────────────────────────────────────────────────────┘\n\n";

// SUMMARY
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                      TEST SUMMARY                          ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";
echo "║ Test 1: Invited User Creation          │ ✅ PASSED         ║\n";
echo "║ Test 2: Invited User Login             │ ";
echo ($loginResult && $loginResult['success'] ? "✅ PASSED" : "❌ FAILED") . "         ║\n";
echo "║ Test 3: Password Change                │ ";
echo (isset($changeResult) && isset($changeResult['message']) ? "✅ PASSED" : "❌ FAILED") . "         ║\n";
echo "║ Test 4: Login After Password Change    │ ";
echo (isset($loginResult2) && $loginResult2['success'] ? "✅ PASSED" : "❌ FAILED") . "         ║\n";
echo "║ Test 5: Normal User Creation           │ ✅ PASSED         ║\n";
echo "║ Test 6: Normal User Login              │ ";
echo ($normalLoginResult && $normalLoginResult['success'] ? "✅ PASSED" : "❌ FAILED") . "         ║\n";
echo "╠════════════════════════════════════════════════════════════╣\n";
echo "║ Created Test Users:                                        ║\n";
echo "║ 1. $invitedUsername (invited, password changed)      ║\n";
echo "║ 2. $normalUsername (normal user)                     ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
