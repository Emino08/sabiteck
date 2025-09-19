<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ServicesController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM services WHERE active = 1 ORDER BY sort_order ASC, popular DESC");
            $stmt->execute();
            $services = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($services));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch services'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getBySlug(Request $request, Response $response, $args)
    {
        $slug = $args['slug'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM services WHERE slug = ? AND active = 1");
            $stmt->execute([$slug]);
            $service = $stmt->fetch();
            
            if (!$service) {
                $response->getBody()->write(json_encode([
                    'error' => 'Service not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode($service));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch service'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getPopular(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM services WHERE active = 1 AND popular = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $services = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($services));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch popular services'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (empty($data['title'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Title is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            $slug = strtolower(str_replace(' ', '-', $data['title']));
            
            $stmt = $db->prepare("INSERT INTO services (title, slug, short_description, full_description, icon, features, technologies, pricing, timeline, process_steps, popular, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['title'],
                $slug,
                $data['short_description'] ?? null,
                $data['full_description'] ?? null,
                $data['icon'] ?? null,
                $data['features'] ?? null,
                $data['technologies'] ?? null,
                $data['pricing'] ?? null,
                $data['timeline'] ?? null,
                $data['process_steps'] ?? null,
                $data['popular'] ?? 0,
                $data['active'] ?? 1
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Service created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create service: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function update(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $db = Database::getInstance();
            
            $fields = [];
            $params = [];
            
            foreach (['title', 'short_description', 'full_description', 'icon', 'features', 'technologies', 'pricing', 'timeline', 'process_steps', 'popular', 'active'] as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                $response->getBody()->write(json_encode([
                    'error' => 'No fields to update'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $params[] = $id;
            $sql = "UPDATE services SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            $response->getBody()->write(json_encode([
                'message' => 'Service updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update service: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Service deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete service: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}