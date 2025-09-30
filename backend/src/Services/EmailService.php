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