<?php
require_once __DIR__ . '/../src/Models/Database.php';

use DevCo\Models\Database;

try {
    $db = Database::getInstance();

    echo "Starting organizations setup...\n";

    // First, let's check if the table exists at all
    try {
        $result = $db->query("SELECT 1 FROM organizations LIMIT 1");
        echo "Organizations table exists.\n";
    } catch (Exception $e) {
        echo "Creating organizations table...\n";
        // Create the basic table first
        $sql = "CREATE TABLE organizations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE,
            description TEXT,
            category VARCHAR(100),
            website VARCHAR(255),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(50),
            address TEXT,
            location VARCHAR(255),
            featured TINYINT DEFAULT 0,
            active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $db->exec($sql);
        echo "Organizations table created successfully.\n";
    }

    // Check current table structure
    $result = $db->query("SHOW COLUMNS FROM organizations");
    $existingColumns = [];
    while ($row = $result->fetch()) {
        $existingColumns[] = $row['Field'];
    }
    echo "Current columns: " . implode(', ', $existingColumns) . "\n";

    // Check if we already have data
    $count = $db->query("SELECT COUNT(*) as count FROM organizations")->fetch()['count'];
    echo "Current record count: $count\n";

    if ($count == 0) {
        echo "Adding basic sample organizations...\n";

        // Start with basic organizations using only existing columns
        $basicOrganizations = [
            [
                'name' => 'Tech Innovators Ltd',
                'slug' => 'tech-innovators-ltd',
                'description' => 'Leading technology company specializing in software development and digital transformation.',
                'website' => 'https://techinnovators.com',
                'contact_email' => 'info@techinnovators.com',
                'contact_phone' => '+232 76 123 456',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Sierra Leone Development Bank',
                'slug' => 'sierra-leone-development-bank',
                'description' => 'National development financial institution supporting economic growth and development.',
                'website' => 'https://sldb.sl',
                'contact_email' => 'info@sldb.sl',
                'contact_phone' => '+232 22 228 231',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Green Energy Solutions',
                'slug' => 'green-energy-solutions',
                'description' => 'Renewable energy company focused on solar and wind power solutions.',
                'website' => 'https://greenenergy.sl',
                'contact_email' => 'contact@greenenergy.sl',
                'contact_phone' => '+232 77 987 654',
                'featured' => 0,
                'active' => 1
            ],
            [
                'name' => 'Sierra Leone Mining Corporation',
                'slug' => 'sierra-leone-mining-corporation',
                'description' => 'Leading mining company extracting diamonds, iron ore, and other minerals.',
                'website' => 'https://slmining.com',
                'contact_email' => 'info@slmining.com',
                'contact_phone' => '+232 76 555 123',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Education First Academy',
                'slug' => 'education-first-academy',
                'description' => 'Premier educational institution offering quality primary and secondary education.',
                'website' => 'https://educationfirst.sl',
                'contact_email' => 'admin@educationfirst.sl',
                'contact_phone' => '+232 78 444 567',
                'featured' => 0,
                'active' => 1
            ],
            [
                'name' => 'Healthcare Plus',
                'slug' => 'healthcare-plus',
                'description' => 'Modern healthcare facility providing comprehensive medical services.',
                'website' => 'https://healthcareplus.sl',
                'contact_email' => 'info@healthcareplus.sl',
                'contact_phone' => '+232 79 333 789',
                'featured' => 0,
                'active' => 1
            ]
        ];

        // Build INSERT statement based on available columns
        $insertColumns = [];
        $sampleKeys = array_keys($basicOrganizations[0]);

        foreach ($sampleKeys as $key) {
            if (in_array($key, $existingColumns)) {
                $insertColumns[] = $key;
            }
        }

        $columnList = implode(', ', $insertColumns);
        $placeholders = str_repeat('?,', count($insertColumns) - 1) . '?';

        $stmt = $db->prepare("INSERT INTO organizations ($columnList) VALUES ($placeholders)");

        foreach ($basicOrganizations as $org) {
            try {
                $values = [];
                foreach ($insertColumns as $column) {
                    $values[] = $org[$column];
                }

                $stmt->execute($values);
                echo "Added organization: " . $org['name'] . "\n";
            } catch (Exception $e) {
                echo "Error adding " . $org['name'] . ": " . $e->getMessage() . "\n";
            }
        }

        echo "Sample organizations added successfully!\n";
    } else {
        echo "Organizations table already has $count records. Skipping data insertion.\n";
    }

    // Show final count and some sample data
    $finalCount = $db->query("SELECT COUNT(*) as count FROM organizations")->fetch()['count'];
    echo "Total organizations in database: $finalCount\n";

    if ($finalCount > 0) {
        echo "\nSample organizations:\n";
        $sampleData = $db->query("SELECT id, name, contact_email, featured, active FROM organizations LIMIT 3")->fetchAll();
        foreach ($sampleData as $org) {
            echo "- ID: {$org['id']}, Name: {$org['name']}, Email: {$org['contact_email']}, Featured: {$org['featured']}, Active: {$org['active']}\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
