<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ContactController
{
    public function submit(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        // Validate required fields
        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        // Validate email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();

            // Ensure contacts table exists
            $this->ensureContactsTableExists($db);

            $stmt = $db->prepare("
                INSERT INTO contacts (name, email, company, message, created_at)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['company'] ?? '',
                $data['message'],
                date('Y-m-d H:i:s')
            ]);
            
            // Send notification email (in production, use a proper email service)
            // Disabled for development - no mail server configured
            // $to = $_ENV['ADMIN_EMAIL'] ?? 'admin@devco.com';
            // $subject = 'New Contact Form Submission';
            // $message = "Name: {$data['name']}\nEmail: {$data['email']}\nCompany: " . ($data['company'] ?? 'N/A') . "\nMessage: {$data['message']}";
            // mail($to, $subject, $message);
            
            $response->getBody()->write(json_encode([
                'message' => 'Contact form submitted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to submit contact form'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureContactsTableExists($db);

            $stmt = $db->query("
                SELECT id, name, email, company, message, is_read, is_important, response, responded_at, created_at
                FROM contacts
                ORDER BY created_at DESC
            ");
            $contacts = $stmt->fetchAll();

            // Count unread contacts
            $stmt = $db->query("SELECT COUNT(*) as count FROM contacts WHERE is_read = 0");
            $unreadCount = $stmt->fetch()['count'];
            
            $response->getBody()->write(json_encode([
                'contacts' => $contacts,
                'unread_count' => $unreadCount
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch contacts'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM contacts WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                $response->getBody()->write(json_encode([
                    'error' => 'Contact not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode([
                'message' => 'Contact deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete contact'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function markAsRead(Request $request, Response $response, $args)
    {
        $contactId = $args['id'];

        try {
            $db = Database::getInstance();
            $this->ensureContactsTableExists($db);

            $stmt = $db->prepare("UPDATE contacts SET is_read = 1 WHERE id = ?");
            $stmt->execute([$contactId]);

            $response->getBody()->write(json_encode([
                'message' => 'Contact marked as read'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to mark contact as read'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function toggleImportant(Request $request, Response $response, $args)
    {
        $contactId = $args['id'];

        try {
            $db = Database::getInstance();
            $this->ensureContactsTableExists($db);

            // Get current status
            $stmt = $db->prepare("SELECT is_important FROM contacts WHERE id = ?");
            $stmt->execute([$contactId]);
            $current = $stmt->fetch();

            if (!$current) {
                $response->getBody()->write(json_encode(['error' => 'Contact not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Toggle status
            $newStatus = $current['is_important'] ? 0 : 1;
            $stmt = $db->prepare("UPDATE contacts SET is_important = ? WHERE id = ?");
            $stmt->execute([$newStatus, $contactId]);

            $response->getBody()->write(json_encode([
                'message' => 'Contact importance toggled',
                'is_important' => (bool)$newStatus
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to toggle important status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function respond(Request $request, Response $response, $args)
    {
        $contactId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);

        if (empty($data['response'])) {
            $response->getBody()->write(json_encode(['error' => 'Response message is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $db = Database::getInstance();
            $this->ensureContactsTableExists($db);

            $stmt = $db->prepare("UPDATE contacts SET response = ?, responded_at = ?, is_read = 1 WHERE id = ?");
            $stmt->execute([$data['response'], date('Y-m-d H:i:s'), $contactId]);

            $response->getBody()->write(json_encode([
                'message' => 'Response saved successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to save response'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function adminLogin(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (empty($data['username']) || empty($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Username and password are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            
            $stmt = $db->prepare("SELECT id, username, password_hash, email FROM admin_users WHERE username = ? AND active = 1");
            $stmt->execute([$data['username']]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => 'admin',
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60)
            ];
            
            $token = \Firebase\JWT\JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'email' => $user['email'],
                        'role' => 'admin'
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureContactsTableExists($db)
    {
        try {
            // Create contacts table if it doesn't exist
            $db->exec("
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    company VARCHAR(255),
                    message TEXT NOT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    is_important TINYINT(1) DEFAULT 0,
                    response TEXT,
                    responded_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
        } catch (\Exception $e) {
            // Log but don't fail - table might already exist
            error_log("Contacts table creation warning: " . $e->getMessage());
        }
    }
}
