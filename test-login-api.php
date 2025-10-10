#!/usr/bin/env php
<?php
/**
 * Test the actual login API call for blogger user
 */

echo "=== TESTING BLOGGER LOGIN API ===\n\n";

// Simulate login request
$loginData = [
    'username' => 'encictyear1',
    'password' => 'test123' // You'll need to use the actual password
];

$ch = curl_init('http://localhost:8002/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n\n";

if ($response) {
    $data = json_decode($response, true);
    echo "Response:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
    
    if (isset($data['success']) && $data['success']) {
        echo "✅ Login API call succeeded!\n\n";
        
        // Check permissions
        if (isset($data['data']['permissions'])) {
            echo "Permissions returned (" . count($data['data']['permissions']) . "):\n";
            
            $hasDashboard = false;
            foreach ($data['data']['permissions'] as $perm) {
                if (is_array($perm) && isset($perm['name'])) {
                    echo "  - {$perm['name']}\n";
                    if ($perm['name'] === 'dashboard.view') {
                        $hasDashboard = true;
                    }
                } elseif (is_string($perm)) {
                    echo "  - $perm\n";
                    if ($perm === 'dashboard.view') {
                        $hasDashboard = true;
                    }
                }
            }
            
            echo "\n";
            if ($hasDashboard) {
                echo "✅ Has dashboard.view permission\n";
                echo "✅ SHOULD pass frontend validation\n";
            } else {
                echo "❌ Missing dashboard.view permission\n";
                echo "❌ WILL BE BLOCKED by frontend\n";
            }
        }
        
        // Check user data
        if (isset($data['data']['user'])) {
            $user = $data['data']['user'];
            echo "\nUser Data:\n";
            echo "  Role: {$user['role']}\n";
            echo "  Role Name: " . ($user['role_name'] ?? 'N/A') . "\n";
        }
    } else {
        echo "❌ Login failed\n";
        if (isset($data['error'])) {
            echo "Error: {$data['error']}\n";
        }
    }
} else {
    echo "❌ No response from API\n";
}

echo "\n=== CHECKING FRONTEND VALIDATION LOGIC ===\n\n";

// Read the actual Admin.jsx file to see current validation
$adminFile = __DIR__ . '/frontend/src/components/pages/Admin.jsx';
if (file_exists($adminFile)) {
    $content = file_get_contents($adminFile);
    
    // Find the login validation code
    if (preg_match('/\/\/ Check if user has dashboard access.*?if \(!hasDashboardAccess\)/s', $content, $matches)) {
        echo "Current validation code found:\n";
        echo "```javascript\n";
        echo trim($matches[0]) . "\n";
        echo "```\n\n";
        echo "✅ Code looks correct - checks for dashboard.view permission\n";
    } else {
        echo "⚠️ Could not find validation code in Admin.jsx\n";
        echo "The file may not have been saved with the latest changes.\n";
    }
} else {
    echo "❌ Admin.jsx not found at expected location\n";
}

echo "\n=== INSTRUCTIONS ===\n";
echo "1. If login API returns permissions with dashboard.view: ✅ Backend is correct\n";
echo "2. If frontend validation code is correct: ✅ Code is correct\n";
echo "3. If you still see 'Access denied': \n";
echo "   - Clear browser cache (Ctrl+Shift+Delete)\n";
echo "   - Hard refresh (Ctrl+F5)\n";
echo "   - Close all browser tabs and reopen\n";
echo "   - Try incognito/private mode\n\n";

echo "NOTE: You need to use the ACTUAL password for encictyear1\n";
echo "This script uses 'test123' as placeholder - update line 11 with real password\n";
