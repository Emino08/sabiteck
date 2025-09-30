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
        echo "Database connection failed: " . $e->getMessage() . "\n";
        return null;
    }
}

echo "Testing Portfolio CRUD Operations\n";
echo "=================================\n\n";

$db = getDB();
if (!$db) {
    echo "Failed to connect to database\n";
    exit(1);
}

try {
    // Test portfolio creation
    echo "1. Testing Portfolio Creation...\n";

    $title = 'Test Portfolio Item';
    $slug = strtolower(str_replace(' ', '-', $title));
    $category = 'Web Development';
    $description = 'Test portfolio description';
    $detailedDescription = '';
    $demoUrl = 'https://test.com';
    $githubUrl = '';
    $active = 1;
    $featured = 0;
    $sortOrder = 0;

    $stmt = $db->prepare("INSERT INTO portfolio (title, slug, category, description, detailed_description, demo_url, github_url, active, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $result = $stmt->execute([$title, $slug, $category, $description, $detailedDescription, $demoUrl, $githubUrl, $active, $featured, $sortOrder]);

    if ($result) {
        $newId = $db->lastInsertId();
        echo "✅ Portfolio item created successfully with ID: {$newId}\n";

        // Test reading the item
        echo "2. Testing Portfolio Read...\n";
        $stmt = $db->prepare("SELECT * FROM portfolio WHERE id = ?");
        $stmt->execute([$newId]);
        $item = $stmt->fetch();

        if ($item) {
            echo "✅ Portfolio item retrieved successfully\n";
            echo "   Title: {$item['title']}\n";
            echo "   Category: {$item['category']}\n";

            // Test updating the item
            echo "3. Testing Portfolio Update...\n";
            $newTitle = 'Updated Test Portfolio Item';
            $stmt = $db->prepare("UPDATE portfolio SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $updateResult = $stmt->execute([$newTitle, $newId]);

            if ($updateResult) {
                echo "✅ Portfolio item updated successfully\n";

                // Test deleting the item
                echo "4. Testing Portfolio Delete...\n";
                $stmt = $db->prepare("DELETE FROM portfolio WHERE id = ?");
                $deleteResult = $stmt->execute([$newId]);

                if ($deleteResult) {
                    echo "✅ Portfolio item deleted successfully\n";
                } else {
                    echo "❌ Failed to delete portfolio item\n";
                }
            } else {
                echo "❌ Failed to update portfolio item\n";
            }
        } else {
            echo "❌ Failed to retrieve portfolio item\n";
        }
    } else {
        echo "❌ Failed to create portfolio item\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n✅ CRUD test completed!\n";
?>