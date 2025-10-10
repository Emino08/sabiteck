<?php

$url = 'http://localhost:8002/api/auth/login';
$data = [
    'username' => 'test_blogger',
    'password' => 'Test123!'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n\n";
$result = json_decode($response, true);

if ($result['success']) {
    echo "✅ LOGIN SUCCESSFUL!\n\n";
    echo "User Info:\n";
    echo "  Username: {$result['data']['user']['username']}\n";
    echo "  Role (column): {$result['data']['user']['role']}\n";
    echo "  Role Name: {$result['data']['user']['role_name']}\n";
    echo "  Has dashboard.view: " . (in_array('dashboard.view', array_column($result['data']['permissions'], 'name')) ? 'YES' : 'NO') . "\n";
    
    echo "\nThis should work for login!\n";
} else {
    echo "❌ LOGIN FAILED\n";
    echo "Error: " . ($result['error'] ?? 'Unknown error') . "\n";
}

?>
