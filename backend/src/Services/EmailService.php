<?php

namespace App\Services;

use Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

class EmailService
{
    private array $config;
    private string $lastError = '';

    public function __construct(array $emailConfig = [])
    {
        $this->config = $emailConfig;
    }

    /**
     * Get the last error message
     */
    public function getLastError(): string
    {
        return $this->lastError;
    }

    /**
     * Send email using SMTP configuration
     */
    public function sendEmail(string $to, string $subject, string $body, bool $isHtml = true, string $toName = ''): bool
    {
        try {
            $mail = new PHPMailer(true);

            // Validate required configuration
            $requiredKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_encryption'];
            foreach ($requiredKeys as $key) {
                if (empty($this->config[$key])) {
                    throw new Exception("Email configuration error: Missing '{$key}' setting");
                }
            }

            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->config['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->config['smtp_user'];
            $mail->Password = $this->config['smtp_password'];
            $mail->SMTPSecure = $this->config['smtp_encryption'];
            $mail->Port = (int)$this->config['smtp_port'];

            // Recipients
            $mail->setFrom(
                $this->config['from_email'] ?? $this->config['smtp_user'],
                $this->config['from_name'] ?? 'Newsletter'
            );
            $mail->addAddress($to, $toName);

            // Content
            $mail->isHTML($isHtml);
            $mail->Subject = $subject;
            $mail->Body = $body;

            if (!$isHtml) {
                $mail->AltBody = $body;
            }

            $mail->send();
            return true;

        } catch (Exception $e) {
            $errorMessage = "Email sending failed: " . $e->getMessage();
            error_log($errorMessage);

            // Store the last error for retrieval
            $this->lastError = $errorMessage;
            return false;
        }
    }

    /**
     * Send newsletter to multiple recipients
     */
    public function sendNewsletter(array $recipients, string $subject, string $body): array
    {
        $results = [
            'sent' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($recipients as $recipient) {
            $email = is_array($recipient) ? $recipient['email'] : $recipient;
            $name = is_array($recipient) ? ($recipient['name'] ?? '') : '';

            if ($this->sendEmail($email, $subject, $body, true, $name)) {
                $results['sent']++;
            } else {
                $results['failed']++;
                $errorDetail = $this->getLastError();
                $results['errors'][] = [
                    'email' => $email,
                    'error' => $errorDetail ?: "Failed to send to: $email"
                ];
            }
        }

        return $results;
    }

    /**
     * Send user creation notification email
     */
    public function sendUserCreationEmail(
        string $email,
        string $name,
        string $username,
        string $password,
        string $roleName,
        string $roleDisplayName,
        array $permissions = []
    ): bool {
        $subject = "Welcome to Sabiteck - Your Account Details";

        // Group permissions by category
        $permissionsByCategory = [];
        foreach ($permissions as $perm) {
            $category = $perm['category'] ?? 'general';
            if (!isset($permissionsByCategory[$category])) {
                $permissionsByCategory[$category] = [];
            }
            $permissionsByCategory[$category][] = $perm['display_name'] ?? $perm['name'];
        }

        // Build permissions HTML
        $permissionsHtml = '';
        foreach ($permissionsByCategory as $category => $perms) {
            $permissionsHtml .= '<li><strong>' . ucfirst($category) . ':</strong> ' . implode(', ', $perms) . '</li>';
        }

        $body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
        .credentials p { margin: 10px 0; }
        .credentials strong { color: #667eea; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .permissions { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .permissions ul { list-style: none; padding: 0; }
        .permissions li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to Sabiteck!</h1>
            <p>Your account has been created</p>
        </div>
        <div class='content'>
            <p>Hello <strong>{$name}</strong>,</p>

            <p>Your account has been created on the Sabiteck admin platform. You have been assigned the role of <strong>{$roleDisplayName}</strong>.</p>

            <div class='credentials'>
                <h3>Your Login Credentials</h3>
                <p><strong>Username:</strong> {$username}</p>
                <p><strong>Email:</strong> {$email}</p>
                <p><strong>Temporary Password:</strong> {$password}</p>
                <p><strong>Role:</strong> {$roleDisplayName}</p>
            </div>

            <div class='warning'>
                <strong>⚠️ Important Security Notice:</strong>
                <p>For security reasons, you will be required to change your password upon your first login. Please keep your credentials secure and do not share them with anyone.</p>
            </div>

            <div class='permissions'>
                <h3>Your Permissions & Access</h3>
                <p>As a <strong>{$roleDisplayName}</strong>, you have access to the following features:</p>
                <ul>
                    {$permissionsHtml}
                </ul>
            </div>

            <p style='text-align: center;'>
                <a href='" . ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/admin' class='button'>Login to Admin Panel</a>
            </p>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <p>Best regards,<br>
            <strong>Sabiteck Team</strong></p>
        </div>
        <div class='footer'>
            <p>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        ";

        return $this->sendEmail($email, $subject, $body, true, $name);
    }

    /**
     * Test SMTP connection
     */
    public function testConnection(): array
    {
        try {
            // Validate required configuration
            $requiredKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_encryption'];
            foreach ($requiredKeys as $key) {
                if (empty($this->config[$key])) {
                    return [
                        'success' => false,
                        'message' => "Email configuration error: Missing '{$key}' setting"
                    ];
                }
            }

            $mail = new PHPMailer(true);

            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->config['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->config['smtp_user'];
            $mail->Password = $this->config['smtp_password'];
            $mail->SMTPSecure = $this->config['smtp_encryption'];
            $mail->Port = (int)$this->config['smtp_port'];

            // Try to connect
            $mail->smtpConnect();
            $mail->smtpClose();

            return [
                'success' => true,
                'message' => 'SMTP connection successful using database configuration',
                'config' => [
                    'smtp_host' => $this->config['smtp_host'],
                    'smtp_port' => $this->config['smtp_port'],
                    'smtp_user' => $this->config['smtp_user'],
                    'smtp_encryption' => $this->config['smtp_encryption']
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'SMTP connection failed: ' . $e->getMessage()
            ];
        }
    }
}