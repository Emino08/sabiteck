<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class JobController
{
    // Get all jobs with filtering and pagination
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $queryParams = $request->getQueryParams();
            
            // Pagination parameters
            $page = (int) ($queryParams['page'] ?? 1);
            $limit = (int) ($queryParams['limit'] ?? 12);
            $offset = ($page - 1) * $limit;
            
            // Build filters
            $whereConditions = ['j.status = ?'];
            $params = ['active'];
            
            // Search filter
            if (!empty($queryParams['search'])) {
                $whereConditions[] = "(j.title LIKE ? OR j.company_name LIKE ? OR j.location LIKE ?)";
                $searchTerm = '%' . $queryParams['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            // Category filter
            if (!empty($queryParams['category'])) {
                $whereConditions[] = "j.category_id = ?";
                $params[] = $queryParams['category'];
            }
            
            // Location filter
            if (!empty($queryParams['location'])) {
                $whereConditions[] = "j.location LIKE ?";
                $params[] = '%' . $queryParams['location'] . '%';
            }
            
            // Job type filter
            if (!empty($queryParams['job_type'])) {
                $whereConditions[] = "j.job_type = ?";
                $params[] = $queryParams['job_type'];
            }
            
            // Remote work filter
            if (isset($queryParams['remote'])) {
                $whereConditions[] = "j.remote_work = ?";
                $params[] = $queryParams['remote'] ? 1 : 0;
            }
            
            // Featured filter
            if (isset($queryParams['featured'])) {
                $whereConditions[] = "j.featured = ?";
                $params[] = $queryParams['featured'] ? 1 : 0;
            }
            
            $whereClause = ' WHERE ' . implode(' AND ', $whereConditions);
            
            // Sorting
            $sortOptions = [
                'newest' => 'j.published_at DESC',
                'oldest' => 'j.published_at ASC',
                'title' => 'j.title ASC',
                'company' => 'j.company_name ASC',
                'location' => 'j.location ASC',
                'salary_high' => 'j.salary_max DESC',
                'salary_low' => 'j.salary_min ASC'
            ];
            $sort = $queryParams['sort'] ?? 'newest';
            $orderBy = $sortOptions[$sort] ?? $sortOptions['newest'];
            
            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM jobs j LEFT JOIN job_categories jc ON j.category_id = jc.id" . $whereClause;
            $db = Database::getInstance();
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $countResult = $countStmt->fetch();
            $total = $countResult['total'] ?? 0;
            
            // Get jobs
            $sql = "
                SELECT j.*, 
                       jc.name as category_name, jc.slug as category_slug,
                       CASE 
                           WHEN j.application_deadline < date('now') THEN 1 
                           ELSE 0 
                       END as is_expired
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                $whereClause
                ORDER BY j.featured DESC, $orderBy
                LIMIT ? OFFSET ?
            ";
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $jobs = $stmt->fetchAll();
            
            // Process jobs data
            foreach ($jobs as &$job) {
                // Ensure UTF-8 encoding
                foreach ($job as $key => $value) {
                    if (is_string($value)) {
                        $job[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                }
                
                // Parse JSON fields
                $job['skills_required'] = json_decode($job['skills_required'] ?? '[]', true);
                
                // Calculate days since posted
                if ($job['published_at']) {
                    $publishedDate = new \DateTime($job['published_at']);
                    $now = new \DateTime();
                    $diff = $now->diff($publishedDate);
                    $job['days_since_posted'] = (int)$diff->days;
                }
                
                // Check if deadline is approaching (within 7 days)
                if ($job['application_deadline']) {
                    $deadline = new \DateTime($job['application_deadline']);
                    $now = new \DateTime();
                    $diff = $now->diff($deadline);
                    $job['days_until_deadline'] = (int)$diff->days;
                    $job['is_deadline_approaching'] = $diff->days <= 7 && $deadline > $now;
                }
            }
            
            $data = [
                'jobs' => $jobs,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            $jsonData = json_encode($data, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);

            if ($jsonData === false) {
                $cleanData = $this->cleanUtf8Data($data);
                $jsonData = json_encode($cleanData, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            }

            $successResponse = json_encode([
                'success' => true,
                'data' => json_decode($jsonData, true),
                'message' => 'Jobs retrieved successfully'
            ]);

            $response->getBody()->write($successResponse);
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch jobs',
                'message' => 'Unable to retrieve job listings'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Get featured jobs
    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT j.*, 
                       jc.name as category_name, jc.slug as category_slug
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE j.featured = 1 AND j.status = 'active'
                ORDER BY j.published_at DESC
                LIMIT 6
            ");
            $stmt->execute();
            $jobs = $stmt->fetchAll();
            
            // Process jobs data
            foreach ($jobs as &$job) {
                foreach ($job as $key => $value) {
                    if (is_string($value)) {
                        $job[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                }
                
                $job['skills_required'] = json_decode($job['skills_required'] ?? '[]', true);
                
                if ($job['published_at']) {
                    $publishedDate = new \DateTime($job['published_at']);
                    $now = new \DateTime();
                    $diff = $now->diff($publishedDate);
                    $job['days_since_posted'] = (int)$diff->days;
                }
            }
            
            $jsonData = json_encode($jobs, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            if ($jsonData === false) {
                $cleanData = $this->cleanUtf8Data($jobs);
                $jsonData = json_encode($cleanData, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            }

            $successResponse = json_encode([
                'success' => true,
                'data' => json_decode($jsonData, true),
                'message' => 'Featured jobs retrieved successfully'
            ]);

            $response->getBody()->write($successResponse);
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch featured jobs'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Get single job by slug
    public function getBySlug(Request $request, Response $response, $args)
    {
        $slug = $args['slug'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT j.*, 
                       jc.name as category_name, jc.slug as category_slug,
                       u.first_name || ' ' || u.last_name as posted_by_name
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                LEFT JOIN users u ON j.created_by = u.id
                WHERE j.slug = ? AND j.status = 'active'
            ");
            $stmt->execute([$slug]);
            $job = $stmt->fetch();
            
            if (!$job) {
                $response->getBody()->write(json_encode(['error' => 'Job not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Increment view count (only if view_count column exists)
            try {
                $updateStmt = $db->prepare("UPDATE jobs SET view_count = view_count + 1 WHERE id = ?");
                $updateStmt->execute([$job['id']]);
            } catch (\Exception $viewCountError) {
                // view_count column doesn't exist, ignore this error and continue
                error_log("view_count column doesn't exist: " . $viewCountError->getMessage());
            }
            
            // Process job data
            foreach ($job as $key => $value) {
                if (is_string($value)) {
                    $job[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                }
            }
            
            $job['skills_required'] = json_decode($job['skills_required'] ?? '[]', true);
            
            // Get similar jobs
            $similarStmt = $db->prepare("
                SELECT j.id, j.title, j.slug, j.company_name, j.location, j.published_at,
                       jc.name as category_name
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE j.category_id = ? AND j.id != ? AND j.status = 'active'
                ORDER BY j.published_at DESC
                LIMIT 4
            ");
            $similarStmt->execute([$job['category_id'], $job['id']]);
            $job['similar_jobs'] = $similarStmt->fetchAll();

            $jsonData = json_encode($job, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            if ($jsonData === false) {
                $cleanJob = $this->cleanUtf8Data($job);
                $jsonData = json_encode($cleanJob, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            }

            $successResponse = json_encode([
                'success' => true,
                'data' => json_decode($jsonData, true),
                'message' => 'Job retrieved successfully'
            ]);

            $response->getBody()->write($successResponse);
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch job',
                'message' => 'Job not found or could not be retrieved'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Get job categories
    public function getCategories(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT jc.*, 
                       COUNT(j.id) as job_count
                FROM job_categories jc
                LEFT JOIN jobs j ON jc.id = j.category_id AND j.status = 'active'
                GROUP BY jc.id
                ORDER BY jc.name ASC
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($categories));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch categories'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Get job locations (for filter dropdown)
    public function getLocations(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT DISTINCT location, COUNT(*) as job_count
                FROM jobs 
                WHERE status = 'active'
                GROUP BY location
                ORDER BY job_count DESC, location ASC
            ");
            $stmt->execute();
            $locations = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($locations));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch locations'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Get all jobs with filters and pagination
    public function getAllAdmin(Request $request, Response $response, $args)
    {
        try {
            error_log("DEBUG: getAllAdmin called");
            error_log("DEBUG: getAllAdmin method called");
            error_log("DEBUG: Query params: " . json_encode($request->getQueryParams()));
            $queryParams = $request->getQueryParams();
            error_log("DEBUG: Raw sort param: " . ($queryParams['sort'] ?? 'not set'));
            
            // Pagination parameters
            $page = (int) ($queryParams['page'] ?? 1);
            $limit = (int) ($queryParams['limit'] ?? 10);
            $offset = ($page - 1) * $limit;
            
            // Build filters
            $whereConditions = ['1 = 1'];
            $params = [];
            
            // Search filter
            if (!empty($queryParams['search'])) {
                $whereConditions[] = "(j.title LIKE ? OR j.company_name LIKE ? OR j.location LIKE ?)";
                $searchTerm = '%' . $queryParams['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            // Status filter
            if (!empty($queryParams['status'])) {
                $whereConditions[] = "j.status = ?";
                $params[] = $queryParams['status'];
            }
            
            // Category filter
            if (!empty($queryParams['category'])) {
                $whereConditions[] = "j.category_id = ?";
                $params[] = $queryParams['category'];
            }
            
            $whereClause = ' WHERE ' . implode(' AND ', $whereConditions);
            
            // Sorting
            $sortOptions = [
                'created_at:desc' => 'j.created_at DESC',
                'created_at:asc' => 'j.created_at ASC',
                'title:asc' => 'j.title ASC',
                'company:asc' => 'j.company_name ASC',
                'deadline:asc' => 'j.application_deadline ASC'
            ];
            $sort = $queryParams['sort'] ?? 'created_at:desc';
            $orderBy = $sortOptions[$sort] ?? $sortOptions['created_at:desc'];
            
            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM jobs j LEFT JOIN job_categories jc ON j.category_id = jc.id" . $whereClause;
            $db = Database::getInstance();
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $countResult = $countStmt->fetch();
            $total = $countResult['total'] ?? 0;
            
            // Get jobs
            $sql = "
                SELECT j.*, 
                       jc.name as category_name,
                       CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as created_by_name,
                       CASE 
                           WHEN j.deadline < NOW() THEN 1 
                           ELSE 0 
                       END as is_expired
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                LEFT JOIN users u ON j.created_by = u.id
                $whereClause
                ORDER BY $orderBy
                LIMIT ? OFFSET ?
            ";
            
            $params[] = $limit;
            $params[] = $offset;
            
            error_log("DEBUG: About to execute SQL: " . $sql);
            error_log("DEBUG: SQL params: " . json_encode($params));
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $jobs = $stmt->fetchAll();
            error_log("DEBUG: Query executed successfully, jobs count: " . count($jobs));
            
            // Process jobs data
            foreach ($jobs as &$job) {
                foreach ($job as $key => $value) {
                    if (is_string($value)) {
                        $job[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                }
                
                $job['skills_required'] = json_decode($job['skills_required'] ?? '[]', true);
                
                if ($job['created_at']) {
                    $createdDate = new \DateTime($job['created_at']);
                    $now = new \DateTime();
                    $diff = $now->diff($createdDate);
                    $job['days_since_created'] = (int)$diff->days;
                }
            }
            
            $jsonData = json_encode([
                'jobs' => $jobs,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ], JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            
            if ($jsonData === false) {
                $cleanData = $this->cleanUtf8Data([
                    'jobs' => $jobs,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
                $jsonData = json_encode($cleanData, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            }
            
            $response->getBody()->write($jsonData);
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("DEBUG: Exception in getAllAdmin: " . $e->getMessage());
            error_log("DEBUG: Stack trace: " . $e->getTraceAsString());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch jobs',
                'debug_message' => $e->getMessage(),
                'debug_file' => $e->getFile() . ':' . $e->getLine(),
                'debug_trace' => explode("\n", $e->getTraceAsString())
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Get single job by ID
    public function getByIdAdmin(Request $request, Response $response, $args)
    {
        $jobId = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT j.*, 
                       jc.name as category_name, jc.slug as category_slug,
                       u.first_name || ' ' || u.last_name as created_by_name
                FROM jobs j
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                LEFT JOIN users u ON j.created_by = u.id
                WHERE j.id = ?
            ");
            $stmt->execute([$jobId]);
            $job = $stmt->fetch();
            
            if (!$job) {
                $response->getBody()->write(json_encode(['error' => 'Job not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Process job data
            foreach ($job as $key => $value) {
                if (is_string($value)) {
                    $job[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                }
            }
            
            $job['skills_required'] = json_decode($job['skills_required'] ?? '[]', true);
            
            $jsonData = json_encode($job, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            if ($jsonData === false) {
                $cleanJob = $this->cleanUtf8Data($job);
                $jsonData = json_encode($cleanJob, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            }
            
            $response->getBody()->write($jsonData);
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch job'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Get job statistics
    public function getStats(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            
            // Get basic counts
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured,
                    SUM(CASE WHEN deadline < NOW() AND status = 'active' THEN 1 ELSE 0 END) as expired
                FROM jobs
            ");
            $stmt->execute();
            $stats = $stmt->fetch();
            
            // Get total applications (check if table exists first)
            try {
                $appStmt = $db->prepare("SELECT COUNT(*) as total_applications FROM job_applications");
                $appStmt->execute();
                $appResult = $appStmt->fetch();
                $stats['total_applications'] = $appResult['total_applications'];
            } catch (\Exception $e) {
                // Table doesn't exist, set to 0
                error_log("job_applications table doesn't exist, setting to 0");
                $stats['total_applications'] = 0;
            }
            
            $response->getBody()->write(json_encode($stats));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch statistics'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Create new job
    public function create(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $currentUser = $request->getAttribute('user');
        
        // Validate required fields
        if (empty($data['title']) || empty($data['organization_id'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Title and organization are required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Verify organization exists
            $orgStmt = $db->prepare("SELECT id FROM organizations WHERE id = ? AND status = 'active'");
            $orgStmt->execute([$data['organization_id']]);
            if (!$orgStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid organization selected'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Generate slug
            $slug = $this->generateSlug($data['title'], $db);
            
            $stmt = $db->prepare("
                INSERT INTO jobs (
                    title, slug, company_name, company_logo, company_website,
                    description, short_description, category_id, location,
                    job_type, remote_work, experience_level, education_level,
                    salary_min, salary_max, salary_currency, skills_required,
                    application_deadline, contact_email, contact_phone,
                    external_url, featured, status, organization_id, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ");
            
            $stmt->execute([
                $data['title'],
                $slug,
                $data['company_name'],
                $data['company_logo'] ?? null,
                $data['company_website'] ?? null,
                $data['description'],
                $data['short_description'] ?? null,
                $data['category_id'],
                $data['location'],
                $data['job_type'] ?? 'full-time',
                $data['remote_work'] ?? 0,
                $data['experience_level'] ?? 'entry',
                $data['education_level'] ?? null,
                $data['salary_min'] ?? null,
                $data['salary_max'] ?? null,
                $data['salary_currency'] ?? 'USD',
                json_encode($data['skills_required'] ?? []),
                $data['application_deadline'] ?? null,
                $data['contact_email'] ?? null,
                $data['contact_phone'] ?? null,
                $data['external_url'] ?? null,
                $data['featured'] ?? 0,
                $data['status'] ?? 'draft',
                $data['organization_id'],
                $currentUser->user_id,
            ]);
            
            $jobId = $db->lastInsertId();
            
            // If status is active, set published_at
            if ($data['status'] === 'active') {
                $publishStmt = $db->prepare("UPDATE jobs SET published_at = datetime('now') WHERE id = ?");
                $publishStmt->execute([$jobId]);
            }
            
            $response->getBody()->write(json_encode([
                'message' => 'Job created successfully',
                'job_id' => $jobId,
                'slug' => $slug
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create job'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Update job
    public function update(Request $request, Response $response, $args)
    {
        $jobId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        $currentUser = $request->getAttribute('user');
        
        try {
            $db = Database::getInstance();
            
            // Check if job exists
            $checkStmt = $db->prepare("SELECT id, status FROM jobs WHERE id = ?");
            $checkStmt->execute([$jobId]);
            $existingJob = $checkStmt->fetch();
            
            if (!$existingJob) {
                $response->getBody()->write(json_encode(['error' => 'Job not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Update slug if title changed
            $slug = isset($data['title']) ? $this->generateSlug($data['title'], $db, $jobId) : null;
            
            $updateFields = [];
            $params = [];
            
            if (isset($data['title'])) {
                $updateFields[] = "title = ?";
                $params[] = $data['title'];
                $updateFields[] = "slug = ?";
                $params[] = $slug;
            }
            if (isset($data['company_name'])) {
                $updateFields[] = "company_name = ?";
                $params[] = $data['company_name'];
            }
            if (isset($data['company_logo'])) {
                $updateFields[] = "company_logo = ?";
                $params[] = $data['company_logo'];
            }
            if (isset($data['company_website'])) {
                $updateFields[] = "company_website = ?";
                $params[] = $data['company_website'];
            }
            if (isset($data['description'])) {
                $updateFields[] = "description = ?";
                $params[] = $data['description'];
            }
            if (isset($data['short_description'])) {
                $updateFields[] = "short_description = ?";
                $params[] = $data['short_description'];
            }
            if (isset($data['category_id'])) {
                $updateFields[] = "category_id = ?";
                $params[] = $data['category_id'];
            }
            if (isset($data['location'])) {
                $updateFields[] = "location = ?";
                $params[] = $data['location'];
            }
            if (isset($data['job_type'])) {
                $updateFields[] = "job_type = ?";
                $params[] = $data['job_type'];
            }
            if (isset($data['remote_work'])) {
                $updateFields[] = "remote_work = ?";
                $params[] = $data['remote_work'];
            }
            if (isset($data['experience_level'])) {
                $updateFields[] = "experience_level = ?";
                $params[] = $data['experience_level'];
            }
            if (isset($data['education_level'])) {
                $updateFields[] = "education_level = ?";
                $params[] = $data['education_level'];
            }
            if (isset($data['salary_min'])) {
                $updateFields[] = "salary_min = ?";
                $params[] = $data['salary_min'];
            }
            if (isset($data['salary_max'])) {
                $updateFields[] = "salary_max = ?";
                $params[] = $data['salary_max'];
            }
            if (isset($data['salary_currency'])) {
                $updateFields[] = "salary_currency = ?";
                $params[] = $data['salary_currency'];
            }
            if (isset($data['skills_required'])) {
                $updateFields[] = "skills_required = ?";
                $params[] = json_encode($data['skills_required']);
            }
            if (isset($data['application_deadline'])) {
                $updateFields[] = "application_deadline = ?";
                $params[] = $data['application_deadline'];
            }
            if (isset($data['contact_email'])) {
                $updateFields[] = "contact_email = ?";
                $params[] = $data['contact_email'];
            }
            if (isset($data['contact_phone'])) {
                $updateFields[] = "contact_phone = ?";
                $params[] = $data['contact_phone'];
            }
            if (isset($data['external_url'])) {
                $updateFields[] = "external_url = ?";
                $params[] = $data['external_url'];
            }
            if (isset($data['featured'])) {
                $updateFields[] = "featured = ?";
                $params[] = $data['featured'];
            }
            if (isset($data['status'])) {
                $updateFields[] = "status = ?";
                $params[] = $data['status'];
                
                // Set published_at when changing from draft to active
                if ($existingJob['status'] !== 'active' && $data['status'] === 'active') {
                    $updateFields[] = "published_at = datetime('now')";
                }
            }
            
            if (!empty($updateFields)) {
                $updateFields[] = "updated_at = datetime('now')";
                $params[] = $jobId;
                
                $sql = "UPDATE jobs SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            
            $response->getBody()->write(json_encode([
                'message' => 'Job updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update job'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Delete job
    public function delete(Request $request, Response $response, $args)
    {
        $jobId = $args['id'];
        
        try {
            $db = Database::getInstance();
            
            // Check if job exists and get application count
            $checkStmt = $db->prepare("
                SELECT j.id, j.title, COUNT(ja.id) as application_count
                FROM jobs j
                LEFT JOIN job_applications ja ON j.id = ja.job_id
                WHERE j.id = ?
                GROUP BY j.id
            ");
            $checkStmt->execute([$jobId]);
            $job = $checkStmt->fetch();
            
            if (!$job) {
                $response->getBody()->write(json_encode(['error' => 'Job not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Delete applications first (cascade)
            $deleteAppsStmt = $db->prepare("DELETE FROM job_applications WHERE job_id = ?");
            $deleteAppsStmt->execute([$jobId]);
            
            // Delete application history
            $deleteHistoryStmt = $db->prepare("
                DELETE FROM job_application_history 
                WHERE application_id IN (
                    SELECT id FROM job_applications WHERE job_id = ?
                )
            ");
            $deleteHistoryStmt->execute([$jobId]);
            
            // Delete job
            $deleteJobStmt = $db->prepare("DELETE FROM jobs WHERE id = ?");
            $deleteJobStmt->execute([$jobId]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Job deleted successfully',
                'applications_deleted' => (int)$job['application_count']
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete job'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function generateSlug($title, $db, $excludeId = null)
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        $originalSlug = $slug;
        $counter = 1;
        
        while (true) {
            $checkSql = "SELECT id FROM jobs WHERE slug = ?";
            $params = [$slug];
            
            if ($excludeId) {
                $checkSql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $db->prepare($checkSql);
            $stmt->execute($params);
            
            if (!$stmt->fetch()) {
                break;
            }
            
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    private function cleanUtf8Data($data)
    {
        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $key => $value) {
                $cleaned[$key] = $this->cleanUtf8Data($value);
            }
            return $cleaned;
        } elseif (is_string($data)) {
            return mb_convert_encoding($data, 'UTF-8', 'UTF-8');
        }
        return $data;
    }
}