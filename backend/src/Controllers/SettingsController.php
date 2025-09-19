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

            // Get all route visibility settings
            $stmt = $db->prepare("
                SELECT setting_key, setting_value, description
                FROM site_settings
                WHERE setting_key LIKE 'route_%_enabled'
                ORDER BY setting_key
            ");
            $stmt->execute();
            $settings = $stmt->fetchAll();

            // Format for easier frontend consumption
            $routeSettings = [];
            foreach ($settings as $setting) {
                $routeKey = str_replace(['route_', '_enabled'], '', $setting['setting_key']);
                $routeSettings[$routeKey] = [
                    'enabled' => (bool)$setting['setting_value'],
                    'description' => $setting['description']
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
                    $settingKey = "route_{$route}_enabled";
                    $stmt = $db->prepare("
                        INSERT INTO site_settings (setting_key, setting_value, updated_at)
                        VALUES (?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$settingKey, $enabled ? 1 : 0]);
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

            $stmt = $db->query("SELECT setting_key, setting_value, description FROM site_settings ORDER BY setting_key");
            $settings = $stmt->fetchAll();

            // Format settings as key-value pairs
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $formattedSettings[$setting['setting_key']] = [
                    'value' => $setting['setting_value'],
                    'description' => $setting['description']
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
                    $description = is_array($valueData) ? ($valueData['description'] ?? '') : '';

                    $stmt = $db->prepare("
                        INSERT INTO site_settings (setting_key, setting_value, description, updated_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        description = VALUES(description),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$key, $value, $description]);
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

            $stmt = $db->query("SELECT setting_key, setting_value, description FROM site_settings ORDER BY setting_key");
            $settings = $stmt->fetchAll();

            // Format settings as key-value pairs
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $formattedSettings[$setting['setting_key']] = [
                    'value' => $setting['setting_value'],
                    'description' => $setting['description']
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
                    $description = is_array($valueData) ? ($valueData['description'] ?? '') : '';

                    $stmt = $db->prepare("
                        INSERT INTO site_settings (setting_key, setting_value, description, updated_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        description = VALUES(description),
                        updated_at = NOW()
                    ");
                    $stmt->execute([$key, $value, $description]);
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

    private function ensureSettingsTable($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'site_settings'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE site_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");

            // Insert default route settings
            $defaultRoutes = [
                ['route_home_enabled', '1', 'Enable/disable home page'],
                ['route_about_enabled', '1', 'Enable/disable about page'],
                ['route_services_enabled', '1', 'Enable/disable services page'],
                ['route_portfolio_enabled', '1', 'Enable/disable portfolio page'],
                ['route_jobs_enabled', '1', 'Enable/disable jobs page'],
                ['route_scholarships_enabled', '1', 'Enable/disable scholarships page'],
                ['route_blog_enabled', '1', 'Enable/disable blog page'],
                ['route_contact_enabled', '1', 'Enable/disable contact page'],
                ['route_team_enabled', '1', 'Enable/disable team page'],
                ['route_news_enabled', '1', 'Enable/disable news page']
            ];

            $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
            foreach ($defaultRoutes as $route) {
                $stmt->execute($route);
            }
        }
    }
}
