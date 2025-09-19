<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class SocialController
{
    public function getScheduled(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT sp.*, au.username as created_by_name 
                FROM social_posts sp 
                LEFT JOIN admin_users au ON sp.created_by = au.id 
                WHERE sp.status = 'scheduled' 
                ORDER BY sp.scheduled_at ASC
            ");
            $stmt->execute();
            $posts = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($posts));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch scheduled posts'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['platform', 'content', 'scheduled_at'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                INSERT INTO social_posts (platform, content, media_urls, scheduled_at, created_by) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['platform'],
                $data['content'],
                json_encode($data['media_urls'] ?? []),
                $data['scheduled_at'],
                $data['created_by'] ?? 1
            ]);
            
            $postId = $db->lastInsertId();
            
            $response->getBody()->write(json_encode([
                'message' => 'Social post scheduled successfully',
                'id' => $postId
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to schedule social post'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function updateStatus(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['status'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Status is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            $fields = ['status = ?'];
            $values = [$data['status']];
            
            if ($data['status'] === 'posted') {
                $fields[] = 'posted_at = datetime(\'now\')';
                if (!empty($data['post_url'])) {
                    $fields[] = 'post_url = ?';
                    $values[] = $data['post_url'];
                }
                if (!empty($data['engagement_stats'])) {
                    $fields[] = 'engagement_stats = ?';
                    $values[] = json_encode($data['engagement_stats']);
                }
            }
            
            $values[] = $id;
            
            $stmt = $db->prepare("UPDATE social_posts SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);
            
            $response->getBody()->write(json_encode([
                'message' => 'Social post status updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update social post status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            
            $platform = $queryParams['platform'] ?? null;
            $status = $queryParams['status'] ?? null;
            $limit = $queryParams['limit'] ?? 20;
            $offset = $queryParams['offset'] ?? 0;
            
            $sql = "
                SELECT sp.*, au.username as created_by_name 
                FROM social_posts sp 
                LEFT JOIN admin_users au ON sp.created_by = au.id 
                WHERE 1=1
            ";
            $params = [];
            
            if ($platform) {
                $sql .= " AND sp.platform = ?";
                $params[] = $platform;
            }
            
            if ($status) {
                $sql .= " AND sp.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY sp.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $posts = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($posts));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch social posts'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM social_posts WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Social post deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete social post'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}