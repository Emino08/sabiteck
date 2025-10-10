<?php
/**
 * Fix Malformed Skills Data
 * This script cleans up double-encoded JSON skills in the database
 */

// Database configuration
$host = 'localhost';
$port = 4306;
$dbname = 'devco_db';
$username = 'root';
$password = '1212';

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fix Skills Encoding</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
        .status.warning {
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #f59e0b;
        }
        .status.info {
            background: #dbeafe;
            color: #1e40af;
            border: 2px solid #3b82f6;
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
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .before {
            background: #fee2e2;
            padding: 5px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
        .after {
            background: #d1fae5;
            padding: 5px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
        .btn {
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover {
            background: #4f46e5;
        }
        .btn-danger {
            background: #ef4444;
        }
        .btn-danger:hover {
            background: #dc2626;
        }
        pre {
            background: #1f2937;
            color: #10b981;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Fix Skills Encoding</h1>
        
        <?php
        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo '<div class="status success">✅ Database connected successfully!</div>';
            
            // Check for malformed skills
            $stmt = $pdo->query("SELECT id, name, skills FROM team WHERE skills IS NOT NULL");
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $malformedCount = 0;
            $fixedRecords = [];
            
            foreach ($members as $member) {
                $originalSkills = $member['skills'];
                $decoded = json_decode($originalSkills, true);
                
                if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                    continue;
                }
                
                // Check if skills have malformed encoding
                $needsFix = false;
                $cleanedSkills = [];
                
                foreach ($decoded as $skill) {
                    // Check for double-encoded strings
                    if (is_string($skill)) {
                        // Remove wrapping brackets and quotes
                        $cleaned = $skill;
                        $cleaned = preg_replace('/^\["|"\]$/', '', $cleaned);
                        $cleaned = preg_replace('/^"|"$/', '', $cleaned);
                        $cleaned = stripslashes($cleaned);
                        
                        if ($cleaned !== $skill) {
                            $needsFix = true;
                        }
                        
                        $cleanedSkills[] = $cleaned;
                    } else {
                        $cleanedSkills[] = $skill;
                    }
                }
                
                if ($needsFix) {
                    $malformedCount++;
                    $fixedRecords[] = [
                        'id' => $member['id'],
                        'name' => $member['name'],
                        'before' => $originalSkills,
                        'after' => json_encode($cleanedSkills),
                        'cleaned' => $cleanedSkills
                    ];
                }
            }
            
            if ($malformedCount > 0) {
                echo "<div class=\"status warning\">⚠️ Found $malformedCount team member(s) with malformed skills</div>";
                
                echo '<h2>Preview Changes</h2>';
                echo '<p>The following records will be updated:</p>';
                echo '<table>';
                echo '<thead><tr><th>ID</th><th>Name</th><th>Before</th><th>After</th></tr></thead>';
                echo '<tbody>';
                
                foreach ($fixedRecords as $record) {
                    echo '<tr>';
                    echo "<td>{$record['id']}</td>";
                    echo "<td><strong>{$record['name']}</strong></td>";
                    echo "<td><div class=\"before\">" . htmlspecialchars(substr($record['before'], 0, 100)) . "...</div></td>";
                    echo "<td><div class=\"after\">" . htmlspecialchars($record['after']) . "</div></td>";
                    echo '</tr>';
                }
                
                echo '</tbody></table>';
                
                // Check if fix is requested
                if (isset($_GET['fix']) && $_GET['fix'] === 'yes') {
                    echo '<div class="status info">🔄 Fixing records...</div>';
                    
                    $fixed = 0;
                    $errors = 0;
                    
                    foreach ($fixedRecords as $record) {
                        try {
                            $stmt = $pdo->prepare("UPDATE team SET skills = ? WHERE id = ?");
                            $stmt->execute([$record['after'], $record['id']]);
                            $fixed++;
                        } catch (Exception $e) {
                            $errors++;
                            echo "<div class=\"status error\">❌ Failed to fix record {$record['id']}: " . htmlspecialchars($e->getMessage()) . "</div>";
                        }
                    }
                    
                    echo "<div class=\"status success\">✅ Fixed $fixed record(s) successfully!</div>";
                    
                    if ($errors > 0) {
                        echo "<div class=\"status error\">❌ Failed to fix $errors record(s)</div>";
                    }
                    
                    echo '<p><a href="fix_skills_encoding.php" class="btn">View Updated Data</a></p>';
                    
                } else {
                    echo '<div style="margin: 20px 0;">';
                    echo '<a href="?fix=yes" class="btn btn-danger">Fix All Records</a>';
                    echo '<p style="color: #ef4444; margin-top: 10px;">⚠️ This will update ' . $malformedCount . ' record(s) in the database</p>';
                    echo '</div>';
                }
                
            } else {
                echo '<div class="status success">✅ No malformed skills found! All records are properly formatted.</div>';
                
                echo '<h2>Current Skills Data</h2>';
                echo '<table>';
                echo '<thead><tr><th>ID</th><th>Name</th><th>Skills</th></tr></thead>';
                echo '<tbody>';
                
                foreach ($members as $member) {
                    $decoded = json_decode($member['skills'], true);
                    $skillsList = is_array($decoded) ? implode(', ', $decoded) : 'Invalid JSON';
                    
                    echo '<tr>';
                    echo "<td>{$member['id']}</td>";
                    echo "<td><strong>{$member['name']}</strong></td>";
                    echo "<td>{$skillsList}</td>";
                    echo '</tr>';
                }
                
                echo '</tbody></table>';
            }
            
            // Show example of correct format
            echo '<h2>📚 Correct Skills Format</h2>';
            echo '<div class="status info">';
            echo '<p><strong>Skills should be stored as:</strong></p>';
            echo '<pre>["Skill One", "Skill Two", "Skill Three"]</pre>';
            echo '<p><strong>NOT as:</strong></p>';
            echo '<pre>["[\"Skill One\"", "\"Skill Two\""]</pre>';
            echo '<p><strong>When displayed, skills should show as:</strong></p>';
            echo '<ul>';
            echo '<li>Skill One</li>';
            echo '<li>Skill Two</li>';
            echo '<li>Skill Three</li>';
            echo '</ul>';
            echo '</div>';
            
        } catch (PDOException $e) {
            echo '<div class="status error">';
            echo '❌ Database Error: ' . htmlspecialchars($e->getMessage());
            echo '</div>';
        }
        ?>
        
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 5px;">
            <h3>📝 What This Script Does:</h3>
            <ol>
                <li>Connects to your database</li>
                <li>Scans all team members for malformed skills data</li>
                <li>Shows a preview of changes before applying them</li>
                <li>Fixes double-encoded JSON skills</li>
                <li>Removes extra quotes and brackets</li>
            </ol>
            
            <h3>🔒 Safety Features:</h3>
            <ul>
                <li>Preview changes before applying</li>
                <li>Only updates records that need fixing</li>
                <li>Validates JSON before and after</li>
                <li>Shows error messages if something fails</li>
            </ul>
            
            <p><strong>Recommendation:</strong> Backup your database before running the fix!</p>
        </div>
    </div>
</body>
</html>
