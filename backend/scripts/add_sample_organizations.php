<?php
require_once __DIR__ . '/../src/Models/Database.php';

use DevCo\Models\Database;

try {
    $db = Database::getInstance();

    // First, let's check what columns actually exist
    $columns = [];
    try {
        $result = $db->query("SHOW COLUMNS FROM organizations");
        while ($row = $result->fetch()) {
            $columns[] = $row['Field'];
        }
        echo "Existing columns: " . implode(', ', $columns) . "\n";
    } catch (Exception $e) {
        echo "Table doesn't exist yet, will create it.\n";
    }

    // Create table with basic structure first
    $sql = "CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        website VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        featured TINYINT DEFAULT 0,
        active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    $db->exec($sql);
    echo "Organizations table created/verified.\n";

    // Add additional columns one by one if they don't exist
    $additionalColumns = [
        'category' => 'VARCHAR(100)',
        'address' => 'TEXT',
        'location' => 'VARCHAR(255)',
        'type' => 'VARCHAR(100)',
        'email' => 'VARCHAR(255)',
        'phone' => 'VARCHAR(50)',
        'founded' => 'YEAR',
        'size' => 'VARCHAR(50)',
        'industry' => 'VARCHAR(100)'
    ];

    foreach ($additionalColumns as $columnName => $columnType) {
        try {
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE '$columnName'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN $columnName $columnType");
                echo "Added column: $columnName\n";
            }
        } catch (Exception $e) {
            echo "Error adding column $columnName: " . $e->getMessage() . "\n";
        }
    }

    // Check if we already have organizations
    $count = $db->query("SELECT COUNT(*) as count FROM organizations")->fetch()['count'];

    if ($count == 0) {
        echo "Adding sample organizations...\n";

        $sampleOrganizations = [
            [
                'name' => 'Tech Innovators Ltd',
                'slug' => 'tech-innovators-ltd',
                'description' => 'Leading technology company specializing in software development and digital transformation.',
                'category' => 'Technology',
                'website' => 'https://techinnovators.com',
                'contact_email' => 'info@techinnovators.com',
                'contact_phone' => '+232 76 123 456',
                'address' => '15 Siaka Stevens Street, Freetown',
                'location' => 'Freetown, Sierra Leone',
                'type' => 'Private Company',
                'email' => 'hr@techinnovators.com',
                'phone' => '+232 76 123 456',
                'founded' => 2018,
                'size' => 'medium',
                'industry' => 'Technology',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Sierra Leone Development Bank',
                'slug' => 'sierra-leone-development-bank',
                'description' => 'National development financial institution supporting economic growth and development.',
                'category' => 'Financial Services',
                'website' => 'https://sldb.sl',
                'contact_email' => 'info@sldb.sl',
                'contact_phone' => '+232 22 228 231',
                'address' => 'Lamina Sankoh Street, Freetown',
                'location' => 'Freetown, Sierra Leone',
                'type' => 'Government Institution',
                'email' => 'careers@sldb.sl',
                'phone' => '+232 22 228 231',
                'founded' => 1969,
                'size' => 'large',
                'industry' => 'Banking',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Green Energy Solutions',
                'slug' => 'green-energy-solutions',
                'description' => 'Renewable energy company focused on solar and wind power solutions.',
                'category' => 'Energy',
                'website' => 'https://greenenergy.sl',
                'contact_email' => 'contact@greenenergy.sl',
                'contact_phone' => '+232 77 987 654',
                'address' => 'Wilkinson Road, Freetown',
                'location' => 'Freetown, Sierra Leone',
                'type' => 'Private Company',
                'email' => 'jobs@greenenergy.sl',
                'phone' => '+232 77 987 654',
                'founded' => 2020,
                'size' => 'small',
                'industry' => 'Renewable Energy',
                'featured' => 0,
                'active' => 1
            ],
            [
                'name' => 'Sierra Leone Mining Corporation',
                'slug' => 'sierra-leone-mining-corporation',
                'description' => 'Leading mining company extracting diamonds, iron ore, and other minerals.',
                'category' => 'Mining',
                'website' => 'https://slmining.com',
                'contact_email' => 'info@slmining.com',
                'contact_phone' => '+232 76 555 123',
                'address' => 'Industrial Estate, Bo',
                'location' => 'Bo, Sierra Leone',
                'type' => 'Private Company',
                'email' => 'recruitment@slmining.com',
                'phone' => '+232 76 555 123',
                'founded' => 2005,
                'size' => 'large',
                'industry' => 'Mining',
                'featured' => 1,
                'active' => 1
            ],
            [
                'name' => 'Education First Academy',
                'slug' => 'education-first-academy',
                'description' => 'Premier educational institution offering quality primary and secondary education.',
                'category' => 'Education',
                'website' => 'https://educationfirst.sl',
                'contact_email' => 'admin@educationfirst.sl',
                'contact_phone' => '+232 78 444 567',
                'address' => 'Hill Station, Freetown',
                'location' => 'Freetown, Sierra Leone',
                'type' => 'Private School',
                'email' => 'teachers@educationfirst.sl',
                'phone' => '+232 78 444 567',
                'founded' => 2012,
                'size' => 'medium',
                'industry' => 'Education',
                'featured' => 0,
                'active' => 1
            ],
            [
                'name' => 'Healthcare Plus',
                'slug' => 'healthcare-plus',
                'description' => 'Modern healthcare facility providing comprehensive medical services.',
                'category' => 'Healthcare',
                'website' => 'https://healthcareplus.sl',
                'contact_email' => 'info@healthcareplus.sl',
                'contact_phone' => '+232 79 333 789',
                'address' => 'Congo Cross, Freetown',
                'location' => 'Freetown, Sierra Leone',
                'type' => 'Private Hospital',
                'email' => 'hr@healthcareplus.sl',
                'phone' => '+232 79 333 789',
                'founded' => 2015,
                'size' => 'medium',
                'industry' => 'Healthcare',
                'featured' => 0,
                'active' => 1
            ]
        ];

        // Get current table structure to build dynamic INSERT
        $result = $db->query("SHOW COLUMNS FROM organizations");
        $existingColumns = [];
        while ($row = $result->fetch()) {
            $existingColumns[] = $row['Field'];
        }

        // Remove id, created_at, updated_at from columns list
        $existingColumns = array_filter($existingColumns, function($col) {
            return !in_array($col, ['id', 'created_at', 'updated_at']);
        });

        $columnList = implode(', ', $existingColumns);
        $placeholders = str_repeat('?,', count($existingColumns) - 1) . '?';

        $stmt = $db->prepare("INSERT INTO organizations ($columnList) VALUES ($placeholders)");

        foreach ($sampleOrganizations as $org) {
            try {
                $values = [];
                foreach ($existingColumns as $column) {
                    $values[] = isset($org[$column]) ? $org[$column] : null;
                }

                $stmt->execute($values);
                echo "Added organization: " . $org['name'] . "\n";
            } catch (Exception $e) {
                echo "Error adding " . $org['name'] . ": " . $e->getMessage() . "\n";
            }
        }

        echo "Sample organizations added successfully!\n";
    } else {
        echo "Organizations table already has $count records.\n";
    }

    // Show final count
    $finalCount = $db->query("SELECT COUNT(*) as count FROM organizations")->fetch()['count'];
    echo "Total organizations in database: $finalCount\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
