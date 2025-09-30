<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class SettingsController
{
    // Get all public route settings
    public function getPublicRouteSettings(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Get all route visibility settings using correct column names
            $stmt = $db->prepare("
                SELECT name, value
                FROM settings
                WHERE category = 'route' AND name LIKE '%_enabled'
                ORDER BY name
            ");
            $stmt->execute();
            $settings = $stmt->fetchAll();

            // Format for easier frontend consumption
            $routeSettings = [];
            foreach ($settings as $setting) {
                $routeKey = str_replace('_enabled', '', $setting['name']);
                $routeSettings[$routeKey] = [
                    'enabled' => (bool)$setting['value'],
                    'description' => ''
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'routes' => $routeSettings
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Settings getPublicRouteSettings error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch route settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Update route settings (Admin only)
    public function updateRouteSettings(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['routes']) || !is_array($data['routes'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid route settings data'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Begin transaction
            $db->beginTransaction();

            try {
                foreach ($data['routes'] as $route => $enabled) {
                    $settingName = "{$route}_enabled";
                    $stmt = $db->prepare("
                        INSERT INTO settings (category, name, value, updated_at)
                        VALUES ('route', ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        value = VALUES(value),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$settingName, $enabled ? 1 : 0]);
                }

                $db->commit();

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Route settings updated successfully'
                ]));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (\Exception $e) {
                $db->rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log("Settings updateRouteSettings error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to update route settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Get general site settings
    public function getSettings(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Get all settings using correct column names
            $stmt = $db->query("SELECT category, name, value FROM settings ORDER BY category, name");
            $settings = $stmt->fetchAll();

            // Format settings as key-value pairs
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $key = $setting['category'] . '.' . $setting['name'];
                $formattedSettings[$key] = [
                    'value' => $setting['value'],
                    'description' => '',
                    'category' => $setting['category']
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'settings' => $formattedSettings
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Settings getSettings error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Update general settings (Admin only)
    public function updateSettings(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['settings']) || !is_array($data['settings'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid settings data'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Begin transaction
            $db->beginTransaction();

            try {
                foreach ($data['settings'] as $key => $valueData) {
                    $value = is_array($valueData) ? $valueData['value'] : $valueData;
                    $category = is_array($valueData) ? ($valueData['category'] ?? 'general') : 'general';

                    // Parse key if it contains category (e.g., "general.site_name" -> category="general", name="site_name")
                    if (strpos($key, '.') !== false) {
                        list($category, $name) = explode('.', $key, 2);
                    } else {
                        $name = $key;
                    }

                    $stmt = $db->prepare("
                        INSERT INTO settings (category, name, value, updated_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        value = VALUES(value),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$category, $name, $value]);
                }

                $db->commit();

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Settings updated successfully'
                ]));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (\Exception $e) {
                $db->rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log("Settings updateSettings error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to update settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Get all settings for admin panel
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Get all settings using correct column names
            $stmt = $db->query("SELECT category, name, value FROM settings ORDER BY category, name");
            $settings = $stmt->fetchAll();

            // Format settings as key-value pairs
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $key = $setting['category'] . '.' . $setting['name'];
                $formattedSettings[$key] = [
                    'value' => $setting['value'],
                    'description' => '',
                    'category' => $setting['category']
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'settings' => $formattedSettings
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Settings getAll error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Save settings for admin panel
    public function save(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['settings']) || !is_array($data['settings'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid settings data'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureSettingsTable($db);

            // Begin transaction
            $db->beginTransaction();

            try {
                foreach ($data['settings'] as $key => $valueData) {
                    $value = is_array($valueData) ? $valueData['value'] : $valueData;
                    $category = is_array($valueData) ? ($valueData['category'] ?? 'general') : 'general';

                    // Parse key if it contains category (e.g., "general.site_name" -> category="general", name="site_name")
                    if (strpos($key, '.') !== false) {
                        list($category, $name) = explode('.', $key, 2);
                    } else {
                        $name = $key;
                    }

                    $stmt = $db->prepare("
                        INSERT INTO settings (category, name, value, updated_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        value = VALUES(value),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$category, $name, $value]);
                }

                $db->commit();

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Settings saved successfully'
                ]));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (\Exception $e) {
                $db->rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log("Settings save error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to save settings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Get table columns
     */
    private function getTableColumns($db, string $tableName): array
    {
        try {
            $stmt = $db->query("SHOW COLUMNS FROM {$tableName}");
            $columns = [];
            while ($row = $stmt->fetch()) {
                $columns[] = $row['Field'];
            }
            return $columns;
        } catch (Exception $e) {
            return [];
        }
    }

    private function ensureSettingsTable($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'settings'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE settings (
                    id INT NOT NULL AUTO_INCREMENT,
                    category VARCHAR(50) NOT NULL DEFAULT 'general',
                    name VARCHAR(100) NOT NULL,
                    value TEXT NULL,
                    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE INDEX unique_setting (category ASC, name ASC),
                    INDEX idx_category (category ASC)
                )
            ");

            // Insert default route settings
            $defaultRoutes = [
                ['route', 'home_enabled', '1'],
                ['route', 'about_enabled', '1'],
                ['route', 'services_enabled', '1'],
                ['route', 'portfolio_enabled', '1'],
                ['route', 'jobs_enabled', '1'],
                ['route', 'scholarships_enabled', '1'],
                ['route', 'blog_enabled', '1'],
                ['route', 'contact_enabled', '1'],
                ['route', 'team_enabled', '1'],
                ['route', 'news_enabled', '1']
            ];

            $stmt = $db->prepare("INSERT INTO settings (category, name, value) VALUES (?, ?, ?)");
            foreach ($defaultRoutes as $route) {
                $stmt->execute($route);
            }
        }
    }
}
