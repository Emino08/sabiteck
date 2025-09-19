<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class PermissionController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->query("
                SELECT id, name, display_name, description, category, created_at
                FROM permissions
                ORDER BY category ASC, name ASC
            ");
            $permissions = $stmt->fetchAll();

            $response->getBody()->write(json_encode([
                'success' => true,
                'permissions' => $permissions
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch permissions',
                'details' => $e->getMessage(),
                'permissions' => [] // Always return empty array as fallback
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['name'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Permission name is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                INSERT INTO permissions (name, display_name, description, category)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['display_name'] ?? null,
                $data['description'] ?? null,
                $data['category'] ?? 'general'
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Permission created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create permission'
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
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                UPDATE permissions
                SET name = ?, display_name = ?, description = ?, category = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['name'],
                $data['display_name'],
                $data['description'],
                $data['category'] ?? 'general',
                $id
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Permission updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update permission'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();

            $stmt = $db->prepare("DELETE FROM permissions WHERE id = ?");
            $stmt->execute([$id]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Permission deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete permission'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureTableExists($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'permissions'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE permissions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    display_name VARCHAR(255),
                    description TEXT,
                    category VARCHAR(50) DEFAULT 'general',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_category (category),
                    INDEX idx_name (name)
                )
            ");

            // Insert sample permissions
            $permissions = [
                ['admin.access', 'Admin Access', 'Access to admin panel', 'admin'],
                ['users.view', 'View Users', 'View user list', 'users'],
                ['users.create', 'Create Users', 'Create new users', 'users'],
                ['users.edit', 'Edit Users', 'Edit user details', 'users'],
                ['users.delete', 'Delete Users', 'Delete users', 'users'],
                ['content.view', 'View Content', 'View content list', 'content'],
                ['content.create', 'Create Content', 'Create new content', 'content'],
                ['content.edit', 'Edit Content', 'Edit content', 'content'],
                ['content.delete', 'Delete Content', 'Delete content', 'content'],
                ['newsletter.view', 'View Newsletter', 'View newsletter data', 'newsletter'],
                ['newsletter.send', 'Send Newsletter', 'Send newsletters', 'newsletter'],
                ['scholarships.view', 'View Scholarships', 'View scholarship list', 'scholarships'],
                ['scholarships.create', 'Create Scholarships', 'Create new scholarships', 'scholarships'],
                ['scholarships.edit', 'Edit Scholarships', 'Edit scholarships', 'scholarships'],
                ['scholarships.delete', 'Delete Scholarships', 'Delete scholarships', 'scholarships'],
                ['organizations.view', 'View Organizations', 'View organization list', 'organizations'],
                ['organizations.create', 'Create Organizations', 'Create new organizations', 'organizations'],
                ['organizations.edit', 'Edit Organizations', 'Edit organizations', 'organizations'],
                ['organizations.delete', 'Delete Organizations', 'Delete organizations', 'organizations']
            ];

            $stmt = $db->prepare("INSERT INTO permissions (name, display_name, description, category) VALUES (?, ?, ?, ?)");
            foreach ($permissions as $permission) {
                $stmt->execute($permission);
            }
        }
    }
}
