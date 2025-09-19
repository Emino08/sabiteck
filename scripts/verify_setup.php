<?php
// Complete Setup Verification Script

echo "🔍 DevCo Website Setup Verification\n";
echo "==================================\n\n";

// Test 1: Database Connection
echo "1. Testing database connection...\n";
try {
    $db = new PDO('sqlite:' . __DIR__ . '/../database/devco.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "   ✅ Database connection successful\n";
} catch (Exception $e) {
    echo "   ❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Check Tables
echo "2. Checking database tables...\n";
$requiredTables = ['contacts', 'newsletter_subscribers', 'admin_users', 'content'];
foreach ($requiredTables as $table) {
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "   ✅ Table '$table' exists ($count records)\n";
    } catch (Exception $e) {
        echo "   ❌ Table '$table' missing or inaccessible\n";
    }
}

// Test 3: Backend API (if running)
echo "3. Testing backend API...\n";
$apiUrl = 'http://localhost:8000/';
$context = stream_context_create(['http' => ['timeout' => 5]]);
$response = @file_get_contents($apiUrl, false, $context);

if ($response) {
    $data = json_decode($response, true);
    if ($data && isset($data['message'])) {
        echo "   ✅ Backend API responding: " . $data['message'] . "\n";
    } else {
        echo "   ⚠️  Backend API responding but format unexpected\n";
    }
} else {
    echo "   ⚠️  Backend API not responding (server may not be running)\n";
    echo "      Start with: cd backend && composer start\n";
}

// Test 4: Frontend Files
echo "4. Checking frontend files...\n";
$frontendFiles = [
    'frontend/package.json',
    'frontend/vite.config.js',
    'frontend/src/main.jsx',
    'frontend/src/App.jsx'
];

foreach ($frontendFiles as $file) {
    if (file_exists(__DIR__ . '/../' . $file)) {
        echo "   ✅ $file exists\n";
    } else {
        echo "   ❌ $file missing\n";
    }
}

// Test 5: Build Output
echo "5. Checking production build...\n";
if (is_dir(__DIR__ . '/../frontend/dist')) {
    echo "   ✅ Production build directory exists\n";
    if (file_exists(__DIR__ . '/../frontend/dist/index.html')) {
        echo "   ✅ Production build appears complete\n";
    } else {
        echo "   ⚠️  Production build may be incomplete (run: npm run build)\n";
    }
} else {
    echo "   ⚠️  No production build found (run: npm run build)\n";
}

// Test 6: Configuration Files
echo "6. Checking configuration...\n";
$configFiles = [
    'backend/.env',
    'backend/composer.json',
    'create_site_files.sh'
];

foreach ($configFiles as $file) {
    if (file_exists(__DIR__ . '/../' . $file)) {
        echo "   ✅ $file exists\n";
    } else {
        echo "   ❌ $file missing\n";
    }
}

echo "\n🎉 Verification Complete!\n";
echo "\nTo start the development servers:\n";
echo "1. Backend:  cd backend && composer start\n";
echo "2. Frontend: cd frontend && npm run dev\n";
echo "\nThen visit: http://localhost:3002\n";
echo "API at: http://localhost:8000\n";
echo "\nAdmin credentials:\n";
echo "Username: admin\n";
echo "Password: admin123\n";