<?php

namespace App\Controllers;

use PDO;
use Exception;

abstract class BaseController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Get error message from database
     */
    protected function getErrorMessage(string $code): string
    {
        try {
            $stmt = $this->db->prepare("SELECT message_text FROM static_messages WHERE message_code = ? AND message_type = 'error' LIMIT 1");
            $stmt->execute([$code]);
            $result = $stmt->fetch();
            return $result ? $result['message_text'] : 'An error occurred';
        } catch (Exception $e) {
            return 'An error occurred';
        }
    }

    /**
     * Get success message from database
     */
    protected function getSuccessMessage(string $code): string
    {
        try {
            $stmt = $this->db->prepare("SELECT message_text FROM static_messages WHERE message_code = ? AND message_type = 'success' LIMIT 1");
            $stmt->execute([$code]);
            $result = $stmt->fetch();
            return $result ? $result['message_text'] : 'Operation successful';
        } catch (Exception $e) {
            return 'Operation successful';
        }
    }

    /**
     * Get API configuration value
     */
    protected function getConfig(string $key, $default = null)
    {
        try {
            $stmt = $this->db->prepare("SELECT config_value, config_type FROM api_configurations WHERE config_key = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$key]);
            $result = $stmt->fetch();

            if (!$result) {
                return $default;
            }

            $value = $result['config_value'];
            $type = $result['config_type'];

            switch ($type) {
                case 'integer':
                    return (int) $value;
                case 'boolean':
                    return (bool) $value;
                case 'json':
                    return json_decode($value, true);
                default:
                    return $value;
            }
        } catch (Exception $e) {
            return $default;
        }
    }

    /**
     * Get default field value
     */
    protected function getDefaultValue(string $entityType, string $fieldName, $fallback = null)
    {
        try {
            $stmt = $this->db->prepare("SELECT default_value, value_type FROM default_field_values WHERE entity_type = ? AND field_name = ? LIMIT 1");
            $stmt->execute([$entityType, $fieldName]);
            $result = $stmt->fetch();

            if (!$result) {
                return $fallback;
            }

            $value = $result['default_value'];
            $type = $result['value_type'];

            switch ($type) {
                case 'integer':
                    return (int) $value;
                case 'boolean':
                    return (bool) $value;
                case 'date':
                    return $value;
                case 'json':
                    return json_decode($value, true);
                default:
                    return $value;
            }
        } catch (Exception $e) {
            return $fallback;
        }
    }

    /**
     * Send JSON response
     */
    protected function jsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    /**
     * Send error response
     */
    protected function errorResponse(string $errorCode, int $statusCode = 500): void
    {
        $message = $this->getErrorMessage($errorCode);
        $this->jsonResponse([
            'success' => false,
            'error' => $message,
            'error_code' => $errorCode
        ], $statusCode);
    }

    /**
     * Send success response
     */
    protected function successResponse(string $successCode, array $data = [], int $statusCode = 200): void
    {
        $message = $this->getSuccessMessage($successCode);
        $response = [
            'success' => true,
            'message' => $message
        ];

        if (!empty($data)) {
            $response = array_merge($response, $data);
        }

        $this->jsonResponse($response, $statusCode);
    }

    /**
     * Send data response
     */
    protected function dataResponse(array $data, int $total = null): void
    {
        $response = [
            'success' => true,
            'data' => $data
        ];

        if ($total !== null) {
            $response['total'] = $total;
        }

        $this->jsonResponse($response);
    }

    /**
     * Validate required fields
     */
    protected function validateRequired(array $data, array $required): bool
    {
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Sanitize input data
     */
    protected function sanitizeInput(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = trim($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }

    /**
     * Handle database exceptions
     */
    protected function handleDatabaseException(Exception $e, string $operation): void
    {
        error_log("Database error in {$operation}: " . $e->getMessage());
        $this->errorResponse('DB_CONNECTION_FAILED', 500);
    }
}