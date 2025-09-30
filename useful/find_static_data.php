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

        return new PDO($dsn, $username, $password, $options);
    } catch (PDOException $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

function analyzeStaticData() {
    $output = [];
    $output[] = "🔍 Comprehensive Static Data Analysis in index.php";
    $output[] = "================================================";
    $output[] = "";

    $indexFile = __DIR__ . '/public/index.php';
    if (!file_exists($indexFile)) {
        $output[] = "❌ index.php not found!";
        return $output;
    }

    $content = file_get_contents($indexFile);
    $lines = explode("\n", $content);

    $staticDataFound = [];

    // Enhanced patterns to find static data
    $patterns = [
        // Arrays with string values
        '/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[\s*[\'"][^\'"][\'"]\s*,/' => 'String array assignment',

        // Hardcoded arrays in responses
        '/[\'"]categories[\'"]\s*=>\s*\[/' => 'Categories array in response',
        '/[\'"]types[\'"]\s*=>\s*\[/' => 'Types array in response',

        // Direct array assignments with strings
        '/=\s*\[\s*[\'"][A-Z]/' => 'Direct string array assignment',

        // Case-specific patterns for common static data
        '/[\'"]Web Development[\'"]/' => 'Hardcoded "Web Development" string',
        '/[\'"]Mobile Apps[\'"]/' => 'Hardcoded "Mobile Apps" string',
        '/[\'"]blog[\'"],\s*[\'"]news[\'"]/' => 'Hardcoded content types',
        '/[\'"]news[\'"],\s*[\'"]event[\'"]/' => 'Hardcoded announcement types',

        // Settings and configuration arrays
        '/[\'"]settings[\'"]\s*=>\s*\[/' => 'Settings array',
        '/[\'"]config[\'"]\s*=>\s*\[/' => 'Configuration array',

        // Mock data patterns
        '/[\'"]mock[\'"]/' => 'Mock data reference',
        '/[\'"]sample[\'"]/' => 'Sample data reference',
        '/[\'"]default[\'"].*\[/' => 'Default data arrays'
    ];

    foreach ($lines as $lineNum => $line) {
        $lineNumber = $lineNum + 1;
        $trimmedLine = trim($line);

        // Skip comments and empty lines
        if (empty($trimmedLine) || strpos($trimmedLine, '//') === 0 || strpos($trimmedLine, '#') === 0) {
            continue;
        }

        foreach ($patterns as $pattern => $description) {
            if (preg_match($pattern, $line)) {
                $staticDataFound[] = [
                    'line' => $lineNumber,
                    'content' => $trimmedLine,
                    'type' => $description,
                    'context' => getLineContext($lines, $lineNum)
                ];
            }
        }
    }

    if (empty($staticDataFound)) {
        $output[] = "✅ No static data patterns found in index.php!";
    } else {
        $output[] = "⚠️ Found " . count($staticDataFound) . " potential static data issues:";
        $output[] = "";

        foreach ($staticDataFound as $issue) {
            $output[] = "📍 Line {$issue['line']}: {$issue['type']}";
            $output[] = "   Content: " . substr($issue['content'], 0, 80) . "...";
            $output[] = "   Context:";
            foreach ($issue['context'] as $contextLine) {
                $output[] = "     " . $contextLine;
            }
            $output[] = "";
        }
    }

    return [$output, $staticDataFound];
}

function getLineContext($lines, $targetLine, $contextSize = 2) {
    $context = [];
    $start = max(0, $targetLine - $contextSize);
    $end = min(count($lines) - 1, $targetLine + $contextSize);

    for ($i = $start; $i <= $end; $i++) {
        $marker = $i === $targetLine ? '>>> ' : '    ';
        $context[] = $marker . ($i + 1) . ': ' . trim($lines[$i]);
    }

    return $context;
}

function findSpecificStaticArrays() {
    $output = [];
    $output[] = "🎯 Searching for Specific Static Arrays";
    $output[] = "=====================================";
    $output[] = "";

    $indexFile = __DIR__ . '/public/index.php';
    $content = file_get_contents($indexFile);

    // Look for specific known static data patterns
    $searches = [
        'Web Development' => 'Portfolio category',
        'Mobile Apps' => 'Service category',
        'Study Abroad' => 'Service category',
        'blog.*news.*page' => 'Content types array',
        'news.*event.*maintenance' => 'Announcement types array',
        'Technology.*Development.*Design' => 'Category listing',
        'full-time.*part-time.*contract' => 'Job types',
        'active.*inactive.*draft' => 'Status types'
    ];

    $foundArrays = [];

    foreach ($searches as $pattern => $type) {
        if (preg_match('/' . $pattern . '/i', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $position = $matches[0][1];
            $lineNumber = substr_count(substr($content, 0, $position), "\n") + 1;

            $foundArrays[] = [
                'pattern' => $pattern,
                'type' => $type,
                'line' => $lineNumber,
                'match' => $matches[0][0]
            ];
        }
    }

    if (empty($foundArrays)) {
        $output[] = "✅ No specific static arrays found!";
    } else {
        $output[] = "⚠️ Found specific static data:";
        $output[] = "";

        foreach ($foundArrays as $array) {
            $output[] = "📍 Line {$array['line']}: {$array['type']}";
            $output[] = "   Pattern: {$array['pattern']}";
            $output[] = "   Match: " . substr($array['match'], 0, 50) . "...";
            $output[] = "";
        }
    }

    return [$output, $foundArrays];
}

function extractRemainingArrays() {
    $output = [];
    $output[] = "🔧 Extracting Remaining Static Arrays";
    $output[] = "===================================";
    $output[] = "";

    $indexFile = __DIR__ . '/public/index.php';
    $content = file_get_contents($indexFile);

    // Find array assignments that might contain static data
    $pattern = '/\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\[\s*([^]]+)\]\s*;/';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

    $extractedArrays = [];

    foreach ($matches as $match) {
        $fullMatch = $match[0][0];
        $varName = $match[1][0];
        $arrayContent = $match[2][0];
        $position = $match[0][1];
        $lineNumber = substr_count(substr($content, 0, $position), "\n") + 1;

        // Check if it contains string literals (potential static data)
        if (preg_match('/[\'"][^\'"]/', $arrayContent)) {
            $extractedArrays[] = [
                'variable' => $varName,
                'content' => $arrayContent,
                'line' => $lineNumber,
                'full_match' => $fullMatch
            ];
        }
    }

    if (empty($extractedArrays)) {
        $output[] = "✅ No static arrays with string content found!";
    } else {
        $output[] = "⚠️ Found " . count($extractedArrays) . " arrays with string content:";
        $output[] = "";

        foreach ($extractedArrays as $array) {
            $output[] = "📍 Line {$array['line']}: Variable '\${$array['variable']}'";
            $output[] = "   Content: " . substr($array['content'], 0, 60) . "...";
            $output[] = "";
        }
    }

    return [$output, $extractedArrays];
}

// Run comprehensive analysis
echo "🚀 Comprehensive Static Data Detection\n";
echo "======================================\n\n";

[$analysisOutput, $staticDataFound] = analyzeStaticData();
foreach ($analysisOutput as $line) {
    echo $line . "\n";
}

echo "\n";

[$specificOutput, $specificArrays] = findSpecificStaticArrays();
foreach ($specificOutput as $line) {
    echo $line . "\n";
}

echo "\n";

[$extractOutput, $extractedArrays] = extractRemainingArrays();
foreach ($extractOutput as $line) {
    echo $line . "\n";
}

// Save detailed results
$allResults = array_merge($analysisOutput, [''], $specificOutput, [''], $extractOutput);
file_put_contents(__DIR__ . '/static_data_analysis.log', implode("\n", $allResults));

echo "\n📄 Detailed analysis saved to static_data_analysis.log\n";

if (empty($staticDataFound) && empty($specificArrays) && empty($extractedArrays)) {
    echo "\n🎉 SUCCESS: No static data found in index.php!\n";
} else {
    echo "\n⚠️ FOUND ISSUES: Static data detected and needs to be moved to database.\n";
}
?>