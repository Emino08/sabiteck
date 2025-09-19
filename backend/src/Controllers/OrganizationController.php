<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class OrganizationController
{
    // Get all organizations (public)
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            
            // Ensure organizations table exists
            $this->ensureTableExists($db);

            $page = $request->getQueryParams()['page'] ?? 1;
            $limit = $request->getQueryParams()['limit'] ?? 10;
            $offset = ($page - 1) * $limit;
            
            // Get organizations
            $stmt = $db->prepare("
                SELECT 
                    o.*
                FROM organizations o
                WHERE o.active = 1
                ORDER BY o.name ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            $organizations = $stmt->fetchAll();
            
            // Get total count
            $countStmt = $db->query("SELECT COUNT(*) as count FROM organizations WHERE active = 1");
            $totalCount = $countStmt->fetch()['count'];
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'data' => $organizations,
                    'pagination' => [
                        'page' => (int)$page,
                        'limit' => (int)$limit,
                        'total' => (int)$totalCount,
                        'pages' => ceil($totalCount / $limit)
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch organizations',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Get all organizations (admin)
    public function getAllAdmin(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            
            // Ensure organizations table exists
            $this->ensureTableExists($db);

            $queryParams = $request->getQueryParams();
            $page = $queryParams['page'] ?? 1;
            $limit = $queryParams['limit'] ?? 10;
            $search = $queryParams['search'] ?? '';
            $offset = ($page - 1) * $limit;

            // Build search condition
            $searchCondition = '';
            $params = [];
            if (!empty($search)) {
                $searchCondition = "WHERE o.name LIKE ? OR o.type LIKE ? OR o.location LIKE ?";
                $searchTerm = "%{$search}%";
                $params = [$searchTerm, $searchTerm, $searchTerm];
            }
            
            // Get organizations
            $sql = "
                SELECT
                    o.*
                FROM organizations o
                {$searchCondition}
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            ";

            $stmt = $db->prepare($sql);
            $stmt->execute(array_merge($params, [$limit, $offset]));
            $organizations = $stmt->fetchAll();
            
            // Get total count
            $countSql = "SELECT COUNT(*) as count FROM organizations o {$searchCondition}";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch()['count'];
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'organizations' => $organizations,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$totalCount,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch organizations',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();

            $this->ensureTableExists($db);

            $stmt = $db->prepare("SELECT * FROM organizations WHERE id = ? AND active = 1");
            $stmt->execute([$id]);
            $organization = $stmt->fetch();

            if (!$organization) {
                $response->getBody()->write(json_encode([
                    'error' => 'Organization not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $organization
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch organization'
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
                    'error' => 'Name is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                INSERT INTO organizations (name, type, description, location, website, email, phone, founded, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['type'] ?? null,
                $data['description'] ?? null,
                $data['location'] ?? null,
                $data['website'] ?? null,
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['founded'] ?? null,
                $data['active'] ?? 1
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Organization created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create organization'
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
                UPDATE organizations
                SET name = ?, type = ?, description = ?, location = ?, website = ?, email = ?, phone = ?, founded = ?, active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['name'],
                $data['type'],
                $data['description'],
                $data['location'],
                $data['website'],
                $data['email'],
                $data['phone'],
                $data['founded'],
                $data['active'] ?? 1,
                $id
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Organization updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update organization'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();
            
            $stmt = $db->prepare("UPDATE organizations SET active = 0 WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Organization deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete organization'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureTableExists($db)
    {
        $sql = "CREATE TABLE IF NOT EXISTS organizations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE,
            description TEXT,
            category VARCHAR(100),
            website VARCHAR(255),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(50),
            address TEXT,
            location VARCHAR(255),
            type VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(50),
            founded YEAR,
            size VARCHAR(50),
            industry VARCHAR(100),
            featured TINYINT DEFAULT 0,
            active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            -- Add indexes for better performance
            INDEX idx_active (active),
            INDEX idx_name (name),
            INDEX idx_category (category),
            INDEX idx_type (type)
        )";

        try {
            $db->exec($sql);

            // Check if slug column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'slug'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN slug VARCHAR(255) UNIQUE AFTER name");
            }

            // Check if type column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'type'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN type VARCHAR(100) AFTER location");
            }

            // Check if email column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'email'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN email VARCHAR(255) AFTER type");
            }

            // Check if phone column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'phone'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN phone VARCHAR(50) AFTER email");
            }

            // Check if founded column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'founded'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN founded YEAR AFTER phone");
            }

            // Check if size column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'size'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN size VARCHAR(50) AFTER founded");
            }

            // Check if industry column exists, if not add it
            $result = $db->query("SHOW COLUMNS FROM organizations LIKE 'industry'");
            if ($result->rowCount() == 0) {
                $db->exec("ALTER TABLE organizations ADD COLUMN industry VARCHAR(100) AFTER size");
            }

        } catch (\Exception $e) {
            // Log error but don't throw to avoid breaking the app
            error_log('Organizations table creation/update error: ' . $e->getMessage());
        }
    }

    private function generateSlug($name)
    {
        // Convert to lowercase and replace spaces/special chars with hyphens
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug;
    }
}
?>
