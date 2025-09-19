<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class CompanyController
{
    /**
     * Get company information
     */
    public function getCompanyInfo(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Check if company_info table exists, if not create it
            $stmt = $db->query("SHOW TABLES LIKE 'company_info'");
            if ($stmt->rowCount() == 0) {
                $this->createCompanyInfoTable($db);
                $this->insertDefaultCompanyInfo($db);
            }

            $stmt = $db->query("SELECT * FROM company_info WHERE id = 1");
            $companyInfo = $stmt->fetch();

            if (!$companyInfo) {
                $this->insertDefaultCompanyInfo($db);
                $stmt = $db->query("SELECT * FROM company_info WHERE id = 1");
                $companyInfo = $stmt->fetch();
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $companyInfo
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch company information',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Get company mission
     */
    public function getCompanyMission(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Check if company_content table exists, if not create it
            $stmt = $db->query("SHOW TABLES LIKE 'company_content'");
            if ($stmt->rowCount() == 0) {
                $this->createCompanyContentTable($db);
                $this->insertDefaultCompanyContent($db);
            }

            $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'mission' LIMIT 1");
            $stmt->execute();
            $mission = $stmt->fetch();

            if (!$mission) {
                $this->insertDefaultCompanyContent($db);
                $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'mission' LIMIT 1");
                $stmt->execute();
                $mission = $stmt->fetch();
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $mission
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch company mission',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Get company values
     */
    public function getCompanyValues(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Check if company_content table exists, if not create it
            $stmt = $db->query("SHOW TABLES LIKE 'company_content'");
            if ($stmt->rowCount() == 0) {
                $this->createCompanyContentTable($db);
                $this->insertDefaultCompanyContent($db);
            }

            $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'values'");
            $stmt->execute();
            $values = $stmt->fetchAll();

            if (empty($values)) {
                $this->insertDefaultCompanyContent($db);
                $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'values'");
                $stmt->execute();
                $values = $stmt->fetchAll();
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $values
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch company values',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Get about page content
     */
    public function getAboutContent(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Check if company_content table exists, if not create it
            $stmt = $db->query("SHOW TABLES LIKE 'company_content'");
            if ($stmt->rowCount() == 0) {
                $this->createCompanyContentTable($db);
                $this->insertDefaultCompanyContent($db);
            }

            $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'about' LIMIT 1");
            $stmt->execute();
            $about = $stmt->fetch();

            if (!$about) {
                $this->insertDefaultCompanyContent($db);
                $stmt = $db->prepare("SELECT * FROM company_content WHERE type = 'about' LIMIT 1");
                $stmt->execute();
                $about = $stmt->fetch();
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'content' => $about
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch about content',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Update company information (Admin only)
     */
    public function updateCompanyInfo(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $db = Database::getInstance();

            $stmt = $db->prepare("
                UPDATE company_info SET
                    name = ?, tagline = ?, description = ?, founded_year = ?,
                    location = ?, address = ?, email = ?, phone = ?, website = ?,
                    updated_at = NOW()
                WHERE id = 1
            ");

            $stmt->execute([
                $data['name'] ?? 'Sabiteck Limited',
                $data['tagline'] ?? 'Your Premier Tech Partner in Sierra Leone',
                $data['description'] ?? '',
                $data['founded_year'] ?? 2020,
                $data['location'] ?? 'Bo, Sierra Leone',
                $data['address'] ?? '6 Hancil Road, Bo, Sierra Leone',
                $data['email'] ?? 'info@sabiteck.com',
                $data['phone'] ?? '+232 78 618 435',
                $data['website'] ?? 'https://sabiteck.com'
            ]);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'message' => 'Company information updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to update company information',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Create company_info table
     */
    private function createCompanyInfoTable($db)
    {
        $db->exec("
            CREATE TABLE IF NOT EXISTS company_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL DEFAULT 'Sabiteck Limited',
                tagline VARCHAR(500) DEFAULT 'Your Premier Tech Partner in Sierra Leone',
                description TEXT,
                founded_year INT DEFAULT 2020,
                location VARCHAR(255) DEFAULT 'Bo, Sierra Leone',
                address TEXT DEFAULT '6 Hancil Road, Bo, Sierra Leone',
                email VARCHAR(255) DEFAULT 'info@sabiteck.com',
                phone VARCHAR(50) DEFAULT '+232 78 618 435',
                website VARCHAR(255) DEFAULT 'https://sabiteck.com',
                logo_url VARCHAR(500),
                social_links JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
    }

    /**
     * Create company_content table
     */
    private function createCompanyContentTable($db)
    {
        $db->exec("
            CREATE TABLE IF NOT EXISTS company_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('about', 'mission', 'values', 'history', 'vision') NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                icon VARCHAR(100),
                color VARCHAR(50),
                order_index INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
    }

    /**
     * Insert default company information
     */
    private function insertDefaultCompanyInfo($db)
    {
        $stmt = $db->prepare("
            INSERT INTO company_info (
                name, tagline, description, founded_year, location, address, email, phone, website
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            'Sabiteck Limited',
            'Your Premier Tech Partner in Sierra Leone',
            'We are a passionate team of developers, designers, and strategists dedicated to building software that makes a difference. Founded in 2020, we have helped dozens of companies transform their ideas into successful digital products.',
            2020,
            'Bo, Sierra Leone',
            '6 Hancil Road, Bo, Sierra Leone',
            'info@sabiteck.com',
            '+232 78 618 435',
            'https://sabiteck.com'
        ]);
    }

    /**
     * Insert default company content
     */
    private function insertDefaultCompanyContent($db)
    {
        $defaultContent = [
            [
                'type' => 'about',
                'title' => 'About Sabiteck',
                'content' => 'We are a passionate team of developers, designers, and strategists dedicated to building software that makes a difference. Founded in 2020, we have helped dozens of companies transform their ideas into successful digital products.',
                'icon' => 'info',
                'color' => 'blue'
            ],
            [
                'type' => 'mission',
                'title' => 'Our Mission',
                'content' => 'To empower businesses across Sierra Leone with innovative software solutions that drive growth, improve efficiency, and create exceptional user experiences. We believe technology should solve real problems and create meaningful value for our clients and their customers.',
                'icon' => 'target',
                'color' => 'blue'
            ],
            [
                'type' => 'values',
                'title' => 'Innovation First',
                'content' => 'We stay ahead of technology trends to deliver cutting-edge solutions that drive business growth.',
                'icon' => 'lightbulb',
                'color' => 'yellow',
                'order_index' => 1
            ],
            [
                'type' => 'values',
                'title' => 'Quality Focused',
                'content' => 'We maintain the highest standards in code quality, security, and user experience across all projects.',
                'icon' => 'shield',
                'color' => 'green',
                'order_index' => 2
            ],
            [
                'type' => 'values',
                'title' => 'Client Success',
                'content' => 'Your success is our success. We are committed to delivering results that exceed expectations.',
                'icon' => 'heart',
                'color' => 'red',
                'order_index' => 3
            ],
            [
                'type' => 'values',
                'title' => 'Goal Oriented',
                'content' => 'We focus on achieving measurable outcomes that align with your business objectives.',
                'icon' => 'target',
                'color' => 'blue',
                'order_index' => 4
            ]
        ];

        $stmt = $db->prepare("
            INSERT INTO company_content (type, title, content, icon, color, order_index)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($defaultContent as $content) {
            $stmt->execute([
                $content['type'],
                $content['title'],
                $content['content'],
                $content['icon'],
                $content['color'],
                $content['order_index'] ?? 0
            ]);
        }
    }
}
