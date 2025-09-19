<?php

namespace App\Controllers;

use Exception;

class ApiController extends BaseController
{
    /**
     * API root endpoint
     */
    public function index(): void
    {
        try {
            $apiName = $this->getConfig('api_name', 'Sabiteck Limited API');
            $apiVersion = $this->getConfig('api_version', '1.0.0');
            $companyName = $this->getConfig('company_name', 'Sabiteck Limited');

            $this->jsonResponse([
                'success' => true,
                'message' => $apiName,
                'version' => $apiVersion,
                'company' => $companyName,
                'endpoints' => [
                    'services' => '/api/services',
                    'jobs' => '/api/jobs',
                    'scholarships' => '/api/scholarships',
                    'portfolio' => '/api/portfolio',
                    'team' => '/api/team',
                    'announcements' => '/api/announcements',
                    'admin' => '/api/admin/*'
                ]
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'index');
        }
    }
}

class CorsController extends BaseController
{
    /**
     * Handle CORS preflight requests
     */
    public function handle(): void
    {
        $allowedOrigins = $this->getConfig('cors_allowed_origins', '*');
        $allowedMethods = $this->getConfig('cors_allowed_methods', 'GET,POST,PUT,DELETE,OPTIONS');
        $allowedHeaders = $this->getConfig('cors_allowed_headers', 'Content-Type,Authorization,X-Requested-With');

        header("Access-Control-Allow-Origin: {$allowedOrigins}");
        header("Access-Control-Allow-Methods: {$allowedMethods}");
        header("Access-Control-Allow-Headers: {$allowedHeaders}");
        header("Access-Control-Max-Age: 3600");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit(0);
        }
    }
}