<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class UserController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $queryParams = $request->getQueryParams();
            $page = $queryParams['page'] ?? 1;
            $limit = $queryParams['limit'] ?? 15;
            $search = $queryParams['search'] ?? '';
            $offset = ($page - 1) * $limit;

            // Build search condition
            $searchCondition = '';
            $params = [];
            if (!empty($search)) {
                $searchCondition = "WHERE u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?";
                $searchTerm = "%{$search}%";
                $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            }

            $sql = "
                SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                       r.name as role_name, r.display_name as role_display_name,
                       u.status, u.email_verified, u.last_login, u.created_at
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                {$searchCondition}
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ";

            $stmt = $db->prepare($sql);
            $stmt->execute(array_merge($params, [$limit, $offset]));
            $users = $stmt->fetchAll();
            
            // Get total count for pagination
            $countSql = "SELECT COUNT(*) as count FROM users u {$searchCondition}";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch()['count'];

            $response->getBody()->write(json_encode([
                'success' => true,
                'users' => $users,
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
                'error' => 'Failed to fetch users',
                'details' => $e->getMessage(),
                'users' => [] // Always return empty array as fallback
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getById(Request $request, Response $response, $args)
    {
        $userId = $args['id'];
        
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                       r.name as role_name, r.display_name as role_display_name,
                       u.status, u.email_verified, u.last_login, u.created_at
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'error' => 'User not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'user' => $user
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch user'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Username, email, and password are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureTableExists($db);

            // Check if username or email already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$data['username'], $data['email']]);
            if ($stmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'error' => 'Username or email already exists'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $stmt = $db->prepare("
                INSERT INTO users (username, email, password_hash, first_name, last_name, status, email_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['username'],
                $data['email'],
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['first_name'] ?? null,
                $data['last_name'] ?? null,
                $data['status'] ?? 'active',
                $data['email_verified'] ?? 0
            ]);

            $userId = $db->lastInsertId();

            // Assign role via user_roles table
            if (isset($data['role_id'])) {
                $roleStmt = $db->prepare("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, NOW())");
                $roleStmt->execute([$userId, $data['role_id']]);
            } else {
                // Default to 'user' role (ID 6 typically)
                $defaultRoleStmt = $db->prepare("SELECT id FROM roles WHERE name = 'user' LIMIT 1");
                $defaultRoleStmt->execute();
                $defaultRole = $defaultRoleStmt->fetch();
                if ($defaultRole) {
                    $roleStmt = $db->prepare("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, NOW())");
                    $roleStmt->execute([$userId, $defaultRole['id']]);
                }
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create user'
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

            $updateFields = [];
            $params = [];

            if (isset($data['username'])) {
                $updateFields[] = "username = ?";
                $params[] = $data['username'];
            }
            if (isset($data['email'])) {
                $updateFields[] = "email = ?";
                $params[] = $data['email'];
            }
            if (isset($data['first_name'])) {
                $updateFields[] = "first_name = ?";
                $params[] = $data['first_name'];
            }
            if (isset($data['last_name'])) {
                $updateFields[] = "last_name = ?";
                $params[] = $data['last_name'];
            }
            // Handle role update via user_roles table
            if (isset($data['role_id'])) {
                // Delete existing role
                $deleteRoleStmt = $db->prepare("DELETE FROM user_roles WHERE user_id = ?");
                $deleteRoleStmt->execute([$id]);

                // Insert new role
                $insertRoleStmt = $db->prepare("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, NOW())");
                $insertRoleStmt->execute([$id, $data['role_id']]);
            }
            if (isset($data['status'])) {
                $updateFields[] = "status = ?";
                $params[] = $data['status'];
            }
            if (isset($data['password']) && !empty($data['password'])) {
                $updateFields[] = "password_hash = ?";
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updateFields)) {
                $response->getBody()->write(json_encode([
                    'error' => 'No fields to update'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
            $params[] = $id;

            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("User update error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update user',
                'debug' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();
            
            $stmt = $db->prepare("UPDATE users SET status = 'inactive' WHERE id = ?");
            $stmt->execute([$id]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("User deletion error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete user',
                'debug' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureTableExists($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'user',
                    status VARCHAR(20) DEFAULT 'active',
                    email_verified TINYINT(1) DEFAULT 0,
                    last_login TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");

            // Insert sample users
            $db->exec("
                INSERT INTO users (username, email, password_hash, first_name, last_name, role, status, email_verified) VALUES
                ('john_doe', 'john@example.com', '" . password_hash('password123', PASSWORD_DEFAULT) . "', 'John', 'Doe', 'user', 'active', 1),
                ('jane_smith', 'jane@example.com', '" . password_hash('password123', PASSWORD_DEFAULT) . "', 'Jane', 'Smith', 'moderator', 'active', 1),
                ('mike_admin', 'mike@example.com', '" . password_hash('password123', PASSWORD_DEFAULT) . "', 'Mike', 'Admin', 'admin', 'active', 1)
            ");
        }
    }

    public function getRoles(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Get all roles
            $stmt = $db->query("SELECT * FROM roles ORDER BY name");
            $roles = $stmt->fetchAll();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $roles
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to fetch roles',
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}