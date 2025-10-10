<?php
/**
 * Team Data Diagnostic Tool
 * Lists all team members with their phone, location, and department data
 * Run this file to see what's actually in the database
 */

// Database configuration
$host = 'localhost';
$port = 4306;
$dbname = 'devco_db';
$username = 'root';
$password = '1212';

// Set headers
header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Data Diagnostic</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 10px;
        }
        .status {
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .status.success {
            background: #d1fae5;
            color: #065f46;
            border: 2px solid #10b981;
        }
        .status.error {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #6366f1;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 14px;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }
        tr:hover {
            background: #f9fafb;
        }
        .null {
            color: #ef4444;
            font-style: italic;
        }
        .empty {
            color: #f59e0b;
            font-style: italic;
        }
        .value {
            color: #10b981;
            font-weight: bold;
        }
        .info-box {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .code {
            background: #1f2937;
            color: #10b981;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            margin: 10px 0;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-right: 5px;
        }
        .badge.has-data {
            background: #d1fae5;
            color: #065f46;
        }
        .badge.missing-data {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Team Data Diagnostic Tool</h1>
        
        <?php
        try {
            // Connect to database
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo '<div class="status success">✅ Database connected successfully!</div>';
            
            // Check if team table exists
            $stmt = $pdo->query("SHOW TABLES LIKE 'team'");
            $tableExists = $stmt->fetch();
            
            if (!$tableExists) {
                echo '<div class="status error">❌ Table "team" does not exist!</div>';
                exit;
            }
            
            echo '<div class="status success">✅ Table "team" exists</div>';
            
            // Get table structure
            echo '<h2>📋 Table Structure</h2>';
            $stmt = $pdo->query("DESCRIBE team");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo '<table>';
            echo '<thead><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr></thead>';
            echo '<tbody>';
            
            $hasPhone = false;
            $hasLocation = false;
            $hasDepartment = false;
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'phone') $hasPhone = true;
                if ($column['Field'] === 'location') $hasLocation = true;
                if ($column['Field'] === 'department') $hasDepartment = true;
                
                $highlight = ($column['Field'] === 'phone' || $column['Field'] === 'location' || $column['Field'] === 'department') 
                    ? 'style="background: #fef3c7;"' : '';
                
                echo "<tr $highlight>";
                echo "<td><strong>{$column['Field']}</strong></td>";
                echo "<td>{$column['Type']}</td>";
                echo "<td>{$column['Null']}</td>";
                echo "<td>{$column['Key']}</td>";
                echo "<td>{$column['Default']}</td>";
                echo "<td>{$column['Extra']}</td>";
                echo "</tr>";
            }
            echo '</tbody></table>';
            
            // Check for required columns
            echo '<div class="info-box">';
            echo '<h3>Column Status:</h3>';
            echo $hasPhone ? '<span class="badge has-data">✅ phone column exists</span>' : '<span class="badge missing-data">❌ phone column missing</span>';
            echo $hasLocation ? '<span class="badge has-data">✅ location column exists</span>' : '<span class="badge missing-data">❌ location column missing</span>';
            echo $hasDepartment ? '<span class="badge has-data">✅ department column exists</span>' : '<span class="badge missing-data">❌ department column missing</span>';
            echo '</div>';
            
            // Get all team data
            echo '<h2>👥 Team Members Data</h2>';
            $stmt = $pdo->query("SELECT id, name, position, department, email, phone, location, skills, active, featured FROM team ORDER BY id ASC");
            $teamMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo '<p><strong>Total team members:</strong> ' . count($teamMembers) . '</p>';
            
            if (count($teamMembers) > 0) {
                echo '<table>';
                echo '<thead><tr>';
                echo '<th>ID</th>';
                echo '<th>Name</th>';
                echo '<th>Position</th>';
                echo '<th>Department</th>';
                echo '<th>Phone</th>';
                echo '<th>Location</th>';
                echo '<th>Email</th>';
                echo '<th>Skills</th>';
                echo '<th>Active</th>';
                echo '</tr></thead>';
                echo '<tbody>';
                
                foreach ($teamMembers as $member) {
                    echo '<tr>';
                    echo "<td>{$member['id']}</td>";
                    echo "<td><strong>{$member['name']}</strong></td>";
                    echo "<td>{$member['position']}</td>";
                    
                    // Department
                    if (empty($member['department'])) {
                        echo '<td><span class="null">NULL</span></td>';
                    } else {
                        echo "<td><span class=\"value\">{$member['department']}</span></td>";
                    }
                    
                    // Phone
                    if (empty($member['phone'])) {
                        echo '<td><span class="null">NULL</span></td>';
                    } else {
                        echo "<td><span class=\"value\">{$member['phone']}</span></td>";
                    }
                    
                    // Location
                    if (empty($member['location'])) {
                        echo '<td><span class="null">NULL</span></td>';
                    } else {
                        echo "<td><span class=\"value\">{$member['location']}</span></td>";
                    }
                    
                    // Email
                    echo "<td>{$member['email']}</td>";
                    
                    // Skills
                    $skills = $member['skills'] ?? 'NULL';
                    $skillsDisplay = strlen($skills) > 50 ? substr($skills, 0, 50) . '...' : $skills;
                    echo "<td><small>$skillsDisplay</small></td>";
                    
                    // Active
                    $activeStatus = $member['active'] ? '<span class="badge has-data">✓</span>' : '<span class="badge missing-data">✗</span>';
                    echo "<td>$activeStatus</td>";
                    
                    echo '</tr>';
                }
                
                echo '</tbody></table>';
            } else {
                echo '<div class="status error">❌ No team members found in database</div>';
            }
            
            // Show API response simulation
            echo '<h2>📡 Simulated API Response</h2>';
            echo '<p>This is what the <code>/api/admin/team</code> endpoint should return:</p>';
            
            $stmt = $pdo->query("SELECT * FROM team ORDER BY id ASC LIMIT 1");
            $sampleMember = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($sampleMember) {
                echo '<div class="code">';
                echo htmlspecialchars(json_encode([
                    'success' => true,
                    'data' => [$sampleMember]
                ], JSON_PRETTY_PRINT));
                echo '</div>';
            }
            
            // Show SQL query to update data
            echo '<h2>🔧 Fix Missing Data</h2>';
            echo '<p>If phone, location, or department are NULL, run this SQL:</p>';
            echo '<div class="code">';
            echo "UPDATE team <br>";
            echo "SET <br>";
            echo "&nbsp;&nbsp;phone = '+232 78 618435',<br>";
            echo "&nbsp;&nbsp;location = 'Sierra Leone',<br>";
            echo "&nbsp;&nbsp;department = 'Executive'<br>";
            echo "WHERE id = 1;";
            echo '</div>';
            
            // Connection info
            echo '<h2>🔌 Connection Info</h2>';
            echo '<div class="info-box">';
            echo "<p><strong>Host:</strong> $host</p>";
            echo "<p><strong>Port:</strong> $port</p>";
            echo "<p><strong>Database:</strong> $dbname</p>";
            echo "<p><strong>Username:</strong> $username</p>";
            echo '</div>';
            
        } catch (PDOException $e) {
            echo '<div class="status error">';
            echo '❌ Database Error: ' . htmlspecialchars($e->getMessage());
            echo '</div>';
            
            echo '<div class="info-box">';
            echo '<h3>Troubleshooting:</h3>';
            echo '<ul>';
            echo '<li>Check if MySQL/MariaDB is running</li>';
            echo '<li>Verify port 4306 is correct</li>';
            echo '<li>Confirm database "devco_db" exists</li>';
            echo '<li>Check username and password</li>';
            echo '</ul>';
            echo '</div>';
        }
        ?>
        
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 5px;">
            <h3>📝 Next Steps:</h3>
            <ol>
                <li>Check if phone, location, department columns exist in the table</li>
                <li>Verify that team members have data in these fields</li>
                <li>If data is missing, update it using phpMyAdmin or the SQL above</li>
                <li>Check the API response to ensure backend returns these fields</li>
                <li>Verify frontend is properly mapping and displaying these fields</li>
            </ol>
        </div>
    </div>
</body>
</html>
