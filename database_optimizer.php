<?php
/**
 * Database Optimizer Script
 * Safely removes unused tables and optimizes database structure
 *
 * Usage: php database_optimizer.php --dry-run (to see what would be removed)
 *        php database_optimizer.php --execute (to actually remove tables)
 */

require_once 'backend/src/Models/Database.php';
use DevCo\Models\Database;

class DatabaseOptimizer {
    private $db;
    private $dryRun;

    // Tables that are definitely safe to remove (high confidence duplicates)
    private $safeTablesToRemove = [
        'analytics_pageviews', // duplicate of analytics_page_views
    ];

    // Tables to investigate - will check if they have recent data
    private $tablesToInvestigate = [
        // Analytics tables
        'analytics_events' => 30, // days
        'analytics_visits' => 30,
        'analytics_sessions' => 30,
        'analytics_realtime' => 7,
        'analytics_settings' => 0, // configuration table
        'analytics_visitors' => 30,
        'analytics_page_views' => 30,

        // Newsletter tables
        'newsletter_campaigns' => 90,
        'newsletter_subscribers' => 0, // keep if has any subscribers
        'newsletter_subscriptions' => 0,
        'newsletter_templates' => 0,

        // Announcement tables
        'announcements' => 60,
        'announcement_types' => 0,

        // Social media
        'social_posts' => 60,

        // Company info (check for duplicates)
        'company_content' => 0, // if company_info exists

        // Configuration tables
        'api_configurations' => 0,
        'app_configurations' => 0,
        'route_settings' => 0,
        'static_messages' => 0,
        'default_field_values' => 0,

        // Potential duplicates
        'blog_posts' => 0, // if content handles blogs
        'blog_categories' => 0, // if content_categories handles blog cats
        'portfolio_projects' => 0, // if portfolio handles projects
        'team_members' => 0, // if team handles members
        'setting_value' => 0, // if settings handles values

        // Category tables (if unused)
        'portfolio_categories' => 0,
        'service_categories' => 0,
        'organization_categories' => 0,
        'scholarship_categories' => 0,

        // Job application history
        'job_application_history' => 90,
    ];

    // Critical tables that should NEVER be removed
    private $criticalTables = [
        'users', 'admin_users', 'roles', 'permissions', 'user_roles',
        'content', 'content_categories', 'content_comments', 'content_likes', 'content_types',
        'jobs', 'job_applications', 'job_categories',
        'scholarships', 'services', 'portfolio', 'team', 'organizations',
        'settings', 'contacts', 'regions', 'education_levels'
    ];

    public function __construct($dryRun = true) {
        $this->db = Database::getInstance();
        $this->dryRun = $dryRun;
    }

    public function optimize() {
        echo "=== Database Optimization Tool ===\n";
        echo "Mode: " . ($this->dryRun ? "DRY RUN (no changes)" : "EXECUTE (will make changes)") . "\n\n";

        $this->showCurrentTableStats();
        $this->removeSafeTables();
        $this->investigateTables();
        $this->showFinalStats();
    }

    private function showCurrentTableStats() {
        echo "=== Current Database Statistics ===\n";

        try {
            $stmt = $this->db->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            echo "Total tables: " . count($tables) . "\n";
            echo "Critical tables: " . count($this->criticalTables) . "\n";
            echo "Tables to investigate: " . count($this->tablesToInvestigate) . "\n";
            echo "Safe to remove: " . count($this->safeTablesToRemove) . "\n\n";

            // Show table sizes
            echo "=== Table Sizes ===\n";
            $totalSize = 0;
            foreach ($tables as $table) {
                $size = $this->getTableSize($table);
                $totalSize += $size;
                if ($size > 0) {
                    echo sprintf("%-30s: %s\n", $table, $this->formatBytes($size));
                }
            }
            echo sprintf("%-30s: %s\n\n", "TOTAL DATABASE SIZE", $this->formatBytes($totalSize));

        } catch (Exception $e) {
            echo "Error getting table stats: " . $e->getMessage() . "\n";
        }
    }

    private function removeSafeTables() {
        echo "=== Removing Safe Tables ===\n";

        foreach ($this->safeTablesToRemove as $table) {
            if ($this->tableExists($table)) {
                $recordCount = $this->getRecordCount($table);
                echo "Table '$table': $recordCount records\n";

                if (!$this->dryRun) {
                    try {
                        $this->db->exec("DROP TABLE IF EXISTS `$table`");
                        echo "  ✓ Dropped table '$table'\n";
                    } catch (Exception $e) {
                        echo "  ✗ Error dropping '$table': " . $e->getMessage() . "\n";
                    }
                } else {
                    echo "  → Would drop table '$table'\n";
                }
            } else {
                echo "Table '$table': Does not exist\n";
            }
        }
        echo "\n";
    }

    private function investigateTables() {
        echo "=== Investigating Potentially Unused Tables ===\n";

        foreach ($this->tablesToInvestigate as $table => $dayThreshold) {
            if (!$this->tableExists($table)) {
                echo "Table '$table': Does not exist\n";
                continue;
            }

            $recordCount = $this->getRecordCount($table);
            $recentRecords = $this->getRecentRecords($table, $dayThreshold);
            $shouldRemove = $this->shouldRemoveTable($table, $recordCount, $recentRecords, $dayThreshold);

            echo sprintf("%-30s: %d total, %d recent (%d days)\n",
                $table, $recordCount, $recentRecords, $dayThreshold);

            if ($shouldRemove) {
                if (!$this->dryRun) {
                    try {
                        $this->db->exec("DROP TABLE IF EXISTS `$table`");
                        echo "  ✓ Dropped table '$table'\n";
                    } catch (Exception $e) {
                        echo "  ✗ Error dropping '$table': " . $e->getMessage() . "\n";
                    }
                } else {
                    echo "  → Would drop table '$table' (unused)\n";
                }
            } else {
                echo "  ✓ Keeping table '$table' (has data or recent activity)\n";
            }
        }
        echo "\n";
    }

    private function shouldRemoveTable($table, $recordCount, $recentRecords, $dayThreshold) {
        // Never remove if it has recent activity
        if ($recentRecords > 0) return false;

        // Remove if empty
        if ($recordCount == 0) return true;

        // For configuration tables, check if they have any data
        if ($dayThreshold == 0) {
            return $recordCount == 0;
        }

        // For data tables, remove if no recent activity
        return $recentRecords == 0;
    }

    private function tableExists($table) {
        try {
            $stmt = $this->db->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    private function getRecordCount($table) {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM `$table`");
            return (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }

    private function getRecentRecords($table, $days) {
        if ($days == 0) return $this->getRecordCount($table);

        // Try common timestamp column names
        $timestampColumns = ['created_at', 'updated_at', 'subscribed_at', 'timestamp'];

        foreach ($timestampColumns as $column) {
            try {
                $stmt = $this->db->prepare("SELECT COUNT(*) FROM `$table` WHERE `$column` >= DATE_SUB(NOW(), INTERVAL ? DAY)");
                $stmt->execute([$days]);
                return (int)$stmt->fetchColumn();
            } catch (Exception $e) {
                continue;
            }
        }

        return $this->getRecordCount($table);
    }

    private function getTableSize($table) {
        try {
            $stmt = $this->db->prepare("
                SELECT ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
                FROM information_schema.TABLES
                WHERE table_schema = DATABASE() AND table_name = ?
            ");
            $stmt->execute([$table]);
            $result = $stmt->fetchColumn();
            return $result ? $result * 1024 * 1024 : 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    private function formatBytes($bytes) {
        if ($bytes == 0) return '0 B';
        $k = 1024;
        $sizes = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }

    private function showFinalStats() {
        echo "=== Final Statistics ===\n";
        try {
            $stmt = $this->db->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "Remaining tables: " . count($tables) . "\n";

            if (!$this->dryRun) {
                echo "Database optimization completed.\n";
            } else {
                echo "Dry run completed. Use --execute to apply changes.\n";
            }
        } catch (Exception $e) {
            echo "Error getting final stats: " . $e->getMessage() . "\n";
        }
    }
}

// Command line usage
if (php_sapi_name() === 'cli') {
    $dryRun = true;

    if (in_array('--execute', $argv)) {
        $dryRun = false;
        echo "WARNING: This will make permanent changes to your database!\n";
        echo "Continue? (y/N): ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        if (trim($line) !== 'y' && trim($line) !== 'Y') {
            echo "Aborted.\n";
            exit(1);
        }
    }

    $optimizer = new DatabaseOptimizer($dryRun);
    $optimizer->optimize();
}
?>