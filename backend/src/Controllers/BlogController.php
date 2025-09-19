<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class BlogController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            
            $limit = $queryParams['limit'] ?? 10;
            $offset = $queryParams['offset'] ?? 0;
            $category = $queryParams['category'] ?? null;
            
            $sql = "SELECT * FROM blog_posts WHERE published = 1";
            $params = [];
            
            if ($category) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $posts = $stmt->fetchAll();
            
            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM blog_posts WHERE published = 1";
            $countParams = [];
            if ($category) {
                $countSql .= " AND category = ?";
                $countParams[] = $category;
            }
            
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($countParams);
            $total = $countStmt->fetch()['total'];
            
            $response->getBody()->write(json_encode([
                'posts' => $posts,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch blog posts',
                'debug' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getBySlug(Request $request, Response $response, $args)
    {
        $slug = $args['slug'];
        
        try {
            $db = Database::getInstance();
            
            // Get the post
            $stmt = $db->prepare("SELECT * FROM blog_posts WHERE slug = ? AND published = 1");
            $stmt->execute([$slug]);
            $post = $stmt->fetch();
            
            if (!$post) {
                $response->getBody()->write(json_encode([
                    'error' => 'Post not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Increment views
            $updateStmt = $db->prepare("UPDATE blog_posts SET views = views + 1 WHERE id = ?");
            $updateStmt->execute([$post['id']]);
            
            $response->getBody()->write(json_encode($post));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch blog post'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM blog_posts WHERE published = 1 AND featured = 1 ORDER BY created_at DESC LIMIT 3");
            $stmt->execute();
            $posts = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($posts));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch featured posts'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['title', 'content', 'author'];
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
            
            // Generate slug from title
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title'])));
            
            $stmt = $db->prepare("
                INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, author, category, tags, published, featured) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['title'],
                $slug,
                $data['content'],
                $data['excerpt'] ?? null,
                $data['featured_image'] ?? null,
                $data['author'],
                $data['category'] ?? null,
                json_encode($data['tags'] ?? []),
                $data['published'] ?? 1,
                $data['featured'] ?? 0
            ]);
            
            $postId = $db->lastInsertId();
            
            $response->getBody()->write(json_encode([
                'message' => 'Blog post created successfully',
                'id' => $postId
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create blog post'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getCategories(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT DISTINCT category FROM blog_posts WHERE published = 1 AND category IS NOT NULL");
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