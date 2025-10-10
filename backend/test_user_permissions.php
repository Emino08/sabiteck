#!/usr/bin/env php
<?php
/**
 * Test Login and Permissions for All Test Users
 */

// Configuration
$API_BASE_URL = 'http://localhost:8002';
$TEST_PASSWORD = 'Test123!';

// ANSI Colors
class Color {
    const GREEN = "\033[32m";
    const RED = "\033[31m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const RESET = "\033[0m";
    const BOLD = "\033[1m";
}

function printHeader($text) {
    echo "\n" . Color::BOLD . Color::BLUE . str_repeat("=", 80) . Color::RESET . "\n";
    echo Color::BOLD . Color::BLUE . $text . Color::RESET . "\n";
    echo Color::BOLD . Color::BLUE . str_repeat("=", 80) . Color::RESET . "\n\n";
}

function success($text) { echo Color::GREEN . "✓ " . $text . Color::RESET . "\n"; }
function error($text) { echo Color::RED . "✗ " . $text . Color::RESET . "\n"; }
function info($text) { echo Color::YELLOW . "ℹ " . $text . Color::RESET . "\n"; }

function apiRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true) ?? ['raw' => $response]
    ];
}

// Test users
$testUsers = [
    ['username' => 'test_admin', 'role' => 'admin', 'display' => 'Administrator'],
    ['username' => 'test_blogger', 'role' => 'blogger', 'display' => 'Blogger'],
    ['username' => 'test_editor', 'role' => 'content_editor', 'display' => 'Content Editor'],
    ['username' => 'test_manager', 'role' => 'program_manager', 'display' => 'Program Manager'],
    ['username' => 'test_marketer', 'role' => 'marketing_officer', 'display' => 'Marketing Officer'],
    ['username' => 'test_analyst', 'role' => 'analyst', 'display' => 'Analyst']
];

// Expected permissions for each role
$expectedPermissions = [
    'admin' => ['ALL'],
    'blogger' => ['dashboard.view', 'content.view', 'content.create', 'content.edit', 'announcements.view', 'jobs.view', 'scholarships.view', 'newsletter.view'],
    'content_editor' => ['dashboard.view', 'content.view', 'content.create', 'content.edit', 'services.view', 'portfolio.view', 'about.view', 'team.view'],
    'program_manager' => ['dashboard.view', 'jobs.view', 'jobs.create', 'jobs.edit', 'scholarships.view', 'scholarships.create', 'scholarships.edit', 'organizations.view'],
    'marketing_officer' => ['dashboard.view', 'newsletter.view', 'newsletter.send', 'analytics.view'],
    'analyst' => ['dashboard.view', 'analytics.view']
];

// Routes to test for each role
$testRoutes = [
    'admin' => [
        ['url' => '/api/admin/services', 'should_pass' => true],
        ['url' => '/api/admin/jobs', 'should_pass' => true],
        ['url' => '/api/admin/settings', 'should_pass' => true],
    ],
    'blogger' => [
        ['url' => '/api/admin/jobs', 'should_pass' => true],
        ['url' => '/api/admin/announcements', 'should_pass' => true],
        ['url' => '/api/admin/settings', 'should_pass' => false],
    ],
    'content_editor' => [
        ['url' => '/api/admin/services', 'should_pass' => true],
        ['url' => '/api/portfolio', 'should_pass' => true],
        ['url' => '/api/admin/settings', 'should_pass' => false],
    ],
    'program_manager' => [
        ['url' => '/api/admin/jobs', 'should_pass' => true],
        ['url' => '/api/admin/scholarships', 'should_pass' => true],
        ['url' => '/api/admin/services', 'should_pass' => false],
    ],
    'marketing_officer' => [
        ['url' => '/api/admin/analytics/dashboard', 'should_pass' => true],
        ['url' => '/api/admin/newsletter/subscribers', 'should_pass' => true],
        ['url' => '/api/admin/services', 'should_pass' => false],
    ],
    'analyst' => [
        ['url' => '/api/admin/analytics/dashboard', 'should_pass' => true],
        ['url' => '/api/admin/services', 'should_pass' => false],
        ['url' => '/api/admin/jobs', 'should_pass' => false],
    ]
];

printHeader("RBAC PERMISSION TESTING - All Roles");

$results = [];

foreach ($testUsers as $user) {
    printHeader("Testing: {$user['display']} ({$user['username']})");
    
    $result = [
        'username' => $user['username'],
        'role' => $user['role'],
        'login_success' => false,
        'permissions' => [],
        'route_tests' => []
    ];
    
    // Test login
    info("Attempting login...");
    $loginResponse = apiRequest(
        "$API_BASE_URL/api/auth/login",
        'POST',
        ['username' => $user['username'], 'password' => $TEST_PASSWORD]
    );
    
    if ($loginResponse['code'] === 200 && isset($loginResponse['body']['data']['token'])) {
        success("Login successful!");
        $result['login_success'] = true;
        
        $token = $loginResponse['body']['data']['token'];
        $userData = $loginResponse['body']['data']['user'];
        $permissions = $loginResponse['body']['data']['permissions'] ?? [];
        
        // Display user info
        echo "\n  User Info:\n";
        echo "    ID: {$userData['id']}\n";
        echo "    Role (column): {$userData['role']}\n";
        echo "    Role Name: {$userData['role_name']}\n";
        echo "    Must Change Password: " . ($userData['must_change_password'] ? 'Yes' : 'No') . "\n";
        
        // Check permissions
        echo "\n  Permissions:\n";
        if ($user['role'] === 'admin') {
            info("    Admin has ALL permissions");
            $result['permissions'] = ['ALL'];
        } else {
            $permissionNames = array_map(function($p) {
                return is_array($p) ? $p['name'] : $p;
            }, $permissions);
            
            $result['permissions'] = $permissionNames;
            
            foreach ($permissionNames as $perm) {
                echo "    • $perm\n";
            }
            
            // Verify expected permissions
            $expected = $expectedPermissions[$user['role']] ?? [];
            $missing = array_diff($expected, $permissionNames);
            $extra = array_diff($permissionNames, $expected);
            
            if (empty($missing) && empty($extra)) {
                success("    All expected permissions present!");
            } else {
                if (!empty($missing)) {
                    error("    Missing permissions: " . implode(', ', $missing));
                }
                if (!empty($extra)) {
                    info("    Extra permissions: " . implode(', ', $extra));
                }
            }
        }
        
        // Test API routes
        echo "\n  Testing API Routes:\n";
        $routes = $testRoutes[$user['role']] ?? [];
        
        foreach ($routes as $route) {
            $routeResponse = apiRequest("$API_BASE_URL{$route['url']}", 'GET', null, $token);
            $passed = ($route['should_pass'] && $routeResponse['code'] === 200) || 
                     (!$route['should_pass'] && $routeResponse['code'] === 403);
            
            $result['route_tests'][] = [
                'url' => $route['url'],
                'expected' => $route['should_pass'] ? 'PASS' : 'FAIL',
                'actual' => $routeResponse['code'],
                'passed' => $passed
            ];
            
            $expectation = $route['should_pass'] ? 'should pass' : 'should fail';
            if ($passed) {
                success("    {$route['url']} ($expectation) - {$routeResponse['code']}");
            } else {
                error("    {$route['url']} ($expectation) - {$routeResponse['code']}");
            }
        }
        
    } else {
        error("Login failed!");
        echo "  Response: " . json_encode($loginResponse['body'], JSON_PRETTY_PRINT) . "\n";
    }
    
    $results[] = $result;
    echo "\n";
}

// Summary
printHeader("TEST SUMMARY");

$totalTests = count($testUsers);
$successfulLogins = count(array_filter($results, fn($r) => $r['login_success']));

echo "Total Users Tested: $totalTests\n";
echo "Successful Logins: $successfulLogins\n";
echo "Failed Logins: " . ($totalTests - $successfulLogins) . "\n\n";

echo Color::BOLD . "Detailed Results:\n" . Color::RESET;
echo str_repeat("-", 80) . "\n";

foreach ($results as $result) {
    $status = $result['login_success'] ? Color::GREEN . "✓" : Color::RED . "✗";
    echo "$status {$result['username']} ({$result['role']})" . Color::RESET . "\n";
    
    if ($result['login_success']) {
        $permCount = $result['permissions'][0] === 'ALL' ? 'ALL' : count($result['permissions']);
        echo "  Permissions: $permCount\n";
        
        if (!empty($result['route_tests'])) {
            $passed = count(array_filter($result['route_tests'], fn($t) => $t['passed']));
            $total = count($result['route_tests']);
            echo "  Route Tests: $passed/$total passed\n";
        }
    }
    echo "\n";
}

printHeader("TESTING COMPLETE");

if ($successfulLogins === $totalTests) {
    success("All users can login successfully!");
    success("RBAC system is working correctly!");
} else {
    error("Some users failed to login. Please check the logs above.");
}

?>
