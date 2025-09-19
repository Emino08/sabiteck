<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class RouteSettingsController
{
    public function getRouteSettings(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            $stmt = $db->query("
                SELECT route_name, is_visible, display_name, description, display_order
                FROM route_settings
                ORDER BY display_order ASC
            ");
            $settings = $stmt->fetchAll();

            // If no settings exist, create default ones
            if (empty($settings)) {
                $this->createDefaultRouteSettings($db);
                $stmt = $db->query("
                    SELECT route_name, is_visible, display_name, description, display_order
                    FROM route_settings
                    ORDER BY display_order ASC
                ");
                $settings = $stmt->fetchAll();
            }

            // Convert to the format expected by frontend
            $routes = [];
            foreach ($settings as $setting) {
                $routes[] = [
                    'route_name' => $setting['route_name'],
                    'is_visible' => (bool)$setting['is_visible'],
                    'display_name' => $setting['display_name'],
                    'description' => $setting['description'],
                    'display_order' => (int)$setting['display_order']
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'routes' => $routes
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch route settings: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateRouteSettings(Request $request, Response $response, $args)
    {
        try {
            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);

            if (!isset($data['routes'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Routes data is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();

            // Update each route setting
            foreach ($data['routes'] as $routeData) {
                $stmt = $db->prepare("
                    UPDATE route_settings
                    SET is_visible = ?, display_name = ?, description = ?, display_order = ?
                    WHERE route_name = ?
                ");
                $stmt->execute([
                    ($routeData['is_visible'] ? 1 : 0),
                    $routeData['display_name'],
                    $routeData['description'],
                    $routeData['display_order'] ?? 0,
                    $routeData['route_name']
                ]);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Route settings updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to update route settings: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateRouteVisibility(Request $request, Response $response, $args)
    {
        $routeName = $args['route_name'] ?? '';

        try {
            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);

            if (!isset($data['is_visible'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Visibility status is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();

            $stmt = $db->prepare("
                UPDATE route_settings
                SET is_visible = ?
                WHERE route_name = ?
            ");
            $stmt->execute([($data['is_visible'] ? 1 : 0), $routeName]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Route visibility updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to update route visibility: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function addRoute(Request $request, Response $response, $args)
    {
        try {
            $body = $request->getBody()->getContents();
            $data = json_decode($body, true);

            if (!isset($data['route_name']) || !isset($data['display_name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Route name and display name are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();

            $stmt = $db->prepare("
                INSERT INTO route_settings (route_name, is_visible, display_name, description, display_order)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['route_name'],
                $data['is_visible'] ?? 1,
                $data['display_name'],
                $data['description'] ?? '',
                $data['display_order'] ?? 0
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Route added successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to add route: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function deleteRoute(Request $request, Response $response, $args)
    {
        $routeName = $args['route_name'] ?? '';

        try {
            $db = Database::getInstance();

            $stmt = $db->prepare("DELETE FROM route_settings WHERE route_name = ?");
            $stmt->execute([$routeName]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Route deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to delete route: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function createDefaultRouteSettings($db)
    {
        $defaultRoutes = [
            // Main navigation routes with proper display order
            ['home', 1, 'Home', 'Main landing page', 1],
            ['about', 1, 'About', 'Company information', 2],
            ['services', 1, 'Services', 'Our service offerings', 3],
            ['portfolio', 1, 'Portfolio', 'Our work showcase', 4],
            ['team', 1, 'Team', 'Meet our team', 5],
            ['jobs', 1, 'Jobs', 'Career opportunities', 6],
            ['scholarships', 1, 'Scholarships', 'Educational funding', 7],
            ['announcements', 1, 'Announcements', 'Latest news', 8],
            ['contact', 1, 'Contact', 'Get in touch', 9],

            // Additional service pages
            ['study-abroad', 1, 'Study Abroad', 'International education', 10],
            ['business-intelligence', 1, 'Business Intelligence', 'Data analytics', 11],
            ['consulting', 1, 'Consulting', 'Business consulting', 12],
            ['internships', 1, 'Internships', 'Training programs', 13]
        ];

        $stmt = $db->prepare("
            INSERT IGNORE INTO route_settings
            (route_name, is_visible, display_name, description, display_order)
            VALUES (?, ?, ?, ?, ?)
        ");

        foreach ($defaultRoutes as $route) {
            $stmt->execute($route);
        }
    }
}
