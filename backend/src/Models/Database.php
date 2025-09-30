<?php
namespace DevCo\Models;

use PDO;
use PDOException;

class Database
{
    private static $instance = null;
    private $connection;
    
    private function __construct()
    {
        try {
            // MySQL configuration
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $port = $_ENV['DB_PORT'] ?? '4306';
            $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
            $username = $_ENV['DB_USER'] ?? 'root';
            $password = $_ENV['DB_PASS'] ?? '1212';
            
            $this->connection = new PDO(
                "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            $errorDetails = [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'connection_string' => "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                'host' => $host,
                'port' => $port,
                'database' => $dbname,
                'username' => $username,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            error_log("Database connection failed: " . json_encode($errorDetails));

            $exception = new \Exception("Database connection failed");
            $exception->errorDetails = $errorDetails;
            throw $exception;
        }
    }
    
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->connection;
    }
}
