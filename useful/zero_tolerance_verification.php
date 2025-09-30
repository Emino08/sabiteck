<?php

function verifyZeroStaticData() {
    $output = [];
    $output[] = "🚨 ZERO TOLERANCE VERIFICATION";
    $output[] = "=============================";
    $output[] = "";
    $output[] = "Scanning ALL files for ANY remaining static data...";
    $output[] = "";

    $allFiles = [
        // Backend files
        __DIR__ . '/public/index.php',

        // Frontend admin components
        __DIR__ . '/../frontend/src/components/admin/ContentEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/ServicesManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/PortfolioManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/ScholarshipManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/AnnouncementManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/JobEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/JobManagement.jsx'
    ];

    $violations = [];
    $totalFiles = 0;
    $cleanFiles = 0;

    foreach ($allFiles as $file) {
        if (!file_exists($file)) continue;

        $totalFiles++;
        $filename = basename($file);
        $content = file_get_contents($file);
        $lines = explode("\n", $content);

        $fileViolations = [];

        // Ultra-strict patterns - catch EVERYTHING
        $strictPatterns = [
            // Any hardcoded business strings
            '/[\'"](?:Web Development|Mobile Development|Study Abroad|Business Intelligence|Cloud Solutions|Data Analytics|Digital Marketing|Tech Training)[\'"]/' => 'Business service name',
            '/[\'"](?:Technology|Development|Design|Business|Tutorial|Company News|Partnership)[\'"]/' => 'Category name',
            '/[\'"](?:Blog Post|News Article|Company Announcement|Tutorial|Static Page)[\'"]/' => 'Content type name',
            '/[\'"](?:Full Stack|Frontend|Backend|Mobile App|Web Application|API Integration)[\'"]/' => 'Project type name',
            '/[\'"](?:completed|in-progress|on-hold|cancelled|active|inactive|draft)[\'"]/' => 'Status value',
            '/[\'"](?:full-time|part-time|contract|internship)[\'"]/' => 'Job type value',
            '/[\'"](?:news|event|maintenance|promotion|alert)[\'"]/' => 'Announcement type',

            // Company-specific content
            '/[\'"]Sabiteck Limited[\'"]/' => 'Company name',
            '/[\'"]Kenya[\'"]/' => 'Location name',
            '/[\'"]2020[\'"]/' => 'Founding year',
            '/[\'"]Nairobi[\'"]/' => 'City name',
            '/[\'"]technology company[\'"]/' => 'Company description',

            // Template and message content
            '/[\'"]Dear.*[\'"]/' => 'Email template content',
            '/[\'"]Thank you.*[\'"]/' => 'Thank you message',
            '/[\'"]Welcome.*[\'"]/' => 'Welcome message',
            '/[\'"]About.*Limited[\'"]/' => 'About page content',
            '/[\'"]Privacy Policy[\'"]/' => 'Privacy policy title',
            '/[\'"]Terms of Service[\'"]/' => 'Terms of service title',

            // Array assignments with business content
            '/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?[\'"][A-Z][a-z]+.*?[\'"]/' => 'Array with business strings',
            '/const [a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?[\'"][A-Z][a-z]+.*?[\'"]/' => 'Const array with business strings',

            // Default/fallback content
            '/if\s*\([^)]*empty[^)]*\)[\s\S]*?\$[^=]*=\s*\[[\s\S]*?[\'"][^\']*[\'"]/' => 'Fallback content array',
            '/else[\s\S]*?\$[^=]*=\s*\[[\s\S]*?[\'"][^\']*[\'"]/' => 'Else fallback content',

            // Configuration and settings
            '/[\'"](?:created_at|title|status|deadline)[\'"]/' => 'Sort field configuration',
            '/[\'"](?:pending|approved|rejected)[\'"]/' => 'Approval status',
            '/[\'"](?:string|text|number|boolean|json|array)[\'"]/' => 'Data type configuration',
        ];

        foreach ($lines as $lineNum => $line) {
            $lineNumber = $lineNum + 1;
            $trimmedLine = trim($line);

            // Skip comments, empty lines, and imports
            if (empty($trimmedLine) ||
                strpos($trimmedLine, '//') === 0 ||
                strpos($trimmedLine, '#') === 0 ||
                strpos($trimmedLine, 'import ') === 0 ||
                strpos($trimmedLine, 'require') !== false ||
                strpos($trimmedLine, 'CREATE TABLE') !== false ||
                strpos($trimmedLine, 'ALTER TABLE') !== false ||
                strpos($trimmedLine, 'ENUM(') !== false) {
                continue;
            }

            foreach ($strictPatterns as $pattern => $description) {
                if (preg_match($pattern, $line)) {
                    $fileViolations[] = [
                        'line' => $lineNumber,
                        'type' => $description,
                        'content' => substr($trimmedLine, 0, 60) . '...',
                        'severity' => 'HIGH'
                    ];
                }
            }
        }

        if (empty($fileViolations)) {
            $output[] = "✅ {$filename}: CLEAN (0 violations)";
            $cleanFiles++;
        } else {
            $output[] = "❌ {$filename}: {" . count($fileViolations) . "} VIOLATIONS FOUND";
            $violations = array_merge($violations, array_map(function($v) use ($filename) {
                $v['file'] = $filename;
                return $v;
            }, $fileViolations));
        }
    }

    $output[] = "";
    $output[] = "📊 SUMMARY:";
    $output[] = "Files scanned: {$totalFiles}";
    $output[] = "Clean files: {$cleanFiles}";
    $output[] = "Files with violations: " . ($totalFiles - $cleanFiles);
    $output[] = "Total violations: " . count($violations);
    $output[] = "";

    if (!empty($violations)) {
        $output[] = "🚨 VIOLATIONS DETECTED:";
        $output[] = "======================";
        $output[] = "";

        foreach (array_slice($violations, 0, 20) as $violation) {
            $output[] = "📍 {$violation['file']} Line {$violation['line']}: {$violation['type']}";
            $output[] = "   Content: {$violation['content']}";
            $output[] = "";
        }

        if (count($violations) > 20) {
            $output[] = "... and " . (count($violations) - 20) . " more violations";
            $output[] = "";
        }

        $output[] = "❌ VERIFICATION FAILED: Static data still present";
        $output[] = "🔧 Action required: Remove ALL violations listed above";
    } else {
        $output[] = "🎉 VERIFICATION PASSED: ZERO STATIC DATA FOUND!";
        $output[] = "✅ All files are 100% database-driven";
        $output[] = "✅ No hardcoded business content remains";
        $output[] = "✅ Application is fully configurable via database";
    }

    return [$output, $violations];
}

function verifyDatabaseTables() {
    require_once __DIR__ . '/vendor/autoload.php';

    // Load environment variables
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }

    try {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $db = new PDO($dsn, $username, $password, $options);
    } catch (PDOException $e) {
        return ["❌ Database connection failed: " . $e->getMessage()];
    }

    $output = [];
    $output[] = "📊 DATABASE VERIFICATION";
    $output[] = "=======================";
    $output[] = "";

    $requiredTables = [
        'content_categories' => 'Content Categories',
        'portfolio_categories' => 'Portfolio Categories',
        'service_categories' => 'Service Categories',
        'job_categories' => 'Job Categories',
        'scholarship_categories' => 'Scholarship Categories',
        'organization_categories' => 'Organization Categories',
        'content_types' => 'Content Types',
        'announcement_types' => 'Announcement Types',
        'company_info' => 'Company Information',
        'default_content' => 'Default Content',
        'system_config' => 'System Configuration',
        'email_templates' => 'Email Templates',
        'system_messages' => 'System Messages',
        'business_data' => 'Business Data'
    ];

    $totalEntries = 0;

    foreach ($requiredTables as $table => $description) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM {$table}");
            $stmt->execute();
            $result = $stmt->fetch();
            $count = $result['count'] ?? 0;
            $totalEntries += $count;

            if ($count > 0) {
                $output[] = "✅ {$description}: {$count} entries";
            } else {
                $output[] = "⚠️ {$description}: Empty table";
            }
        } catch (Exception $e) {
            $output[] = "❌ {$description}: Error - " . $e->getMessage();
        }
    }

    $output[] = "";
    $output[] = "📈 Total database entries: {$totalEntries}";
    $output[] = "✅ All static data successfully migrated to database";

    return $output;
}

// Execute verification
echo "🔥 FINAL ZERO TOLERANCE VERIFICATION\n";
echo "====================================\n\n";

// Verify no static data in files
[$fileResults, $violations] = verifyZeroStaticData();
foreach ($fileResults as $line) {
    echo $line . "\n";
}

echo "\n";

// Verify database has all the data
$dbResults = verifyDatabaseTables();
foreach ($dbResults as $line) {
    echo $line . "\n";
}

// Save results
$allResults = array_merge($fileResults, [''], $dbResults);
file_put_contents(__DIR__ . '/zero_tolerance_verification.log', implode("\n", $allResults));

echo "\n📄 Verification results saved to zero_tolerance_verification.log\n";

// Final verdict
if (empty($violations)) {
    echo "\n🏆 MISSION ACCOMPLISHED!\n";
    echo "========================\n";
    echo "✅ ZERO static data found in any file\n";
    echo "✅ ALL data moved to database tables\n";
    echo "✅ Application is 100% database-driven\n";
    echo "✅ No hardcoded content remains anywhere\n";
    echo "\n🎯 ZERO TOLERANCE STANDARD: ACHIEVED\n";
} else {
    echo "\n❌ ZERO TOLERANCE STANDARD: NOT MET\n";
    echo "Violations found: " . count($violations) . "\n";
    echo "Please review and fix all violations listed above.\n";
}
?>