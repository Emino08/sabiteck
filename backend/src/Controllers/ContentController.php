<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ContentController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("
                SELECT id, title, slug, content_type, category, content, excerpt, author, featured_image, meta_description, tags, comment_count, like_count, published, created_at, updated_at
                FROM content
                WHERE published = 1
                ORDER BY created_at DESC
            ");
            $content = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($content));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch content',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getAllAdmin(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Check if content table exists, if not create it
            $stmt = $db->query("SHOW TABLES LIKE 'content'");
            if ($stmt->rowCount() == 0) {
                $db->exec("
                    CREATE TABLE content (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        content_type VARCHAR(50) NOT NULL DEFAULT 'page',
                        category VARCHAR(100),
                        content LONGTEXT,
                        excerpt TEXT,
                        slug VARCHAR(255) UNIQUE,
                        author VARCHAR(255),
                        featured_image VARCHAR(500),
                        meta_description TEXT,
                        tags JSON,
                        published TINYINT(1) DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");

                // Insert sample data
                $db->exec("
                    INSERT INTO content (title, content_type, content, published) VALUES
                    ('Welcome to Sabiteck', 'page', 'Welcome to our technology solutions company...', 1),
                    ('About Us', 'page', 'Learn more about our company and mission...', 1),
                    ('Our Services', 'page', 'Discover the services we offer...', 1)
                ");
            }

            // Add new columns if they don't exist (migration)
            try {
                // Check and add category column
                $stmt = $db->query("SHOW COLUMNS FROM content LIKE 'category'");
                if ($stmt->rowCount() == 0) {
                    $db->exec("ALTER TABLE content ADD COLUMN category VARCHAR(100) AFTER content_type");
                }

                // Check and add other columns
                $columnsToAdd = [
                    'author' => 'VARCHAR(255) AFTER slug',
                    'excerpt' => 'TEXT AFTER content',
                    'featured_image' => 'VARCHAR(500) AFTER author',
                    'meta_description' => 'TEXT AFTER featured_image',
                    'tags' => 'JSON AFTER meta_description',
                    'comment_count' => 'INT DEFAULT 0 AFTER tags',
                    'like_count' => 'INT DEFAULT 0 AFTER comment_count'
                ];

                foreach ($columnsToAdd as $column => $definition) {
                    $stmt = $db->query("SHOW COLUMNS FROM content LIKE '$column'");
                    if ($stmt->rowCount() == 0) {
                        $db->exec("ALTER TABLE content ADD COLUMN $column $definition");
                    }
                }
            } catch (\Exception $migrationError) {
                // Log migration error but continue
                error_log("Content table migration warning: " . $migrationError->getMessage());
            }

            $stmt = $db->query("
                SELECT id, title, slug, content_type, category, content, excerpt, author, featured_image, meta_description, tags, comment_count, like_count, published, created_at, updated_at
                FROM content
                ORDER BY created_at DESC
            ");
            $content = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'content' => $content,
                'total' => count($content)
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch content',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getBySlug(Request $request, Response $response, $args)
    {
        try {
            $slug = $args['slug'];
            $db = Database::getInstance();
            
            $stmt = $db->prepare("
                SELECT id, title, slug, content_type, category, content, excerpt, author, featured_image, meta_description, tags, comment_count, like_count, published, created_at, updated_at
                FROM content
                WHERE slug = ? AND published = 1
            ");
            $stmt->execute([$slug]);
            $content = $stmt->fetch();

            if (!$content) {
                $response->getBody()->write(json_encode([
                    'error' => 'Content not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode($content));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch content'
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

            // Generate slug from title if not provided
            $slug = $data['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $data['title']));

            $stmt = $db->prepare("
                INSERT INTO content (title, content_type, category, content, excerpt, author, featured_image, meta_description, tags, slug, published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['title'],
                $data['content_type'] ?? 'page',
                $data['category'] ?? null,
                $data['content'],
                $data['excerpt'] ?? null,
                $data['author'] ?? null,
                $data['featured_image'] ?? null,
                $data['meta_description'] ?? null,
                $data['tags'] ? json_encode($data['tags']) : null,
                $slug,
                $data['published'] ?? 1
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Content created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function update(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $data = json_decode($request->getBody()->getContents(), true);

            $db = Database::getInstance();
            
            $stmt = $db->prepare("
                UPDATE content
                SET title = ?, content_type = ?, category = ?, content = ?, excerpt = ?, author = ?, featured_image = ?, meta_description = ?, tags = ?, slug = ?, published = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");

            $stmt->execute([
                $data['title'],
                $data['content_type'] ?? 'page',
                $data['category'] ?? null,
                $data['content'],
                $data['excerpt'] ?? null,
                $data['author'] ?? null,
                $data['featured_image'] ?? null,
                $data['meta_description'] ?? null,
                $data['tags'] ? json_encode($data['tags']) : null,
                $data['slug'],
                $data['published'] ?? 1,
                $id
            ]);

            $response->getBody()->write(json_encode([
                'message' => 'Content updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();

            $stmt = $db->prepare("DELETE FROM content WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Content deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
