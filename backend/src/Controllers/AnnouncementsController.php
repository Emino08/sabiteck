<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class AnnouncementsController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            $type = $queryParams['type'] ?? null;
            $active = $queryParams['active'] ?? null;
            
            $sql = "SELECT * FROM announcements WHERE 1=1";
            $params = [];
            
            if ($type) {
                $sql .= " AND type = ?";
                $params[] = $type;
            }
            
            if ($active !== null) {
                $sql .= " AND active = ?";
                $params[] = $active;
            }
            
            $sql .= " ORDER BY priority DESC, created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $announcements = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'announcements' => $announcements,
                    'pagination' => [
                        'page' => 1,
                        'limit' => count($announcements),
                        'total' => count($announcements),
                        'pages' => 1
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch announcements: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getActive(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM announcements WHERE active = 1 ORDER BY priority DESC, created_at DESC");
            $stmt->execute();
            $announcements = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($announcements));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch active announcements'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (empty($data['title']) || empty($data['content'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Title and content are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            
            $stmt = $db->prepare("INSERT INTO announcements (title, content, type, priority, active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['title'],
                $data['content'],
                $data['type'] ?? 'general',
                $data['priority'] ?? 'medium',
                $data['active'] ?? 1
            ]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Announcement created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create announcement: ' . $e->getMessage()
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
            
            foreach (['title', 'content', 'type', 'priority', 'active'] as $field) {
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
            $sql = "UPDATE announcements SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Announcement updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update announcement: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM announcements WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Announcement deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete announcement: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}