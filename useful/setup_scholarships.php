<?php
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

try {
    // Database connection
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Connected to database successfully.\n";

    // Create scholarships table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS scholarships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            category VARCHAR(100),
            region VARCHAR(100),
            education_level VARCHAR(100),
            amount DECIMAL(10,2),
            deadline DATE,
            featured TINYINT(1) DEFAULT 0,
            status ENUM('active', 'inactive') DEFAULT 'active',
            category_icon VARCHAR(50) DEFAULT 'Award',
            provider VARCHAR(255),
            requirements TEXT,
            application_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");

    echo "Scholarships table created successfully.\n";

    // Clear existing scholarships to avoid duplicates
    $pdo->exec("DELETE FROM scholarships");
    echo "Cleared existing scholarships.\n";

    // Insert sample scholarships
    $scholarships = [
        ['Global Excellence Scholarship', 'global-excellence-scholarship', 'Full tuition scholarship for outstanding international students pursuing undergraduate degrees.', 'Academic Excellence', 'Global', 'Undergraduate', 25000.00, '2024-12-15', 1, 'active', 'Trophy', 'Global Education Foundation', 'Minimum GPA of 3.8, SAT score above 1400', 'https://example.com/apply/global-excellence'],
        ['STEM Innovation Grant', 'stem-innovation-grant', 'Funding for students pursuing degrees in Science, Technology, Engineering, and Mathematics.', 'STEM', 'North America', 'Graduate', 15000.00, '2024-11-30', 1, 'active', 'BookOpen', 'Tech Innovation Institute', 'Must be enrolled in STEM program, research proposal required', 'https://example.com/apply/stem-innovation'],
        ['Women in Tech Scholarship', 'women-in-tech-scholarship', 'Supporting women pursuing careers in technology and computer science.', 'Technology', 'Global', 'Undergraduate', 10000.00, '2024-10-31', 1, 'active', 'Users', 'Women Tech Foundation', 'Female students in computer science or related fields', 'https://example.com/apply/women-tech'],
        ['African Leaders Scholarship', 'african-leaders-scholarship', 'Leadership development program with full funding for African students.', 'Leadership', 'Africa', 'Graduate', 30000.00, '2024-09-30', 1, 'active', 'Award', 'African Development Bank', 'Citizenship of African country, leadership experience', 'https://example.com/apply/african-leaders'],
        ['Arts and Culture Grant', 'arts-culture-grant', 'Financial support for students pursuing degrees in arts, music, and cultural studies.', 'Arts & Culture', 'Europe', 'Undergraduate', 8000.00, '2024-12-01', 0, 'active', 'Briefcase', 'European Arts Council', 'Portfolio submission required, arts-related program enrollment', 'https://example.com/apply/arts-culture'],
        ['Medical Research Fellowship', 'medical-research-fellowship', 'Research funding for medical students conducting innovative research projects.', 'Medical', 'Global', 'Graduate', 20000.00, '2024-11-15', 0, 'active', 'BookOpen', 'International Medical Association', 'Medical school enrollment, research proposal', 'https://example.com/apply/medical-research'],
        ['Business Leadership Award', 'business-leadership-award', 'Scholarship for students demonstrating exceptional leadership in business and entrepreneurship.', 'Business', 'Global', 'Graduate', 18000.00, '2024-12-31', 1, 'active', 'Briefcase', 'Business Leaders Institute', 'Business program enrollment, leadership portfolio', 'https://example.com/apply/business-leadership'],
        ['Environmental Science Grant', 'environmental-science-grant', 'Supporting future environmental scientists and sustainability researchers.', 'Environmental', 'Global', 'Undergraduate', 12000.00, '2024-11-20', 0, 'active', 'Globe', 'Green Future Foundation', 'Environmental science major, sustainability project', 'https://example.com/apply/environmental-science']
    ];

    $stmt = $pdo->prepare("
        INSERT INTO scholarships (title, slug, description, category, region, education_level, amount, deadline, featured, status, category_icon, provider, requirements, application_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($scholarships as $scholarship) {
        $stmt->execute($scholarship);
        echo "Inserted: {$scholarship[0]}\n";
    }

    echo "\nScholarships setup completed successfully!\n";
    echo "Total scholarships inserted: " . count($scholarships) . "\n";

    // Verify the insertion
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM scholarships");
    $result = $stmt->fetch();
    echo "Total scholarships in database: {$result['total']}\n";

    // Show featured scholarships
    $stmt = $pdo->query("SELECT title, category, region, amount FROM scholarships WHERE featured = 1");
    $featured = $stmt->fetchAll();
    echo "\nFeatured scholarships:\n";
    foreach ($featured as $scholarship) {
        echo "- {$scholarship['title']} ({$scholarship['category']}) - \${$scholarship['amount']}\n";
    }

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
