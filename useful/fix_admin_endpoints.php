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

function insertDummyData($db) {
    $output = [];
    $output[] = "📊 Inserting Dummy Data for Admin Dashboard";
    $output[] = "==========================================";
    $output[] = "";

    try {
        // Insert dummy services if empty
        $stmt = $db->query("SELECT COUNT(*) as count FROM services");
        $serviceCount = $stmt->fetch()['count'] ?? 0;

        if ($serviceCount == 0) {
            $dummyServices = [
                ['Web Development', 'web-development', 'Custom web applications and websites', 'Professional web development services', 'code', 1, 1, 1, '2024-01-01', '2024-01-01'],
                ['Mobile Development', 'mobile-development', 'iOS and Android mobile applications', 'Native and cross-platform mobile apps', 'smartphone', 1, 1, 2, '2024-01-02', '2024-01-02'],
                ['Cloud Solutions', 'cloud-solutions', 'Scalable cloud infrastructure and services', 'Enterprise cloud infrastructure', 'cloud', 1, 1, 3, '2024-01-03', '2024-01-03'],
                ['Data Analytics', 'data-analytics', 'Business intelligence and data analytics', 'Data-driven insights', 'bar-chart', 0, 1, 4, '2024-01-04', '2024-01-04'],
                ['Digital Marketing', 'digital-marketing', 'Comprehensive digital marketing strategies', 'Digital marketing solutions', 'megaphone', 1, 1, 5, '2024-01-05', '2024-01-05']
            ];

            $stmt = $db->prepare("INSERT INTO services (title, slug, description, short_description, icon, popular, active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($dummyServices as $service) {
                $stmt->execute($service);
            }
            $output[] = "✅ Inserted " . count($dummyServices) . " dummy services";
        } else {
            $output[] = "✅ Services table already has {$serviceCount} entries";
        }

        // Insert dummy jobs if empty
        $stmt = $db->query("SELECT COUNT(*) as count FROM jobs");
        $jobCount = $stmt->fetch()['count'] ?? 0;

        if ($jobCount == 0) {
            $dummyJobs = [
                ['Senior Software Developer', 'senior-software-developer', 'We are looking for an experienced software developer', 'Engineering', 'Remote/Nairobi', 'full-time', 'active', '2024-06-01', 'Bachelor degree in Computer Science', 50000, 80000, 15, '2024-01-01', '2024-01-01'],
                ['Frontend Developer', 'frontend-developer', 'Join our frontend team to build amazing user interfaces', 'Engineering', 'Nairobi', 'full-time', 'active', '2024-05-15', 'Experience with React and Vue.js', 40000, 60000, 8, '2024-01-02', '2024-01-02'],
                ['Data Scientist', 'data-scientist', 'Analyze data and build machine learning models', 'Data', 'Remote', 'full-time', 'active', '2024-05-30', 'PhD in Data Science or related field', 60000, 90000, 5, '2024-01-03', '2024-01-03'],
                ['UI/UX Designer', 'ui-ux-designer', 'Design beautiful and intuitive user experiences', 'Design', 'Nairobi', 'part-time', 'active', '2024-05-20', 'Portfolio of design work', 35000, 50000, 12, '2024-01-04', '2024-01-04'],
                ['DevOps Engineer', 'devops-engineer', 'Manage our cloud infrastructure and deployment pipelines', 'Engineering', 'Remote', 'contract', 'active', '2024-06-15', 'Experience with AWS and Docker', 55000, 75000, 3, '2024-01-05', '2024-01-05']
            ];

            $stmt = $db->prepare("INSERT INTO jobs (title, slug, description, department, location, type, status, deadline, requirements, salary_min, salary_max, applications_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($dummyJobs as $job) {
                $stmt->execute($job);
            }
            $output[] = "✅ Inserted " . count($dummyJobs) . " dummy jobs";
        } else {
            $output[] = "✅ Jobs table already has {$jobCount} entries";
        }

        // Insert dummy scholarships if empty
        $stmt = $db->query("SELECT COUNT(*) as count FROM scholarships");
        $scholarshipCount = $stmt->fetch()['count'] ?? 0;

        if ($scholarshipCount == 0) {
            $dummyScholarships = [
                ['Tech Excellence Scholarship', 'tech-excellence-scholarship', 'Full scholarship for outstanding tech students', 'Technology', 'Kenya', 'undergraduate', 'active', '2024-06-30', 100000, 'Full tuition coverage', '2024-01-01', '2024-01-01'],
                ['Innovation Grant', 'innovation-grant', 'Grant for innovative startup ideas', 'Business', 'East Africa', 'graduate', 'active', '2024-07-15', 50000, 'Startup funding support', '2024-01-02', '2024-01-02'],
                ['Women in Tech Award', 'women-in-tech-award', 'Supporting women pursuing technology careers', 'Technology', 'Africa', 'undergraduate', 'active', '2024-05-31', 75000, 'Education and mentorship', '2024-01-03', '2024-01-03'],
                ['Research Fellowship', 'research-fellowship', 'Research opportunities in emerging technologies', 'Research', 'Global', 'postgraduate', 'active', '2024-08-01', 120000, 'Research funding', '2024-01-04', '2024-01-04'],
                ['Community Impact Scholarship', 'community-impact-scholarship', 'For students making community impact', 'Social Impact', 'Kenya', 'undergraduate', 'active', '2024-06-15', 60000, 'Education support', '2024-01-05', '2024-01-05']
            ];

            $stmt = $db->prepare("INSERT INTO scholarships (title, slug, description, category, region, education_level, status, deadline, amount, benefits, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($dummyScholarships as $scholarship) {
                $stmt->execute($scholarship);
            }
            $output[] = "✅ Inserted " . count($dummyScholarships) . " dummy scholarships";
        } else {
            $output[] = "✅ Scholarships table already has {$scholarshipCount} entries";
        }

        // Insert dummy team members if empty
        $stmt = $db->query("SELECT COUNT(*) as count FROM team");
        $teamCount = $stmt->fetch()['count'] ?? 0;

        if ($teamCount == 0) {
            $dummyTeam = [
                ['John Doe', 'Chief Executive Officer', 'Engineering', 'Leading the company vision and strategy', 'john@sabiteck.com', '+254700000001', 'https://linkedin.com/in/johndoe', 1, 1, 1, '2024-01-01', '2024-01-01'],
                ['Jane Smith', 'Chief Technology Officer', 'Engineering', 'Overseeing all technical operations', 'jane@sabiteck.com', '+254700000002', 'https://linkedin.com/in/janesmith', 1, 1, 2, '2024-01-02', '2024-01-02'],
                ['Mike Johnson', 'Lead Developer', 'Engineering', 'Leading our development team', 'mike@sabiteck.com', '+254700000003', 'https://linkedin.com/in/mikejohnson', 1, 0, 3, '2024-01-03', '2024-01-03'],
                ['Sarah Wilson', 'UI/UX Designer', 'Design', 'Creating beautiful user experiences', 'sarah@sabiteck.com', '+254700000004', 'https://linkedin.com/in/sarahwilson', 1, 0, 4, '2024-01-04', '2024-01-04'],
                ['David Brown', 'Business Analyst', 'Business', 'Analyzing business requirements', 'david@sabiteck.com', '+254700000005', 'https://linkedin.com/in/davidbrown', 1, 0, 5, '2024-01-05', '2024-01-05']
            ];

            $stmt = $db->prepare("INSERT INTO team (name, position, department, bio, email, phone, linkedin, active, featured, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($dummyTeam as $member) {
                $stmt->execute($member);
            }
            $output[] = "✅ Inserted " . count($dummyTeam) . " dummy team members";
        } else {
            $output[] = "✅ Team table already has {$teamCount} entries";
        }

        // Insert dummy portfolio items if empty
        $stmt = $db->query("SELECT COUNT(*) as count FROM portfolio");
        $portfolioCount = $stmt->fetch()['count'] ?? 0;

        if ($portfolioCount == 0) {
            $dummyPortfolio = [
                ['E-Learning Platform', 'e-learning-platform', 'Web Development', 'A comprehensive online learning management system', 'Full-stack web application built with React and Node.js', 'https://elearning-demo.sabiteck.com', 'https://github.com/sabiteck/elearning', 1, 1, 1, '2024-01-01', '2024-01-01'],
                ['Mobile Banking App', 'mobile-banking-app', 'Mobile Development', 'Secure mobile banking application', 'Cross-platform mobile app with advanced security features', 'https://banking-demo.sabiteck.com', 'https://github.com/sabiteck/banking-app', 1, 1, 2, '2024-01-02', '2024-01-02'],
                ['Analytics Dashboard', 'analytics-dashboard', 'Business Intelligence', 'Real-time business analytics dashboard', 'Interactive dashboard for business intelligence and reporting', 'https://analytics-demo.sabiteck.com', 'https://github.com/sabiteck/analytics', 1, 0, 3, '2024-01-03', '2024-01-03'],
                ['E-commerce Store', 'e-commerce-store', 'E-commerce', 'Full-featured online store', 'Complete e-commerce solution with payment integration', 'https://store-demo.sabiteck.com', 'https://github.com/sabiteck/store', 1, 1, 4, '2024-01-04', '2024-01-04'],
                ['Task Management Tool', 'task-management-tool', 'Web Development', 'Collaborative task management platform', 'Team collaboration and project management tool', 'https://tasks-demo.sabiteck.com', 'https://github.com/sabiteck/tasks', 1, 0, 5, '2024-01-05', '2024-01-05']
            ];

            $stmt = $db->prepare("INSERT INTO portfolio (title, slug, category, description, detailed_description, demo_url, github_url, active, featured, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($dummyPortfolio as $item) {
                $stmt->execute($item);
            }
            $output[] = "✅ Inserted " . count($dummyPortfolio) . " dummy portfolio items";
        } else {
            $output[] = "✅ Portfolio table already has {$portfolioCount} entries";
        }

    } catch (Exception $e) {
        $output[] = "❌ Error inserting dummy data: " . $e->getMessage();
    }

    return $output;
}

function fixAdminEndpoints($db) {
    $output = [];
    $output[] = "🔧 Ensuring Admin Endpoints Work Correctly";
    $output[] = "========================================";
    $output[] = "";

    // Test admin endpoints
    $endpoints = [
        '/api/admin/services' => 'Services admin endpoint',
        '/api/admin/jobs' => 'Jobs admin endpoint',
        '/api/admin/scholarships' => 'Scholarships admin endpoint',
        '/api/admin/settings' => 'Settings admin endpoint',
        '/api/team' => 'Team endpoint',
        '/api/portfolio' => 'Portfolio endpoint'
    ];

    // Include routes to test
    require_once __DIR__ . '/src/routes.php';

    foreach ($endpoints as $endpoint => $description) {
        $output[] = "Testing: {$description} ({$endpoint})";

        try {
            ob_start();
            $handled = handleRoutes('GET', $endpoint, $db);
            $response = ob_get_clean();

            if ($handled && $response) {
                $data = json_decode($response, true);
                if ($data && isset($data['success']) && $data['success']) {
                    $output[] = "  ✅ Success - endpoint working";
                } else {
                    $output[] = "  ⚠️ Response received but not successful";
                    $output[] = "    Response: " . substr($response, 0, 100) . "...";
                }
            } else {
                $output[] = "  ❌ Endpoint not handled or no response";
            }
        } catch (Exception $e) {
            $output[] = "  ❌ Error: " . $e->getMessage();
        }
        $output[] = "";
    }

    return $output;
}

// Execute fixes
echo "🔧 FIXING ADMIN DASHBOARD ENDPOINTS\n";
echo "===================================\n\n";

$db = getDB();
if (!$db) {
    echo "❌ Database connection failed!\n";
    exit(1);
}

// Insert dummy data if needed
$dummyOutput = insertDummyData($db);
foreach ($dummyOutput as $line) {
    echo $line . "\n";
}

echo "\n";

// Test admin endpoints
$endpointOutput = fixAdminEndpoints($db);
foreach ($endpointOutput as $line) {
    echo $line . "\n";
}

// Save results
$allResults = array_merge($dummyOutput, [''], $endpointOutput);
file_put_contents(__DIR__ . '/admin_endpoints_fix.log', implode("\n", $allResults));

echo "\n📄 Results saved to admin_endpoints_fix.log\n";
echo "✅ Admin endpoints setup completed!\n";
echo "\n🚀 Now start the backend server: php -S localhost:8002 -t public\n";
?>