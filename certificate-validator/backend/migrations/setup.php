<?php
/**
 * Database Migration Setup Script
 * Academic Credentials Verification Platform
 */

require_once __DIR__ . '/../vendor/autoload.php';

class DatabaseMigrator {
    private $pdo;
    private $config;

    public function __construct() {
        $this->loadConfig();
        $this->connectDatabase();
    }

    private function loadConfig() {
        $envFile = __DIR__ . '/../.env';
        if (!file_exists($envFile)) {
            throw new Exception('.env file not found. Please copy .env.example to .env and configure database settings.');
        }

        $env = parse_ini_file($envFile);
        $this->config = [
            'host' => $env['DB_HOST'] ?? 'localhost',
            'port' => $env['DB_PORT'] ?? '3306',
            'database' => $env['DB_DATABASE'] ?? 'credential_verification',
            'username' => $env['DB_USERNAME'] ?? 'root',
            'password' => $env['DB_PASSWORD'] ?? '',
            'charset' => 'utf8mb4'
        ];
    }

    private function connectDatabase() {
        try {
            // First connect without database to create it if needed
            $dsn = sprintf(
                'mysql:host=%s;port=%s;charset=%s',
                $this->config['host'],
                $this->config['port'],
                $this->config['charset']
            );

            $this->pdo = new PDO($dsn, $this->config['username'], $this->config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->config['charset']}"
            ]);

            echo "Connected to MySQL server successfully.\n";
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public function runMigrations() {
        $migrationFiles = [
            '001_create_database_schema.sql',
            '002_seed_data.sql'
        ];

        foreach ($migrationFiles as $file) {
            $this->runMigrationFile($file);
        }

        echo "\n✅ All migrations completed successfully!\n";
        echo "🚀 Database is ready for use.\n\n";
        $this->printNextSteps();
    }

    private function runMigrationFile($filename) {
        $filepath = __DIR__ . '/' . $filename;

        if (!file_exists($filepath)) {
            throw new Exception("Migration file not found: $filename");
        }

        echo "Running migration: $filename\n";

        $sql = file_get_contents($filepath);

        // Split SQL into individual statements
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) { return !empty($stmt) && !preg_match('/^\s*--/', $stmt); }
        );

        foreach ($statements as $statement) {
            if (trim($statement)) {
                try {
                    $this->pdo->exec($statement);
                } catch (PDOException $e) {
                    echo "Error in statement: " . substr($statement, 0, 100) . "...\n";
                    throw new Exception("Migration failed: " . $e->getMessage());
                }
            }
        }

        echo "✅ $filename completed\n";
    }

    public function resetDatabase() {
        echo "🔄 Resetting database...\n";

        $this->pdo->exec("DROP DATABASE IF EXISTS {$this->config['database']}");
        echo "Database dropped.\n";

        $this->runMigrations();
    }

    public function testConnection() {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) as institution_count FROM institutions");
            $result = $stmt->fetch();

            echo "✅ Database connection test successful!\n";
            echo "📊 Found {$result['institution_count']} institutions in database.\n";

            return true;
        } catch (PDOException $e) {
            echo "❌ Database connection test failed: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function printNextSteps() {
        echo "Next Steps:\n";
        echo "1. Update .env file with your specific configuration\n";
        echo "2. Run 'composer install' to install PHP dependencies\n";
        echo "3. Start the development server: 'php -S localhost:8000 -t public'\n";
        echo "4. Set up the frontend: 'cd frontend && npm install && npm run dev'\n";
        echo "\nDefault admin credentials:\n";
        echo "Email: admin@credentials.gov\n";
        echo "Password: password (change this immediately!)\n\n";
    }
}

// Command line interface
if (php_sapi_name() === 'cli') {
    $command = $argv[1] ?? 'migrate';

    try {
        $migrator = new DatabaseMigrator();

        switch ($command) {
            case 'migrate':
                $migrator->runMigrations();
                break;
            case 'reset':
                $migrator->resetDatabase();
                break;
            case 'test':
                $migrator->testConnection();
                break;
            default:
                echo "Usage: php setup.php [migrate|reset|test]\n";
                echo "  migrate - Run all migrations (default)\n";
                echo "  reset   - Drop database and run migrations\n";
                echo "  test    - Test database connection\n";
                exit(1);
        }
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
} else {
    // Web interface for setup
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Setup - Academic Credentials Verification Platform</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .success { color: green; } .error { color: red; } .info { color: blue; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>Database Setup</h1>
        <?php
        if (isset($_POST['action'])) {
            try {
                $migrator = new DatabaseMigrator();
                ob_start();

                switch ($_POST['action']) {
                    case 'migrate':
                        $migrator->runMigrations();
                        break;
                    case 'reset':
                        $migrator->resetDatabase();
                        break;
                    case 'test':
                        $migrator->testConnection();
                        break;
                }

                $output = ob_get_clean();
                echo "<div class='success'><pre>$output</pre></div>";
            } catch (Exception $e) {
                $output = ob_get_clean();
                echo "<div class='error'><pre>Error: " . $e->getMessage() . "\n$output</pre></div>";
            }
        }
        ?>

        <form method="POST">
            <button type="submit" name="action" value="migrate">Run Migrations</button>
            <button type="submit" name="action" value="reset">Reset Database</button>
            <button type="submit" name="action" value="test">Test Connection</button>
        </form>

        <div class="info">
            <h3>Instructions:</h3>
            <ol>
                <li>Ensure your .env file is configured with correct database credentials</li>
                <li>Click "Run Migrations" to set up the database</li>
                <li>Use "Reset Database" only if you want to start fresh</li>
                <li>Use "Test Connection" to verify everything is working</li>
            </ol>
        </div>
    </body>
    </html>
    <?php
}
?>