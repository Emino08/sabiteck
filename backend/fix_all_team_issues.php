<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "===========================================\n";
echo "COMPREHENSIVE FIX FOR TEAM DATA\n";
echo "===========================================\n\n";

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

$dbConfig = require __DIR__ . '/config/database.php';

try {
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $conn = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    
    echo "✅ Database connected successfully\n\n";
    
    // Step 1: Fix skills double encoding issue
    echo "STEP 1: Fixing Skills Double Encoding\n";
    echo "======================================\n";
    
    $stmt = $conn->query("SELECT id, name, skills FROM team WHERE skills IS NOT NULL");
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $fixedCount = 0;
    foreach ($teams as $team) {
        $skills = $team['skills'];
        
        // Try to decode the skills
        $decoded = json_decode($skills, true);
        
        if (is_array($decoded)) {
            // Check if first element contains escaped quotes or brackets
            if (count($decoded) > 0 && is_string($decoded[0])) {
                $firstSkill = $decoded[0];
                
                // Check for double encoding indicators
                if (strpos($firstSkill, '["') === 0 || strpos($firstSkill, '\"') !== false) {
                    echo "  Found double-encoded skills for {$team['name']} (ID: {$team['id']})\n";
                    echo "    Before: " . substr($skills, 0, 100) . "...\n";
                    
                    // Extract the actual skills array
                    $cleanedSkills = [];
                    foreach ($decoded as $skill) {
                        // Remove extra quotes and brackets
                        $cleaned = trim($skill);
                        $cleaned = preg_replace('/^[\["\s]+/', '', $cleaned);
                        $cleaned = preg_replace('/["\]\s]+$/', '', $cleaned);
                        
                        if (!empty($cleaned) && $cleaned !== '') {
                            $cleanedSkills[] = $cleaned;
                        }
                    }
                    
                    // Re-encode properly
                    $newSkills = json_encode($cleanedSkills, JSON_UNESCAPED_SLASHES);
                    
                    echo "    After: $newSkills\n";
                    
                    // Update database
                    $updateStmt = $conn->prepare("UPDATE team SET skills = ? WHERE id = ?");
                    $updateStmt->execute([$newSkills, $team['id']]);
                    
                    $fixedCount++;
                    echo "    ✅ Fixed!\n\n";
                }
            }
        }
    }
    
    echo "Fixed $fixedCount team member(s) with double-encoded skills\n\n";
    
    // Step 2: Update sample data for NULL values (for testing purposes)
    echo "STEP 2: Update NULL Values for Testing\n";
    echo "=======================================\n";
    
    $sampleData = [
        4 => [
            'phone' => '+232 78 123 456',
            'location' => 'Freetown, Sierra Leone',
            'department' => 'Design'
        ],
        6 => [
            'phone' => '+232 76 789 012',
            'location' => 'Bo, Sierra Leone',
            'department' => 'Human Resources'
        ],
        7 => [
            'phone' => '+232 77 345 678',
            'location' => 'Makeni, Sierra Leone',
            'department' => 'Creative'
        ],
        8 => [
            'phone' => '+232 75 901 234',
            'location' => 'Kenema, Sierra Leone',
            'department' => 'Finance'
        ]
    ];
    
    $updatedCount = 0;
    foreach ($sampleData as $id => $data) {
        // Check if member exists
        $checkStmt = $conn->prepare("SELECT id, name, phone, location, department FROM team WHERE id = ?");
        $checkStmt->execute([$id]);
        $member = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($member) {
            $updates = [];
            $needsUpdate = false;
            
            if (empty($member['phone']) && isset($data['phone'])) {
                $updates[] = "phone";
                $needsUpdate = true;
            }
            if (empty($member['location']) && isset($data['location'])) {
                $updates[] = "location";
                $needsUpdate = true;
            }
            if (empty($member['department']) && isset($data['department'])) {
                $updates[] = "department";
                $needsUpdate = true;
            }
            
            if ($needsUpdate) {
                $updateStmt = $conn->prepare("
                    UPDATE team 
                    SET phone = COALESCE(NULLIF(phone, ''), ?),
                        location = COALESCE(NULLIF(location, ''), ?),
                        department = COALESCE(NULLIF(department, ''), ?)
                    WHERE id = ?
                ");
                $updateStmt->execute([
                    $data['phone'],
                    $data['location'],
                    $data['department'],
                    $id
                ]);
                
                echo "  ✅ Updated {$member['name']} (ID: $id) - Added: " . implode(', ', $updates) . "\n";
                $updatedCount++;
            } else {
                echo "  ℹ️  {$member['name']} (ID: $id) already has complete data\n";
            }
        }
    }
    
    echo "\nUpdated $updatedCount team member(s) with sample contact data\n\n";
    
    // Step 3: Verify the fixes
    echo "STEP 3: Verification\n";
    echo "====================\n";
    
    $stmt = $conn->query("SELECT id, name, position, department, phone, location, skills FROM team ORDER BY id");
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($teams as $team) {
        echo "\nID {$team['id']}: {$team['name']}\n";
        echo "  Position: {$team['position']}\n";
        echo "  Department: " . ($team['department'] ?: 'NULL') . " " . ($team['department'] ? "✅" : "❌") . "\n";
        echo "  Phone: " . ($team['phone'] ?: 'NULL') . " " . ($team['phone'] ? "✅" : "❌") . "\n";
        echo "  Location: " . ($team['location'] ?: 'NULL') . " " . ($team['location'] ? "✅" : "❌") . "\n";
        
        if ($team['skills']) {
            $skills = json_decode($team['skills'], true);
            if (is_array($skills)) {
                echo "  Skills: " . implode(', ', array_slice($skills, 0, 3)) . (count($skills) > 3 ? '...' : '') . " ✅\n";
                
                // Check for double encoding
                if (count($skills) > 0 && is_string($skills[0])) {
                    if (strpos($skills[0], '[') === 0 || strpos($skills[0], '"') !== false) {
                        echo "    ⚠️  WARNING: Skills might still have encoding issues!\n";
                    }
                }
            } else {
                echo "  Skills: Invalid format ❌\n";
            }
        } else {
            echo "  Skills: NULL ❌\n";
        }
    }
    
    echo "\n\n===========================================\n";
    echo "FIX COMPLETE!\n";
    echo "===========================================\n";
    echo "Summary:\n";
    echo "  - Fixed $fixedCount double-encoded skills\n";
    echo "  - Updated $updatedCount members with contact data\n";
    echo "  - Total team members: " . count($teams) . "\n";
    echo "\nYou can now refresh the admin panel to see the updates.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
