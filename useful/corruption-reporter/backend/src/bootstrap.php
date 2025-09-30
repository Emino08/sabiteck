<?php
// backend/src/bootstrap.php

// Load environment variables manually
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Skip comments
        }
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Error reporting
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Try to load Composer autoloader if it exists
$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php'
];

foreach ($autoloadPaths as $autoloadPath) {
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        break;
    }
}

// If Slim is not available via Composer, we'll create a simple router
if (!class_exists('Slim\Factory\AppFactory')) {
    // Simple router implementation for when Slim is not available
    class SimpleApp {
        private $routes = [];

        public function post($path, $handler) {
            $this->routes['POST'][$path] = $handler;
        }

        public function get($path, $handler) {
            $this->routes['GET'][$path] = $handler;
        }

        public function options($path, $handler) {
            $this->routes['OPTIONS'][$path] = $handler;
        }

        public function add($middleware) {
            // Simple middleware support
        }

        public function addErrorMiddleware($a, $b, $c) {
            return $this;
        }

        public function run() {
            $method = $_SERVER['REQUEST_METHOD'];
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

            if (isset($this->routes[$method][$path])) {
                $handler = $this->routes[$method][$path];
                $request = new SimpleRequest();
                $response = new SimpleResponse();
                return $handler($request, $response);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Not found']);
            }
        }
    }

    class SimpleRequest {
        public function getParsedBody() {
            return json_decode(file_get_contents('php://input'), true) ?: $_POST;
        }
    }

    class SimpleResponse {
        private $body = '';
        private $headers = [];
        private $status = 200;

        public function getBody() {
            return $this;
        }

        public function write($content) {
            $this->body = $content;
            return $this;
        }

        public function withHeader($name, $value) {
            $this->headers[$name] = $value;
            return $this;
        }

        public function withStatus($status) {
            $this->status = $status;
            http_response_code($status);
            return $this;
        }

        public function send() {
            foreach ($this->headers as $name => $value) {
                header("$name: $value");
            }
            echo $this->body;
        }
    }

    class AppFactory {
        public static function create() {
            return new SimpleApp();
        }
    }
}
