<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class PortfolioController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            
            $category = $queryParams['category'] ?? null;
            
            $sql = "SELECT * FROM portfolio_projects WHERE completed = 1";
            $params = [];
            
            if ($category && $category !== 'all') {
                $sql .= " AND category = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY featured DESC, created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $projects = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($projects));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch portfolio projects'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM portfolio_projects WHERE completed = 1 AND featured = 1 ORDER BY created_at DESC LIMIT 6");
            $stmt->execute();
            $projects = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($projects));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch featured projects'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getBySlug(Request $request, Response $response, $args)
    {
        $slug = $args['slug'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM portfolio_projects WHERE slug = ? AND completed = 1");
            $stmt->execute([$slug]);
            $project = $stmt->fetch();
            
            if (!$project) {
                $response->getBody()->write(json_encode([
                    'error' => 'Project not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode($project));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch project'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getCategories(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT DISTINCT category FROM portfolio_projects WHERE completed = 1");
            $categories = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            
            $response->getBody()->write(json_encode($categories));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch categories'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}