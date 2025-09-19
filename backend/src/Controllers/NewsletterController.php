<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class NewsletterController
{
    public function subscribe(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['email'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Email is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $subscriptionType = $data['subscription_type'] ?? 'newsletter';
        
        try {
            $db = Database::getInstance();

            // Ensure newsletter table exists with all required columns
            $this->ensureNewsletterTableExists($db);

            // Ensure subscription_type column exists (migration)
            try {
                $stmt = $db->query("SHOW COLUMNS FROM newsletter_subscribers LIKE 'subscription_type'");
                if ($stmt->rowCount() == 0) {
                    $db->exec("ALTER TABLE newsletter_subscribers ADD COLUMN subscription_type VARCHAR(50) DEFAULT 'newsletter'");
                }
            } catch (\Exception $migrationError) {
                error_log("Newsletter table migration warning: " . $migrationError->getMessage());
            }

            // Check if email already exists with this subscription type
            $stmt = $db->prepare("SELECT id FROM newsletter_subscribers WHERE email = ? AND subscription_type = ?");
            $stmt->execute([$data['email'], $subscriptionType]);
            
            if ($stmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'message' => 'Email already subscribed to ' . $subscriptionType
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            }
            
            // Add new subscriber
            $stmt = $db->prepare("
                INSERT INTO newsletter_subscribers (email, subscription_type, active)
                VALUES (?, ?, 1)
            ");
            
            $stmt->execute([$data['email'], $subscriptionType]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Successfully subscribed to ' . $subscriptionType
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Newsletter subscription error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to subscribe to newsletter',
                'debug' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function send(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['subject', 'content'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        $subscriptionType = $data['subscription_type'] ?? 'newsletter';
        
        try {
            $db = Database::getInstance();

            // Ensure newsletter table exists
            $this->ensureNewsletterTableExists($db);

            // Get active subscribers for the specified type
            $stmt = $db->prepare("SELECT email FROM newsletter_subscribers WHERE active = 1 AND subscription_type = ?");
            $stmt->execute([$subscriptionType]);
            $subscribers = $stmt->fetchAll();
            
            $sent = 0;
            foreach ($subscribers as $subscriber) {
                if ($this->sendEmail($subscriber['email'], $data['subject'], $data['content'])) {
                    $sent++;
                }
            }
            
            $response->getBody()->write(json_encode([
                'message' => "Newsletter sent to {$sent} subscribers"
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to send newsletter'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getSubscribers(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("
                SELECT id, email, name, status, verified, subscribed_at
                FROM newsletter_subscribers 
                ORDER BY subscribed_at DESC
            ");
            $subscribers = $stmt->fetchAll();
            
            // Convert status to active field for compatibility
            $formattedSubscribers = [];
            foreach ($subscribers as $subscriber) {
                $formattedSubscribers[] = [
                    'id' => $subscriber['id'],
                    'email' => $subscriber['email'],
                    'name' => $subscriber['name'],
                    'subscription_type' => 'newsletter', // Default type
                    'subscribed_at' => $subscriber['subscribed_at'],
                    'active' => $subscriber['status'] === 'subscribed'
                ];
            }
            
            $response->getBody()->write(json_encode([
                'subscribers' => $formattedSubscribers,
                'total' => count($formattedSubscribers)
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            // Log the actual error for debugging
            error_log("Newsletter getSubscribers error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch subscribers: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function sendEmail($to, $subject, $content) {
        try {
            // SMTP configuration
            $smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.titan.email';
            $smtpPort = $_ENV['SMTP_PORT'] ?? 465;
            $smtpUser = $_ENV['SMTP_USER'] ?? 'newsletter@sabiteck.com';
            $smtpPass = $_ENV['SMTP_PASS'] ?? '32770.Emo';
            
            // Create email headers
            $headers = [
                'MIME-Version' => '1.0',
                'Content-type' => 'text/html; charset=utf-8',
                'From' => $smtpUser,
                'Reply-To' => $smtpUser,
                'X-Mailer' => 'PHP/' . phpversion()
            ];
            
            $headerString = '';
            foreach ($headers as $key => $value) {
                $headerString .= "$key: $value\r\n";
            }
            
            // For now, use PHP's built-in mail function
            // In production, use PHPMailer or similar library
            return mail($to, $subject, $content, $headerString);
            
        } catch (\Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    public function getTemplates(Request $request, Response $response, $args)
    {
        try {
            // For now, return empty templates array since table doesn't exist
            $response->getBody()->write(json_encode([
                'templates' => []
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch templates'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getCampaigns(Request $request, Response $response, $args)
    {
        try {
            // For now, return empty campaigns array since table doesn't exist
            $response->getBody()->write(json_encode([
                'campaigns' => []
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch campaigns'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function createCampaign(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['name']) || empty($data['subject']) || empty($data['content'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Name, subject, and content are required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                INSERT INTO newsletter_campaigns (name, subject, content, template_id, status, created_by) 
                VALUES (?, ?, ?, ?, 'draft', 1)
            ");
            $stmt->execute([
                $data['name'],
                $data['subject'], 
                $data['content'],
                $data['template_id'] ?? null
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Campaign created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create campaign'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function exportSubscribers(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("
                SELECT email, subscription_type, subscribed_at, active 
                FROM newsletter_subscribers 
                ORDER BY subscribed_at DESC
            ");
            $subscribers = $stmt->fetchAll();
            
            // Create CSV content
            $csv = "Email,Subscription Type,Subscribed At,Status\n";
            foreach ($subscribers as $subscriber) {
                $csv .= sprintf(
                    "%s,%s,%s,%s\n",
                    $subscriber['email'],
                    $subscriber['subscription_type'] ?: 'newsletter',
                    $subscriber['subscribed_at'],
                    $subscriber['active'] ? 'Active' : 'Unsubscribed'
                );
            }
            
            $response->getBody()->write($csv);
            return $response
                ->withHeader('Content-Type', 'text/csv')
                ->withHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
                
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to export subscribers'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function importSubscribers(Request $request, Response $response, $args)
    {
        $uploadedFiles = $request->getUploadedFiles();
        
        if (empty($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $uploadedFile = $uploadedFiles['file'];
        
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(['error' => 'File upload error']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $fileContent = $uploadedFile->getStream()->getContents();
            $lines = explode("\n", $fileContent);
            
            // Skip header row
            array_shift($lines);
            
            $db = Database::getInstance();
            $imported = 0;
            $errors = [];
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                
                $data = str_getcsv($line);
                
                if (count($data) < 1) continue;
                
                $email = trim($data[0]);
                $subscriptionType = isset($data[1]) ? trim($data[1]) : 'newsletter';
                
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Invalid email: $email";
                    continue;
                }
                
                // Check if email already exists
                $stmt = $db->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
                $stmt->execute([$email]);
                
                if ($stmt->fetch()) {
                    $errors[] = "Email already exists: $email";
                    continue;
                }
                
                // Insert new subscriber
                $stmt = $db->prepare("
                    INSERT INTO newsletter_subscribers (email, subscription_type, subscribed_at, active) 
                    VALUES (?, ?, NOW(), 1)
                ");
                $stmt->execute([$email, $subscriptionType]);
                $imported++;
            }
            
            $response->getBody()->write(json_encode([
                'message' => "Imported $imported subscribers",
                'imported_count' => $imported,
                'errors' => $errors
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to import subscribers: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function sendEmailToSubscriber(Request $request, Response $response, $args)
    {
        $subscriberId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['subject', 'content'];
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
            
            // Get subscriber email
            $stmt = $db->prepare("SELECT email FROM newsletter_subscribers WHERE id = ? AND active = 1");
            $stmt->execute([$subscriberId]);
            $subscriber = $stmt->fetch();
            
            if (!$subscriber) {
                $response->getBody()->write(json_encode(['error' => 'Subscriber not found or inactive']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            if ($this->sendEmail($subscriber['email'], $data['subject'], $data['content'])) {
                $response->getBody()->write(json_encode([
                    'message' => 'Email sent successfully'
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'Failed to send email']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to send email to subscriber'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function updateSubscriber(Request $request, Response $response, $args)
    {
        $subscriberId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        
        try {
            $db = Database::getInstance();
            
            $updateFields = [];
            $params = [];
            
            if (isset($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    $response->getBody()->write(json_encode(['error' => 'Invalid email address']));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
                $updateFields[] = 'email = ?';
                $params[] = $data['email'];
            }
            
            if (isset($data['subscription_type'])) {
                $updateFields[] = 'subscription_type = ?';
                $params[] = $data['subscription_type'];
            }
            
            if (isset($data['active'])) {
                $updateFields[] = 'active = ?';
                $params[] = $data['active'] ? 1 : 0;
            }
            
            if (empty($updateFields)) {
                $response->getBody()->write(json_encode(['error' => 'No fields to update']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $params[] = $subscriberId;
            
            $stmt = $db->prepare("
                UPDATE newsletter_subscribers 
                SET " . implode(', ', $updateFields) . " 
                WHERE id = ?
            ");
            $stmt->execute($params);
            
            $response->getBody()->write(json_encode([
                'message' => 'Subscriber updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update subscriber'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureNewsletterTableExists($db)
    {
        try {
            // Create newsletter_subscribers table if it doesn't exist
            $db->exec("
                CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    subscription_type VARCHAR(50) DEFAULT 'newsletter',
                    status VARCHAR(20) DEFAULT 'subscribed',
                    verified TINYINT(1) DEFAULT 1,
                    active TINYINT(1) DEFAULT 1,
                    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    unsubscribed_at TIMESTAMP NULL,
                    UNIQUE KEY unique_email_type (email, subscription_type)
                )
            ");
        } catch (\Exception $e) {
            // Log but don't fail - table might already exist
            error_log("Newsletter table creation warning: " . $e->getMessage());
        }
    }
}
