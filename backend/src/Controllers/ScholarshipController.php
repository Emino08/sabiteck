<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ScholarshipController
{
    // Public endpoints for scholarship browsing
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $queryParams = $request->getQueryParams();
            $page = $queryParams['page'] ?? 1;
            $limit = $queryParams['limit'] ?? 10;
            $sort = $queryParams['sort'] ?? 'created_at:desc';
            $offset = ($page - 1) * $limit;

            // Handle different sort formats
            if ($sort === 'newest') {
                $sort = 'created_at:desc';
            } elseif ($sort === 'oldest') {
                $sort = 'created_at:asc';
            } elseif ($sort === 'amount_high') {
                $sort = 'amount:desc';
            } elseif ($sort === 'amount_low') {
                $sort = 'amount:asc';
            } elseif ($sort === 'deadline') {
                $sort = 'deadline:asc';
            }

            // Parse sort parameter
            [$sortField, $sortDir] = explode(':', $sort . ':desc');
            $sortDir = strtoupper($sortDir) === 'ASC' ? 'ASC' : 'DESC';
            $allowedSortFields = ['title', 'amount', 'deadline', 'created_at'];
            $sortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';

            // Build the base query
            $sql = "
                SELECT s.*
                FROM scholarships s
                WHERE s.status = 'active'
            ";

            $params = [];
            
            // Add search filter
            if (!empty($queryParams['search'])) {
                $sql .= " AND (s.title LIKE ? OR s.description LIKE ? OR s.organization LIKE ?)";
                $searchTerm = '%' . $queryParams['search'] . '%';
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
            }
            
            // Add category filter
            if (!empty($queryParams['category'])) {
                $sql .= " AND s.category = ?";
                $params[] = $queryParams['category'];
            }

            // Add region filter
            if (!empty($queryParams['region'])) {
                $sql .= " AND s.region = ?";
                $params[] = $queryParams['region'];
            }

            // Add education level filter
            if (!empty($queryParams['education_level'])) {
                $sql .= " AND s.education_level = ?";
                $params[] = $queryParams['education_level'];
            }

            // Add sorting and pagination
            $sql .= " ORDER BY s.{$sortField} {$sortDir} LIMIT ? OFFSET ?";
            $params = array_merge($params, [(int)$limit, (int)$offset]);

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $scholarships = $stmt->fetchAll();
            
            // Get total count for pagination
            $countSql = "SELECT COUNT(*) as count FROM scholarships s WHERE s.status = 'active'";
            $countParams = [];

            if (!empty($queryParams['search'])) {
                $countSql .= " AND (s.title LIKE ? OR s.description LIKE ? OR s.organization LIKE ?)";
                $searchTerm = '%' . $queryParams['search'] . '%';
                $countParams = [$searchTerm, $searchTerm, $searchTerm];
            }

            if (!empty($queryParams['category'])) {
                $countSql .= " AND s.category = ?";
                $countParams[] = $queryParams['category'];
            }

            if (!empty($queryParams['region'])) {
                $countSql .= " AND s.region = ?";
                $countParams[] = $queryParams['region'];
            }

            if (!empty($queryParams['education_level'])) {
                $countSql .= " AND s.education_level = ?";
                $countParams[] = $queryParams['education_level'];
            }

            $countStmt = $db->prepare($countSql);
            $countStmt->execute($countParams);
            $totalCount = $countStmt->fetch()['count'];

            $response->getBody()->write(json_encode([
                'success' => true,
                'scholarships' => $scholarships,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$totalCount,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Scholarship getAll error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch scholarships',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // Admin endpoint for scholarship management
    public function getAllAdmin(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $queryParams = $request->getQueryParams();
            $page = $queryParams['page'] ?? 1;
            $limit = $queryParams['limit'] ?? 10;
            $sort = $queryParams['sort'] ?? 'created_at:desc';
            $offset = ($page - 1) * $limit;

            // Parse sort parameter
            [$sortField, $sortDir] = explode(':', $sort . ':desc');
            $sortDir = strtoupper($sortDir) === 'ASC' ? 'ASC' : 'DESC';
            $allowedSortFields = ['title', 'amount', 'deadline', 'created_at', 'status'];
            $sortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';

            $sql = "SELECT * FROM scholarships ORDER BY {$sortField} {$sortDir} LIMIT ? OFFSET ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$limit, $offset]);
            $scholarships = $stmt->fetchAll();

            // Get total count
            $countStmt = $db->query("SELECT COUNT(*) as count FROM scholarships");
            $totalCount = $countStmt->fetch()['count'];

            $response->getBody()->write(json_encode([
                'success' => true,
                'scholarships' => $scholarships,
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
                'error' => 'Failed to fetch scholarships',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getCategories(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureCategoriesTableExists($db);

            $stmt = $db->query("SELECT * FROM scholarship_categories WHERE active = 1 ORDER BY name ASC");
            $categories = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'categories' => $categories
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch categories',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("SELECT * FROM scholarships WHERE id = ? AND status = 'active'");
            $stmt->execute([$id]);
            $scholarship = $stmt->fetch();

            if (!$scholarship) {
                $response->getBody()->write(json_encode([
                    'error' => 'Scholarship not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'scholarship' => $scholarship
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch scholarship'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (empty($data['title'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Title is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                INSERT INTO scholarships (title, description, amount, deadline, requirements, eligibility_criteria, status, featured)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['amount'] ?? null,
                $data['deadline'] ?? null,
                $data['requirements'] ?? null,
                $data['eligibility'] ?? $data['eligibility_criteria'] ?? null,
                $data['status'] ?? 'active',
                isset($data['featured']) ? (int)$data['featured'] : 0
            ]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Scholarship created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Scholarship creation error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create scholarship',
                'message' => $e->getMessage()
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

            $stmt = $db->prepare("
                UPDATE scholarships
                SET title = ?, description = ?, amount = ?, deadline = ?, requirements = ?, eligibility_criteria = ?, status = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");

            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['amount'],
                $data['deadline'],
                $data['requirements'],
                $data['eligibility'] ?? $data['eligibility_criteria'],
                $data['status'] ?? 'active',
                isset($data['featured']) ? (int)$data['featured'] : 0,
                $id
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Scholarship updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update scholarship'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $db = Database::getInstance();
            
            $stmt = $db->prepare("UPDATE scholarships SET status = 'cancelled' WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Scholarship deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Scholarship deletion error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete scholarship',
                'debug' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            $stmt = $db->prepare("
                SELECT * FROM scholarships
                WHERE status = 'active' AND featured = 1
                ORDER BY created_at DESC
                LIMIT 6
            ");
            $stmt->execute();
            $scholarships = $stmt->fetchAll();

            $response->getBody()->write(json_encode([
                'success' => true,
                'scholarships' => $scholarships
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Scholarship getFeatured error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch featured scholarships',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getRegions(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            // Get distinct regions from scholarships
            $stmt = $db->query("
                SELECT DISTINCT region as name, COUNT(*) as count
                FROM scholarships
                WHERE status = 'active' AND region IS NOT NULL AND region != ''
                GROUP BY region
                ORDER BY region ASC
            ");
            $regions = $stmt->fetchAll();

            // If no regions found in scholarships, return default regions
            if (empty($regions)) {
                $regions = [
                    ['name' => 'Africa', 'count' => 0],
                    ['name' => 'Asia', 'count' => 0],
                    ['name' => 'Europe', 'count' => 0],
                    ['name' => 'North America', 'count' => 0],
                    ['name' => 'South America', 'count' => 0],
                    ['name' => 'Oceania', 'count' => 0],
                    ['name' => 'Global', 'count' => 0]
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'regions' => $regions
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Scholarship getRegions error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch regions',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getEducationLevels(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            // Get distinct education levels from scholarships
            $stmt = $db->query("
                SELECT DISTINCT education_level as name, COUNT(*) as count
                FROM scholarships
                WHERE status = 'active' AND education_level IS NOT NULL AND education_level != ''
                GROUP BY education_level
                ORDER BY
                    CASE education_level
                        WHEN 'High School' THEN 1
                        WHEN 'Undergraduate' THEN 2
                        WHEN 'Graduate' THEN 3
                        WHEN 'Postgraduate' THEN 4
                        WHEN 'PhD' THEN 5
                        ELSE 6
                    END
            ");
            $educationLevels = $stmt->fetchAll();

            // If no education levels found, return default levels
            if (empty($educationLevels)) {
                $educationLevels = [
                    ['name' => 'High School', 'count' => 0],
                    ['name' => 'Undergraduate', 'count' => 0],
                    ['name' => 'Graduate', 'count' => 0],
                    ['name' => 'Postgraduate', 'count' => 0],
                    ['name' => 'PhD', 'count' => 0]
                ];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'education_levels' => $educationLevels
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Scholarship getEducationLevels error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch education levels',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getBySlug(Request $request, Response $response, $args)
    {
        try {
            $slug = $args['slug'];
            $db = Database::getInstance();
            $this->ensureTableExists($db);

            // Try to find by slug first, then by ID if slug fails
            $stmt = $db->prepare("SELECT * FROM scholarships WHERE (slug = ? OR id = ?) AND status = 'active'");
            $stmt->execute([$slug, $slug]);
            $scholarship = $stmt->fetch();

            if (!$scholarship) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Scholarship not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $scholarship
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Scholarship getBySlug error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch scholarship',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function ensureTableExists($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'scholarships'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE scholarships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE,
                    description TEXT,
                    category VARCHAR(100),
                    region VARCHAR(100),
                    education_level VARCHAR(50),
                    amount DECIMAL(10,2),
                    currency VARCHAR(3) DEFAULT 'USD',
                    deadline DATE,
                    requirements TEXT,
                    eligibility_criteria TEXT,
                    application_url VARCHAR(500),
                    contact_email VARCHAR(255),
                    organization VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'active',
                    applications_count INT DEFAULT 0,
                    featured TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");

            // Insert sample data with all required fields
            $db->exec("
                INSERT INTO scholarships (title, slug, description, category, region, education_level, amount, deadline, status, featured, applications_count) VALUES
                ('Technology Excellence Scholarship', 'tech-excellence-2024', 'Scholarship for outstanding technology students pursuing innovative projects', 'Technology', 'Global', 'Undergraduate', 5000.00, '2024-12-30', 'active', 1, 25),
                ('Engineering Innovation Award', 'engineering-innovation-2024', 'Supporting future engineers with groundbreaking ideas', 'Engineering', 'North America', 'Graduate', 3000.00, '2024-11-15', 'active', 1, 18),
                ('Computer Science Merit Scholarship', 'cs-merit-scholarship', 'For computer science students with high academic achievement', 'Computer Science', 'Europe', 'Undergraduate', 4000.00, '2024-10-20', 'active', 0, 32),
                ('Women in Tech Scholarship', 'women-in-tech-2024', 'Empowering women in technology fields worldwide', 'Technology', 'Global', 'Graduate', 2500.00, '2024-09-30', 'active', 1, 45),
                ('STEM Leadership Grant', 'stem-leadership-grant', 'For students showing exceptional leadership in STEM fields', 'STEM', 'Africa', 'Postgraduate', 6000.00, '2025-01-30', 'active', 1, 12),
                ('Medical Research Fellowship', 'medical-research-fellowship', 'Supporting medical research and innovation', 'Medicine', 'Asia', 'PhD', 8000.00, '2024-12-15', 'active', 0, 8)
            ");
        } else {
            // Check if new columns exist and add them if missing
            $columns = [];
            $result = $db->query("DESCRIBE scholarships");
            while ($row = $result->fetch()) {
                $columns[] = $row['Field'];
            }

            if (!in_array('slug', $columns)) {
                $db->exec("ALTER TABLE scholarships ADD COLUMN slug VARCHAR(255) UNIQUE AFTER title");
            }

            if (!in_array('region', $columns)) {
                $db->exec("ALTER TABLE scholarships ADD COLUMN region VARCHAR(100) AFTER category");
            }

            if (!in_array('education_level', $columns)) {
                $db->exec("ALTER TABLE scholarships ADD COLUMN education_level VARCHAR(50) AFTER region");
            }

            if (!in_array('eligibility_criteria', $columns)) {
                $db->exec("ALTER TABLE scholarships ADD COLUMN eligibility_criteria TEXT AFTER requirements");
            }
        }
    }

    private function ensureCategoriesTableExists($db)
    {
        $stmt = $db->query("SHOW TABLES LIKE 'scholarship_categories'");
        if ($stmt->rowCount() == 0) {
            $db->exec("
                CREATE TABLE scholarship_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");

            // Insert sample categories
            $db->exec("
                INSERT INTO scholarship_categories (name, description) VALUES
                ('Technology', 'Scholarships for technology-related fields'),
                ('Engineering', 'Engineering and technical scholarships'),
                ('Computer Science', 'Computer science and programming scholarships'),
                ('STEM', 'Science, Technology, Engineering, and Mathematics'),
                ('Business', 'Business and entrepreneurship scholarships'),
                ('Medicine', 'Medical and healthcare scholarships'),
                ('Education', 'Education and teaching scholarships')
            ");
        }
    }

    public function getStats(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();

            // Get total scholarships count
            $totalStmt = $db->query("SELECT COUNT(*) as count FROM scholarships");
            $total = $totalStmt->fetch()['count'];

            // Get active scholarships count
            $activeStmt = $db->query("SELECT COUNT(*) as count FROM scholarships WHERE status = 'active'");
            $active = $activeStmt->fetch()['count'];

            // Get draft scholarships count
            $draftStmt = $db->query("SELECT COUNT(*) as count FROM scholarships WHERE status = 'draft'");
            $draft = $draftStmt->fetch()['count'];

            // Get expired scholarships count
            $expiredStmt = $db->query("SELECT COUNT(*) as count FROM scholarships WHERE deadline < NOW()");
            $expired = $expiredStmt->fetch()['count'];

            // Get featured scholarships count
            $featuredStmt = $db->query("SELECT COUNT(*) as count FROM scholarships WHERE featured = 1");
            $featured = $featuredStmt->fetch()['count'];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'draft' => $draft,
                    'expired' => $expired,
                    'featured' => $featured
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Failed to fetch scholarship stats',
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

