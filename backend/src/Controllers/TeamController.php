<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class TeamController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            $department = $queryParams['department'] ?? null;
            
            $sql = "SELECT * FROM team_members WHERE active = 1";
            $params = [];
            
            if ($department) {
                $sql .= " AND department = ?";
                $params[] = $department;
            }
            
            $sql .= " ORDER BY sort_order ASC, featured DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $members = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'data' => $members,
                    'pagination' => [
                        'page' => 1,
                        'limit' => count($members),
                        'total' => count($members),
                        'pages' => 1
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch team members'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM team_members WHERE active = 1 AND featured = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $members = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($members));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch featured team members'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getDepartments(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT DISTINCT department FROM team_members WHERE active = 1 AND department IS NOT NULL");
            $departments = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            
            $response->getBody()->write(json_encode($departments));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch departments'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (empty($data['name']) || empty($data['position'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Name and position are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            $slug = strtolower(str_replace(' ', '-', $data['name']));
            
            $stmt = $db->prepare("INSERT INTO team_members (name, slug, position, department, bio, avatar, email, linkedin_url, github_url, twitter_url, skills, experience_years, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['name'],
                $slug,
                $data['position'],
                $data['department'] ?? null,
                $data['bio'] ?? null,
                $data['avatar'] ?? null,
                $data['email'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['github_url'] ?? null,
                $data['twitter_url'] ?? null,
                $data['skills'] ?? null,
                $data['experience_years'] ?? 0,
                $data['featured'] ?? 0,
                $data['active'] ?? 1
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create team member: ' . $e->getMessage()
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
            
            foreach (['name', 'position', 'department', 'bio', 'avatar', 'email', 'linkedin_url', 'github_url', 'twitter_url', 'skills', 'experience_years', 'featured', 'active'] as $field) {
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
            $sql = "UPDATE team_members SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update team member: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM team_members WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete team member: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}