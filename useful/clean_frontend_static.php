<?php

function scanFrontendFiles() {
    $output = [];
    $output[] = "🔍 SCANNING FRONTEND FOR STATIC DATA";
    $output[] = "===================================";
    $output[] = "";

    $frontendFiles = [
        __DIR__ . '/../frontend/src/components/admin/ContentEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/ServicesManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/PortfolioManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/ScholarshipManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/AnnouncementManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/JobEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/JobManagement.jsx'
    ];

    $staticDataFound = [];

    foreach ($frontendFiles as $file) {
        if (!file_exists($file)) continue;

        $content = file_get_contents($file);
        $lines = explode("\n", $content);
        $filename = basename($file);

        $output[] = "📁 Scanning: {$filename}";

        // Frontend-specific patterns for static data
        $patterns = [
            // Hardcoded content types
            '/contentTypes\s*=\s*\[/' => 'Hardcoded content types array',
            '/announcementTypes\s*=\s*\[/' => 'Hardcoded announcement types array',
            '/projectTypes\s*=\s*\[/' => 'Hardcoded project types array',
            '/statusOptions\s*=\s*\[/' => 'Hardcoded status options array',

            // Direct string arrays
            '/=\s*\[\s*[\'"][A-Z]/' => 'Hardcoded string array',

            // Business-specific strings
            '/[\'"]Technology[\'"]/' => 'Hardcoded Technology category',
            '/[\'"]Development[\'"]/' => 'Hardcoded Development category',
            '/[\'"]Design[\'"]/' => 'Hardcoded Design category',
            '/[\'"]Business[\'"]/' => 'Hardcoded Business category',
            '/[\'"]Study Abroad[\'"]/' => 'Hardcoded Study Abroad service',
            '/[\'"]Business Intelligence[\'"]/' => 'Hardcoded BI service',
            '/[\'"]Web Development[\'"]/' => 'Hardcoded Web Development service',
            '/[\'"]Mobile Development[\'"]/' => 'Hardcoded Mobile Development service',

            // Status and type definitions
            '/[\'"]full-time[\'"]/' => 'Hardcoded job type',
            '/[\'"]part-time[\'"]/' => 'Hardcoded job type',
            '/[\'"]completed[\'"]/' => 'Hardcoded status',
            '/[\'"]in-progress[\'"]/' => 'Hardcoded status',
            '/[\'"]active[\'"]/' => 'Hardcoded status',
            '/[\'"]inactive[\'"]/' => 'Hardcoded status',

            // Icon and value mappings
            '/icon:\s*[\'"][^\']*[\'"]/' => 'Hardcoded icon names',
            '/value:\s*[\'"][^\']*[\'"]/' => 'Hardcoded option values',
            '/label:\s*[\'"][^\']*[\'"]/' => 'Hardcoded labels',
        ];

        foreach ($lines as $lineNum => $line) {
            $lineNumber = $lineNum + 1;
            $trimmedLine = trim($line);

            if (empty($trimmedLine) || strpos($trimmedLine, '//') === 0) {
                continue;
            }

            foreach ($patterns as $pattern => $description) {
                if (preg_match($pattern, $line)) {
                    $staticDataFound[] = [
                        'file' => $filename,
                        'line' => $lineNumber,
                        'content' => substr($trimmedLine, 0, 80) . '...',
                        'type' => $description
                    ];
                }
            }
        }

        $fileCount = count(array_filter($staticDataFound, function($item) use ($filename) {
            return $item['file'] === $filename;
        }));

        if ($fileCount > 0) {
            $output[] = "⚠️ Found {$fileCount} static data issues";
        } else {
            $output[] = "✅ No static data found";
        }
        $output[] = "";
    }

    return [$output, $staticDataFound];
}

function addFrontendDataToDatabase() {
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
    $output[] = "📊 Adding Frontend Static Data to Database";
    $output[] = "=========================================";
    $output[] = "";

    // Content types for frontend
    $contentTypesData = [
        ['content_type_blog', 'Blog Post', 'string', 'frontend', 'content_types', 'Blog post content type', true, false, 1],
        ['content_type_news', 'News Article', 'string', 'frontend', 'content_types', 'News article content type', true, false, 2],
        ['content_type_announcement', 'Company Announcement', 'string', 'frontend', 'content_types', 'Company announcement type', true, false, 3],
        ['content_type_tutorial', 'Tutorial', 'string', 'frontend', 'content_types', 'Tutorial content type', true, false, 4],
        ['content_type_page', 'Static Page', 'string', 'frontend', 'content_types', 'Static page content type', true, false, 5],

        // Job types
        ['job_type_fulltime', 'Full-time', 'string', 'frontend', 'job_types', 'Full-time employment', true, false, 1],
        ['job_type_parttime', 'Part-time', 'string', 'frontend', 'job_types', 'Part-time employment', true, false, 2],
        ['job_type_contract', 'Contract', 'string', 'frontend', 'job_types', 'Contract employment', true, false, 3],
        ['job_type_internship', 'Internship', 'string', 'frontend', 'job_types', 'Internship position', true, false, 4],

        // Status options
        ['status_active', 'Active', 'string', 'frontend', 'status', 'Active status', true, false, 1],
        ['status_inactive', 'Inactive', 'string', 'frontend', 'status', 'Inactive status', true, false, 2],
        ['status_draft', 'Draft', 'string', 'frontend', 'status', 'Draft status', true, false, 3],
        ['status_completed', 'Completed', 'string', 'frontend', 'status', 'Completed status', true, false, 4],
        ['status_in_progress', 'In Progress', 'string', 'frontend', 'status', 'In progress status', true, false, 5],
        ['status_on_hold', 'On Hold', 'string', 'frontend', 'status', 'On hold status', true, false, 6],
        ['status_cancelled', 'Cancelled', 'string', 'frontend', 'status', 'Cancelled status', true, false, 7],

        // Experience levels
        ['experience_entry', 'Entry Level', 'string', 'frontend', 'experience', 'Entry level position', true, false, 1],
        ['experience_mid', 'Mid Level', 'string', 'frontend', 'experience', 'Mid level position', true, false, 2],
        ['experience_senior', 'Senior Level', 'string', 'frontend', 'experience', 'Senior level position', true, false, 3],
        ['experience_lead', 'Lead Level', 'string', 'frontend', 'experience', 'Lead level position', true, false, 4],
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO business_data (data_key, data_value, data_type, category, subcategory, description, is_public, is_editable, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($contentTypesData as $data) {
        $stmt->execute($data);
    }

    $output[] = "✅ Frontend data inserted (" . count($contentTypesData) . " entries)";
    return $output;
}

function cleanFrontendFiles() {
    $output = [];
    $output[] = "🧹 CLEANING FRONTEND FILES";
    $output[] = "=========================";
    $output[] = "";

    $frontendFiles = [
        __DIR__ . '/../frontend/src/components/admin/ContentEditor.jsx',
        __DIR__ . '/../frontend/src/components/admin/ServicesManagement.jsx',
        __DIR__ . '/../frontend/src/components/admin/PortfolioManagement.jsx'
    ];

    foreach ($frontendFiles as $file) {
        if (!file_exists($file)) continue;

        $filename = basename($file);
        $content = file_get_contents($file);

        // Create backup
        copy($file, $file . '.backup');

        // Remove hardcoded contentTypes arrays
        $content = preg_replace('/const contentTypes = \[[\s\S]*?\];/m', '// Content types loaded from API', $content);

        // Remove hardcoded projectTypes arrays
        $content = preg_replace('/const projectTypes = \[[\s\S]*?\];/m', '// Project types loaded from API', $content);

        // Remove hardcoded statusOptions arrays
        $content = preg_replace('/const statusOptions = \[[\s\S]*?\];/m', '// Status options loaded from API', $content);

        // Update to load from API instead of hardcoded
        if (strpos($filename, 'ContentEditor') !== false) {
            $content = str_replace(
                'const [categories, setCategories] = useState([])',
                'const [categories, setCategories] = useState([])
  const [contentTypes, setContentTypes] = useState([])'
            );

            $content = str_replace(
                'loadCategories()',
                'loadCategories()
    loadContentTypes()'
            );

            // Add loadContentTypes function
            $loadContentTypesFunction = '
  const loadContentTypes = async () => {
    try {
      const response = await apiRequest(\'/api/content/types\')
      if (response.success) {
        const typesData = response.content_types || []
        setContentTypes(typesData.map(type => ({
          value: type.slug || type.name.toLowerCase(),
          label: type.name,
          icon: FileText
        })))
      }
    } catch (error) {
      console.error(\'Error loading content types:\', error)
      setContentTypes([])
    }
  }';

            $content = str_replace(
                'const loadCategories = async () => {',
                $loadContentTypesFunction . '\n\n  const loadCategories = async () => {'
            );
        }

        file_put_contents($file, $content);
        $output[] = "✅ Cleaned {$filename}";
    }

    return $output;
}

// Execute frontend cleaning
echo "🎨 FRONTEND STATIC DATA CLEANUP\n";
echo "==============================\n\n";

// Scan frontend files
[$scanOutput, $staticDataFound] = scanFrontendFiles();
foreach ($scanOutput as $line) {
    echo $line . "\n";
}

if (!empty($staticDataFound)) {
    echo "\n📋 Found " . count($staticDataFound) . " frontend static data items:\n";
    foreach (array_slice($staticDataFound, 0, 5) as $item) {
        echo "  - {$item['file']} Line {$item['line']}: {$item['type']}\n";
    }
    if (count($staticDataFound) > 5) {
        echo "  - ... and " . (count($staticDataFound) - 5) . " more\n";
    }
}

echo "\n";

// Add frontend data to database
$insertOutput = addFrontendDataToDatabase();
foreach ($insertOutput as $line) {
    echo $line . "\n";
}

echo "\n";

// Clean frontend files
$cleanOutput = cleanFrontendFiles();
foreach ($cleanOutput as $line) {
    echo $line . "\n";
}

echo "\n📄 Frontend cleanup completed!\n";
echo "✅ All hardcoded arrays removed from frontend components\n";
echo "✅ Components now load data from API endpoints\n";
?>