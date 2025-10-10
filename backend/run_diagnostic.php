<?php
// Quick diagnostic and fix script
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "========================================\n";
echo "TEAM DATA DIAGNOSTIC & FIX TOOL\n";
echo "========================================\n\n";

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Database connection
$dbConfig = require __DIR__ . '/config/database.php';

try {
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $conn = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    
    echo "✅ Database connection successful!\n\n";
    
    // Step 1: Check table structure
    echo "📋 STEP 1: Checking Table Structure\n";
    echo "------------------------------------\n";
    
    $stmt = $conn->query("DESCRIBE team");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasPhone = false;
    $hasLocation = false;
    $hasDepartment = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'phone') $hasPhone = true;
        if ($column['Field'] === 'location') $hasLocation = true;
        if ($column['Field'] === 'department') $hasDepartment = true;
        
        if (in_array($column['Field'], ['id', 'name', 'email', 'phone', 'location', 'role', 'department', 'skills'])) {
            $marker = in_array($column['Field'], ['phone', 'location', 'department']) ? ' ★' : '';
            echo "{$column['Field']}: {$column['Type']}$marker\n";
        }
    }
    
    echo "\n";
    
    // Step 2: Add missing columns
    echo "🔧 STEP 2: Adding Missing Columns\n";
    echo "------------------------------------\n";
    
    $columnsAdded = [];
    
    if (!$hasPhone) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN phone VARCHAR(50) AFTER email");
            $columnsAdded[] = 'phone';
            echo "✅ Added 'phone' column\n";
            $hasPhone = true;
        } catch (Exception $e) {
            echo "❌ Error adding phone: " . $e->getMessage() . "\n";
        }
    } else {
        echo "ℹ️  'phone' column already exists\n";
    }
    
    if (!$hasLocation) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN location VARCHAR(255) AFTER phone");
            $columnsAdded[] = 'location';
            echo "✅ Added 'location' column\n";
            $hasLocation = true;
        } catch (Exception $e) {
            echo "❌ Error adding location: " . $e->getMessage() . "\n";
        }
    } else {
        echo "ℹ️  'location' column already exists\n";
    }
    
    if (!$hasDepartment) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN department VARCHAR(100) AFTER role");
            $columnsAdded[] = 'department';
            echo "✅ Added 'department' column\n";
            $hasDepartment = true;
        } catch (Exception $e) {
            echo "❌ Error adding department: " . $e->getMessage() . "\n";
        }
    } else {
        echo "ℹ️  'department' column already exists\n";
    }
    
    echo "\n";
    
    // Step 3: Check current data
    echo "📊 STEP 3: Current Team Data\n";
    echo "------------------------------------\n";
    
    $stmt = $conn->query("SELECT id, name, email, phone, location, role, department FROM team ORDER BY id");
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $nullCount = ['phone' => 0, 'location' => 0, 'department' => 0];
    
    foreach ($teams as $team) {
        echo "\nID: {$team['id']} | Name: {$team['name']}\n";
        echo "  Email: {$team['email']}\n";
        echo "  Role: {$team['role']}\n";
        
        if (empty($team['phone'])) {
            echo "  Phone: NULL ❌\n";
            $nullCount['phone']++;
        } else {
            echo "  Phone: {$team['phone']} ✅\n";
        }
        
        if (empty($team['location'])) {
            echo "  Location: NULL ❌\n";
            $nullCount['location']++;
        } else {
            echo "  Location: {$team['location']} ✅\n";
        }
        
        if (empty($team['department'])) {
            echo "  Department: NULL ❌\n";
            $nullCount['department']++;
        } else {
            echo "  Department: {$team['department']} ✅\n";
        }
    }
    
    echo "\n\n";
    
    // Step 4: Summary
    echo "📈 STEP 4: Summary\n";
    echo "------------------------------------\n";
    echo "Total Team Members: " . count($teams) . "\n";
    echo "Phone - NULL values: {$nullCount['phone']}\n";
    echo "Location - NULL values: {$nullCount['location']}\n";
    echo "Department - NULL values: {$nullCount['department']}\n";
    echo "\n";
    
    // Step 5: Test API Response
    echo "🌐 STEP 5: Testing API Response\n";
    echo "------------------------------------\n";
    
    $stmt = $conn->prepare("SELECT * FROM team WHERE id = ? LIMIT 1");
    $stmt->execute([1]);
    $testTeam = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($testTeam) {
        echo "Sample API Response (Team ID 1):\n";
        echo json_encode($testTeam, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";
        
        echo "Field Verification:\n";
        echo "  phone: " . (isset($testTeam['phone']) && !empty($testTeam['phone']) ? "✅ {$testTeam['phone']}" : "❌ Missing/NULL") . "\n";
        echo "  location: " . (isset($testTeam['location']) && !empty($testTeam['location']) ? "✅ {$testTeam['location']}" : "❌ Missing/NULL") . "\n";
        echo "  department: " . (isset($testTeam['department']) && !empty($testTeam['department']) ? "✅ {$testTeam['department']}" : "❌ Missing/NULL") . "\n";
    }
    
    echo "\n";
    
    // Step 6: Recommendations
    echo "💡 STEP 6: Recommendations\n";
    echo "------------------------------------\n";
    
    if (count($columnsAdded) > 0) {
        echo "✅ Columns added: " . implode(', ', $columnsAdded) . "\n";
    }
    
    if ($nullCount['phone'] > 0 || $nullCount['location'] > 0 || $nullCount['department'] > 0) {
        echo "\n⚠️  ACTION REQUIRED:\n";
        echo "Some team members have NULL values. Please update them:\n";
        if ($nullCount['phone'] > 0) echo "  - Add phone numbers\n";
        if ($nullCount['location'] > 0) echo "  - Add locations\n";
        if ($nullCount['department'] > 0) echo "  - Add departments\n";
        echo "\nYou can update via the admin edit form.\n";
    } else {
        echo "🎉 All data is complete! Edit form should work properly.\n";
    }
    
    echo "\n========================================\n";
    echo "DIAGNOSTIC COMPLETE\n";
    echo "========================================\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
