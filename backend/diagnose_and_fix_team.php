<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html>
<head>
    <title>Team Data Diagnostic & Fix</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            background: #ecf0f1;
            padding: 10px;
            border-left: 4px solid #3498db;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #ffeaa7;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #bee5eb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        tr:hover {
            background: #f1f1f1;
        }
        .null-value {
            color: #e74c3c;
            font-weight: bold;
        }
        .has-value {
            color: #27ae60;
            font-weight: bold;
        }
        .column-highlight {
            background: #fffacd !important;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .step {
            background: #e8f4f8;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }
        .step-number {
            display: inline-block;
            background: #3498db;
            color: white;
            width: 30px;
            height: 30px;
            line-height: 30px;
            text-align: center;
            border-radius: 50%;
            margin-right: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
<div class='container'>";

echo "<h1>🔍 Team Data Diagnostic & Auto-Fix Tool</h1>";
echo "<p style='color: #666; font-size: 14px;'>Analyzing database structure and data...</p>";

// Database connection
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    echo "<div class='success'>✅ Database connection successful!</div>";
    
    // Step 1: Check table structure
    echo "<h2>📋 Step 1: Table Structure Analysis</h2>";
    
    $stmt = $conn->query("DESCRIBE team");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th><th>Status</th></tr>";
    
    $hasPhone = false;
    $hasLocation = false;
    $hasDepartment = false;
    
    foreach ($columns as $column) {
        $isImportant = in_array($column['Field'], ['phone', 'location', 'department']);
        $rowClass = $isImportant ? 'column-highlight' : '';
        
        if ($column['Field'] === 'phone') $hasPhone = true;
        if ($column['Field'] === 'location') $hasLocation = true;
        if ($column['Field'] === 'department') $hasDepartment = true;
        
        $status = $isImportant ? "✅ Found" : "";
        
        echo "<tr class='$rowClass'>";
        echo "<td><strong>{$column['Field']}</strong></td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>" . ($column['Default'] ?? 'NULL') . "</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "<td>$status</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Step 2: Add missing columns if needed
    echo "<h2>🔧 Step 2: Column Verification & Auto-Fix</h2>";
    
    $columnsAdded = [];
    
    if (!$hasPhone) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN phone VARCHAR(50) AFTER email");
            $columnsAdded[] = 'phone';
            echo "<div class='success'>✅ Added <code>phone</code> column successfully!</div>";
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error adding phone column: " . $e->getMessage() . "</div>";
        }
    } else {
        echo "<div class='info'>ℹ️ Column <code>phone</code> already exists</div>";
    }
    
    if (!$hasLocation) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN location VARCHAR(255) AFTER phone");
            $columnsAdded[] = 'location';
            echo "<div class='success'>✅ Added <code>location</code> column successfully!</div>";
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error adding location column: " . $e->getMessage() . "</div>";
        }
    } else {
        echo "<div class='info'>ℹ️ Column <code>location</code> already exists</div>";
    }
    
    if (!$hasDepartment) {
        try {
            $conn->exec("ALTER TABLE team ADD COLUMN department VARCHAR(100) AFTER role");
            $columnsAdded[] = 'department';
            echo "<div class='success'>✅ Added <code>department</code> column successfully!</div>";
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error adding department column: " . $e->getMessage() . "</div>";
        }
    } else {
        echo "<div class='info'>ℹ️ Column <code>department</code> already exists</div>";
    }
    
    if (count($columnsAdded) > 0) {
        echo "<div class='success'><strong>✅ Auto-Fix Applied:</strong> Added columns: " . implode(', ', $columnsAdded) . "</div>";
    }
    
    // Step 3: Check current data
    echo "<h2>📊 Step 3: Current Team Data</h2>";
    
    $stmt = $conn->query("SELECT * FROM team ORDER BY id");
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($teams) > 0) {
        echo "<table>";
        echo "<tr>";
        echo "<th>ID</th>";
        echo "<th>Name</th>";
        echo "<th>Email</th>";
        echo "<th class='column-highlight'>Phone</th>";
        echo "<th class='column-highlight'>Location</th>";
        echo "<th>Role</th>";
        echo "<th class='column-highlight'>Department</th>";
        echo "<th>Skills</th>";
        echo "</tr>";
        
        $nullCount = ['phone' => 0, 'location' => 0, 'department' => 0];
        
        foreach ($teams as $team) {
            echo "<tr>";
            echo "<td>{$team['id']}</td>";
            echo "<td>{$team['name']}</td>";
            echo "<td>{$team['email']}</td>";
            
            // Phone
            if (empty($team['phone']) || $team['phone'] === null) {
                echo "<td class='null-value'>NULL</td>";
                $nullCount['phone']++;
            } else {
                echo "<td class='has-value'>{$team['phone']}</td>";
            }
            
            // Location
            if (empty($team['location']) || $team['location'] === null) {
                echo "<td class='null-value'>NULL</td>";
                $nullCount['location']++;
            } else {
                echo "<td class='has-value'>{$team['location']}</td>";
            }
            
            echo "<td>{$team['role']}</td>";
            
            // Department
            if (empty($team['department']) || $team['department'] === null) {
                echo "<td class='null-value'>NULL</td>";
                $nullCount['department']++;
            } else {
                echo "<td class='has-value'>{$team['department']}</td>";
            }
            
            // Skills
            $skills = $team['skills'] ?? '';
            $skillsPreview = strlen($skills) > 50 ? substr($skills, 0, 50) . '...' : $skills;
            echo "<td><small>$skillsPreview</small></td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Step 4: Data quality report
        echo "<h2>📈 Step 4: Data Quality Report</h2>";
        
        echo "<div class='info'>";
        echo "<strong>Total Team Members:</strong> " . count($teams) . "<br>";
        echo "<strong>Phone - NULL values:</strong> {$nullCount['phone']} / " . count($teams) . "<br>";
        echo "<strong>Location - NULL values:</strong> {$nullCount['location']} / " . count($teams) . "<br>";
        echo "<strong>Department - NULL values:</strong> {$nullCount['department']} / " . count($teams) . "<br>";
        echo "</div>";
        
        if ($nullCount['phone'] > 0 || $nullCount['location'] > 0 || $nullCount['department'] > 0) {
            echo "<div class='warning'>";
            echo "<strong>⚠️ Action Required:</strong> Some team members have NULL values in phone, location, or department fields.<br>";
            echo "These fields need to be updated with actual data for the edit form to work properly.";
            echo "</div>";
        } else {
            echo "<div class='success'>";
            echo "<strong>✅ Data Complete:</strong> All team members have phone, location, and department information!";
            echo "</div>";
        }
        
    } else {
        echo "<div class='warning'>⚠️ No team members found in database</div>";
    }
    
    // Step 5: Check API response
    echo "<h2>🌐 Step 5: API Response Simulation</h2>";
    
    $stmt = $conn->prepare("SELECT * FROM team WHERE id = ? LIMIT 1");
    $stmt->execute([1]);
    $testTeam = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($testTeam) {
        echo "<div class='step'>";
        echo "<span class='step-number'>1</span>";
        echo "<strong>Sample API Response for Team ID 1:</strong>";
        echo "</div>";
        
        echo "<pre>" . json_encode($testTeam, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "</pre>";
        
        // Check if fields are present
        $apiChecks = [
            'phone' => isset($testTeam['phone']) && !empty($testTeam['phone']),
            'location' => isset($testTeam['location']) && !empty($testTeam['location']),
            'department' => isset($testTeam['department']) && !empty($testTeam['department'])
        ];
        
        echo "<div class='step'>";
        echo "<span class='step-number'>2</span>";
        echo "<strong>API Field Verification:</strong>";
        echo "</div>";
        
        echo "<table>";
        echo "<tr><th>Field</th><th>Present in API</th><th>Has Value</th><th>Status</th></tr>";
        
        foreach ($apiChecks as $field => $hasValue) {
            $status = $hasValue ? '✅ Ready' : '❌ Missing/NULL';
            $class = $hasValue ? 'has-value' : 'null-value';
            echo "<tr>";
            echo "<td><code>$field</code></td>";
            echo "<td>" . (isset($testTeam[$field]) ? 'Yes' : 'No') . "</td>";
            echo "<td class='$class'>" . ($hasValue ? $testTeam[$field] : 'NULL/Empty') . "</td>";
            echo "<td>$status</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Step 6: Recommendations
    echo "<h2>💡 Step 6: Recommendations</h2>";
    
    echo "<div class='step'>";
    echo "<span class='step-number'>✓</span>";
    echo "<strong>What to do next:</strong>";
    echo "</div>";
    
    $allGood = true;
    
    if (!$hasPhone || !$hasLocation || !$hasDepartment) {
        echo "<div class='warning'>";
        echo "⚠️ <strong>Missing Columns:</strong> Please refresh this page after the columns have been added.";
        echo "</div>";
        $allGood = false;
    }
    
    if ($nullCount['phone'] > 0 || $nullCount['location'] > 0 || $nullCount['department'] > 0) {
        echo "<div class='warning'>";
        echo "<strong>⚠️ Update NULL Values:</strong><br>";
        echo "Go to the admin team edit page and update the following for each team member:<br>";
        echo "<ul>";
        if ($nullCount['phone'] > 0) echo "<li>Add phone numbers</li>";
        if ($nullCount['location'] > 0) echo "<li>Add locations</li>";
        if ($nullCount['department'] > 0) echo "<li>Add departments</li>";
        echo "</ul>";
        echo "</div>";
        $allGood = false;
    }
    
    if ($allGood) {
        echo "<div class='success'>";
        echo "<h3>🎉 Everything Looks Good!</h3>";
        echo "<p>All columns exist and have data. The edit form should work correctly now.</p>";
        echo "<p><strong>Next steps:</strong></p>";
        echo "<ol>";
        echo "<li>Clear your browser cache</li>";
        echo "<li>Refresh the admin edit team page</li>";
        echo "<li>The phone, location, and department fields should now load correctly</li>";
        echo "</ol>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "<h3>❌ Database Error</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}

echo "</div>";
echo "</body></html>";
?>
