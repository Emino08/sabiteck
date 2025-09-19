<?php
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

function getDB() {
    static $db = null;
    if ($db === null) {
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
            error_log('Database connection failed: ' . $e->getMessage());
            return null;
        }
    }
    return $db;
}

function testEndpoints() {
    $output = [];
    $output[] = "🧪 Testing API Endpoints for Static Data Removal";
    $output[] = "=====================================================";
    $output[] = "";

    $endpoints = [
        '/api/portfolio/categories' => 'Portfolio Categories',
        '/api/services/categories' => 'Service Categories',
        '/api/blog/categories' => 'Content Categories',
        '/api/jobs/categories' => 'Job Categories',
        '/api/scholarships/categories' => 'Scholarship Categories',
        '/api/organizations/categories' => 'Organization Categories',
        '/api/content/types' => 'Content Types',
        '/api/announcements/types' => 'Announcement Types'
    ];

    $db = getDB();
    if (!$db) {
        $output[] = "❌ Database connection failed!";
        return $output;
    }

    require_once __DIR__ . '/src/routes.php';

    foreach ($endpoints as $endpoint => $description) {
        $output[] = "Testing: {$description} ({$endpoint})";

        // Simulate request
        $method = 'GET';
        $path = $endpoint;

        ob_start();
        $handled = handleRoutes($method, $path, $db);
        $response = ob_get_clean();

        if ($handled && $response) {
            $data = json_decode($response, true);
            if ($data && isset($data['success']) && $data['success']) {
                $count = 0;
                if (isset($data['categories'])) {
                    $count = count($data['categories']);
                } elseif (isset($data['content_types'])) {
                    $count = count($data['content_types']);
                } elseif (isset($data['announcement_types'])) {
                    $count = count($data['announcement_types']);
                }
                $output[] = "  ✅ Success - {$count} items returned";
            } else {
                $output[] = "  ⚠️ Response received but not successful";
                $output[] = "    Response: " . substr($response, 0, 100) . "...";
            }
        } else {
            $output[] = "  ❌ Endpoint not handled or no response";
        }
        $output[] = "";
    }

    return $output;
}

function scanForStaticData() {
    $output = [];
    $output[] = "🔍 Scanning for Remaining Static Data";
    $output[] = "===================================";
    $output[] = "";

    $files = [
        __DIR__ . '/public/index.php',
        __DIR__ . '/../frontend/src/components/admin/ContentEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/ServicesManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/PortfolioManagement.jsx'
    ];

    $patterns = [
        '/categories.*=.*\[.*\]/' => 'Hardcoded categories array',
        '/types.*=.*\[.*\]/' => 'Hardcoded types array',
        '/\[.*\'[A-Z].*\',.*\'[A-Z].*\'\]/' => 'Potential hardcoded string arrays'
    ];

    foreach ($files as $file) {
        if (!file_exists($file)) {
            $output[] = "⚠️ File not found: {$file}";
            continue;
        }

        $content = file_get_contents($file);
        $filename = basename($file);
        $foundIssues = false;

        foreach ($patterns as $pattern => $description) {
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                if (!$foundIssues) {
                    $output[] = "📁 {$filename}:";
                    $foundIssues = true;
                }

                foreach ($matches[0] as $match) {
                    $line = substr_count(substr($content, 0, $match[1]), "\n") + 1;
                    $preview = substr($match[0], 0, 50) . (strlen($match[0]) > 50 ? '...' : '');
                    $output[] = "  ⚠️ Line {$line}: {$description}";
                    $output[] = "    Preview: {$preview}";
                }
            }
        }

        if (!$foundIssues) {
            $output[] = "✅ {$filename}: No static data patterns found";
        }
        $output[] = "";
    }

    return $output;
}

function verifyDatabaseTables() {
    $output = [];
    $output[] = "📊 Verifying Database Lookup Tables";
    $output[] = "==================================";
    $output[] = "";

    $db = getDB();
    if (!$db) {
        $output[] = "❌ Database connection failed!";
        return $output;
    }

    $tables = [
        'content_categories' => 'Content Categories',
        'portfolio_categories' => 'Portfolio Categories',
        'service_categories' => 'Service Categories',
        'job_categories' => 'Job Categories',
        'scholarship_categories' => 'Scholarship Categories',
        'organization_categories' => 'Organization Categories',
        'content_types' => 'Content Types',
        'announcement_types' => 'Announcement Types'
    ];

    foreach ($tables as $tableName => $description) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM {$tableName} WHERE active = 1");
            $stmt->execute();
            $result = $stmt->fetch();
            $count = $result['count'] ?? 0;

            if ($count > 0) {
                $output[] = "✅ {$description}: {$count} active entries";
            } else {
                $output[] = "⚠️ {$description}: No active entries found";
            }
        } catch (Exception $e) {
            $output[] = "❌ {$description}: Table access failed - " . $e->getMessage();
        }
    }

    return $output;
}

// Run all tests
echo "🚀 Static Data Removal Verification\n";
echo "=====================================\n\n";

$results = [];
$results = array_merge($results, verifyDatabaseTables());
$results[] = "";
$results = array_merge($results, testEndpoints());
$results[] = "";
$results = array_merge($results, scanForStaticData());

foreach ($results as $line) {
    echo $line . "\n";
}

// Save results
file_put_contents(__DIR__ . '/static_data_removal_test.log', implode("\n", $results));
echo "\nResults saved to static_data_removal_test.log\n";
echo "\n✅ Static data removal verification completed!\n";
?>