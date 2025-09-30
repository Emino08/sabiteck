<?php

namespace App\Controllers;

use Exception;
use DateTime;
use PDO;
use App\Services\EmailService;

class AdminController extends BaseController
{
    /**
     * Get all services for admin
     */
    public function getServices(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM services ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $services = $stmt->fetchAll();

            $this->dataResponse($services, count($services));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getServices');
        }
    }

    /**
     * Create new service
     */
    public function createService(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'short_description'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', preg_replace('/[^A-Za-z0-9\\s]/', '', $title)));
            $shortDescription = $input['short_description'];
            $fullDescription = $input['description'] ?? $input['full_description'] ?? '';
            $icon = $input['icon'] ?? '';
            $features = isset($input['features'])
                ? (is_array($input['features']) ? json_encode($input['features']) : $input['features'])
                : json_encode($this->getAppConfig('services', 'default_features', []));
            $technologies = isset($input['technologies'])
                ? (is_array($input['technologies']) ? json_encode($input['technologies']) : $input['technologies'])
                : json_encode($this->getAppConfig('services', 'default_technologies', []));
            $pricing = $input['price'] ?? $input['pricing'] ?? '';
            $timeline = $input['duration'] ?? $input['timeline'] ?? '';
            $processSteps = isset($input['process_steps'])
                ? (is_array($input['process_steps']) ? json_encode($input['process_steps']) : $input['process_steps'])
                : json_encode($this->getAppConfig('services', 'default_process_steps', []));
            $popular = (bool)($input['featured'] ?? $input['popular'] ?? $this->getAppConfig('services', 'default_popular', false)) ? 1 : 0;
            $active = (bool)($input['active'] ?? $this->getAppConfig('services', 'default_active', true)) ? 1 : 0;
            $sortOrder = (int)($input['sort_order'] ?? $input['order_position'] ?? $this->getAppConfig('services', 'default_sort_order', 0));

            $stmt = $this->db->prepare("
                INSERT INTO services (
                    title, slug, short_description, full_description, icon,
                    features, technologies, pricing, timeline, process_steps,
                    popular, active, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $title, $slug, $shortDescription, $fullDescription, $icon,
                $features, $technologies, $pricing, $timeline, $processSteps,
                $popular, $active, $sortOrder
            ]);

            $this->successResponse('SERVICE_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createService');
        }
    }

    /**
     * Update existing service
     */
    public function updateService(int $serviceId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            // Check if service exists
            $stmt = $this->db->prepare("SELECT id FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('SERVICE_NOT_FOUND', 404);
                return;
            }

            if (!$this->validateRequired($input, ['title', 'short_description'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', preg_replace('/[^A-Za-z0-9\\s]/', '', $title)));
            $shortDescription = $input['short_description'];
            $fullDescription = $input['description'] ?? $input['full_description'] ?? '';
            $icon = $input['icon'] ?? '';
            $features = isset($input['features'])
                ? (is_array($input['features']) ? json_encode($input['features']) : $input['features'])
                : json_encode($this->getAppConfig('services', 'default_features', []));
            $technologies = isset($input['technologies'])
                ? (is_array($input['technologies']) ? json_encode($input['technologies']) : $input['technologies'])
                : json_encode($this->getAppConfig('services', 'default_technologies', []));
            $pricing = $input['price'] ?? $input['pricing'] ?? '';
            $timeline = $input['duration'] ?? $input['timeline'] ?? '';
            $processSteps = isset($input['process_steps'])
                ? (is_array($input['process_steps']) ? json_encode($input['process_steps']) : $input['process_steps'])
                : json_encode($this->getAppConfig('services', 'default_process_steps', []));
            $popular = (bool)($input['featured'] ?? $input['popular'] ?? $this->getAppConfig('services', 'default_popular', false)) ? 1 : 0;
            $active = (bool)($input['active'] ?? $this->getAppConfig('services', 'default_active', true)) ? 1 : 0;
            $sortOrder = (int)($input['sort_order'] ?? $input['order_position'] ?? $this->getAppConfig('services', 'default_sort_order', 0));

            $stmt = $this->db->prepare("
                UPDATE services SET
                    title = ?, slug = ?, short_description = ?, full_description = ?, icon = ?,
                    features = ?, technologies = ?, pricing = ?, timeline = ?, process_steps = ?,
                    popular = ?, active = ?, sort_order = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $title, $slug, $shortDescription, $fullDescription, $icon,
                $features, $technologies, $pricing, $timeline, $processSteps,
                $popular, $active, $sortOrder, $serviceId
            ]);

            $this->successResponse('SERVICE_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateService');
        }
    }

    /**
     * Update service field (for quick updates like status)
     */
    public function updateServiceField(int $serviceId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            // Check if service exists
            $stmt = $this->db->prepare("SELECT id FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('SERVICE_NOT_FOUND', 404);
                return;
            }

            $allowedFields = ['active', 'popular', 'featured', 'sort_order'];
            $updates = [];
            $values = [];

            foreach ($input as $field => $value) {
                if (in_array($field, $allowedFields)) {
                    if ($field === 'featured') {
                        $field = 'popular'; // Map frontend 'featured' to database 'popular'
                    }
                    if (in_array($field, ['active', 'popular'])) {
                        $value = (bool)$value ? 1 : 0;
                    }
                    $updates[] = "$field = ?";
                    $values[] = $value;
                }
            }

            if (empty($updates)) {
                $this->errorResponse('NO_VALID_FIELDS', 400);
                return;
            }

            $values[] = $serviceId;
            $sql = "UPDATE services SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);

            $this->successResponse('SERVICE_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateServiceField');
        }
    }

    /**
     * Delete service
     */
    public function deleteService(int $serviceId): void
    {
        try {
            // Check if service exists
            $stmt = $this->db->prepare("SELECT id FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('SERVICE_NOT_FOUND', 404);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);

            $this->successResponse('SERVICE_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteService');
        }
    }

    /**
     * Get all jobs for admin
     */
    public function getJobs(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jobs ORDER BY created_at DESC");
            $stmt->execute();
            $jobs = $stmt->fetchAll();

            $this->dataResponse($jobs, count($jobs));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobs');
        }
    }

    /**
     * Create new job
     */
    public function createJob(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'description', 'department', 'location'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $title));
            $description = $input['description'];
            $department = $input['department'];
            $location = $input['location'];
            $type = $input['type'] ?? $this->getDefaultValue('job', 'type', 'full-time');
            $status = $input['status'] ?? $this->getDefaultValue('job', 'status', 'draft');
            $deadline = $input['deadline'] ?? date('Y-m-d', strtotime('+' . $this->getAppConfig('job_deadline_default_days', 30) . ' days'));
            $requirements = $input['requirements'] ?? '';
            $salaryMin = !empty($input['salary_min']) ? (int)$input['salary_min'] : null;
            $salaryMax = !empty($input['salary_max']) ? (int)$input['salary_max'] : null;
            $applicationsCount = $this->getDefaultValue('job', 'applications_count', 0);

            $stmt = $this->db->prepare("INSERT INTO jobs (title, slug, description, department, location, type, status, deadline, requirements, salary_min, salary_max, applications_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $slug, $description, $department, $location, $type, $status, $deadline, $requirements, $salaryMin, $salaryMax, $applicationsCount]);

            $this->successResponse('JOB_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createJob');
        }
    }

    /**
     * Update existing job
     */
    public function updateJob(int $jobId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'description'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            // Check if job exists
            $stmt = $this->db->prepare("SELECT id FROM jobs WHERE id = ?");
            $stmt->execute([$jobId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('JOB_NOT_FOUND', 404);
                return;
            }

            // Map frontend fields to database fields
            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace([' ', '/'], ['-', '-'], $title));
            $description = $input['description'];
            $requirements = $input['requirements'] ?? $input['short_description'] ?? '';
            $department = $input['category'] ?? $input['department'] ?? '';
            $location = $input['location'] ?? '';
            $type = $input['job_type'] ?? $input['type'] ?? 'full-time';
            $salaryMin = !empty($input['salary_min']) ? (int)$input['salary_min'] : null;
            $salaryMax = !empty($input['salary_max']) ? (int)$input['salary_max'] : null;
            $salaryCurrency = $input['salary_currency'] ?? 'USD';
            $featured = isset($input['featured']) ? (int)$input['featured'] : 0;
            $status = $input['status'] ?? 'active';
            $applicationDeadline = $input['application_deadline'] ?? $input['deadline'] ?? date('Y-m-d', strtotime('+30 days'));

            $stmt = $this->db->prepare("UPDATE jobs SET
                title = ?,
                slug = ?,
                description = ?,
                requirements = ?,
                department = ?,
                location = ?,
                type = ?,
                salary_min = ?,
                salary_max = ?,
                salary_currency = ?,
                featured = ?,
                status = ?,
                application_deadline = ?,
                updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([$title, $slug, $description, $requirements, $department, $location, $type, $salaryMin, $salaryMax, $salaryCurrency, $featured, $status, $applicationDeadline, $jobId]);

            $this->successResponse('JOB_UPDATED', ['id' => $jobId]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateJob');
        }
    }

    /**
     * Delete job for admin
     */
    public function deleteJob(int $jobId): void
    {
        try {
            // Check if job exists
            $stmt = $this->db->prepare("SELECT id FROM jobs WHERE id = ?");
            $stmt->execute([$jobId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('JOB_NOT_FOUND', 404);
                return;
            }

            // Delete associated job applications first (if any)
            $stmt = $this->db->prepare("DELETE FROM job_applications WHERE job_id = ?");
            $stmt->execute([$jobId]);

            // Delete the job
            $stmt = $this->db->prepare("DELETE FROM jobs WHERE id = ?");
            $stmt->execute([$jobId]);

            $this->successResponse('JOB_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteJob');
        }
    }

    /**
     * Get all scholarships for admin
     */
    public function getScholarships(): void
    {
        try {
            // Get filters from query parameters
            $statusFilter = $_GET['status'] ?? '';
            $categoryFilter = $_GET['category'] ?? '';
            $searchTerm = $_GET['search'] ?? '';
            $activeOnly = $_GET['active_only'] ?? false;

            // Build dynamic query with filters
            $whereClauses = [];
            $params = [];

            // Status filter
            if (!empty($statusFilter)) {
                $whereClauses[] = "status = ?";
                $params[] = $statusFilter;
            }

            // Category filter
            if (!empty($categoryFilter)) {
                $whereClauses[] = "category = ?";
                $params[] = $categoryFilter;
            }

            // Search filter
            if (!empty($searchTerm)) {
                $whereClauses[] = "(title LIKE ? OR description LIKE ? OR category LIKE ?)";
                $searchParam = "%{$searchTerm}%";
                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            // Active only filter
            if ($activeOnly) {
                $whereClauses[] = "status = 'active'";
                $whereClauses[] = "(deadline IS NULL OR deadline = '' OR deadline >= CURDATE())";
            }

            // Build the complete query with proper sorting (active first, deleted last)
            $whereClause = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

            $query = "
                SELECT * FROM scholarships
                {$whereClause}
                ORDER BY
                    CASE
                        WHEN status = 'active' THEN 1
                        WHEN status = 'draft' THEN 2
                        WHEN status = 'inactive' THEN 3
                        WHEN status = 'deleted' THEN 4
                        ELSE 5
                    END,
                    featured DESC,
                    created_at DESC
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $scholarships = $stmt->fetchAll();

            // Count total for pagination
            $countQuery = "SELECT COUNT(*) as total FROM scholarships" . ($whereClause ? " $whereClause" : "");
            $countStmt = $this->db->prepare($countQuery);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch()['total'];

            // Handle pagination
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $offset = ($page - 1) * $limit;

            // Add pagination to the main query
            $query .= " LIMIT $limit OFFSET $offset";
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $scholarships = $stmt->fetchAll();

            // Add additional info about deadline status
            $scholarships = array_map(function($scholarship) {
                $isExpired = false;
                if (!empty($scholarship['deadline'])) {
                    $deadline = new DateTime($scholarship['deadline']);
                    $now = new DateTime();
                    $isExpired = $deadline < $now;
                }

                $scholarship['is_expired'] = $isExpired;
                $scholarship['deadline_status'] = $isExpired ? 'expired' : 'active';

                return $scholarship;
            }, $scholarships);

            // Send response with pagination info
            $response = [
                'success' => true,
                'data' => $scholarships,
                'total' => $totalCount,
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total_pages' => ceil($totalCount / $limit)
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarships');
        }
    }

    /**
     * Get only active scholarships for generator
     */
    public function getActiveScholarships(): void
    {
        try {
            // First, check if scholarships table exists
            $checkTable = $this->db->prepare("SHOW TABLES LIKE 'scholarships'");
            $checkTable->execute();
            $tableExists = $checkTable->fetch();

            if (!$tableExists) {
                // Return empty array if table doesn't exist
                $this->dataResponse([], 0);
                return;
            }

            // Simplified query to avoid potential date issues
            $stmt = $this->db->prepare("
                SELECT * FROM scholarships
                WHERE status = 'active'
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $scholarships = $stmt->fetchAll();

            // Filter out expired scholarships in PHP to avoid SQL date issues
            $activeScholarships = array_filter($scholarships, function($scholarship) {
                if (empty($scholarship['deadline'])) {
                    return true; // No deadline means always active
                }

                try {
                    $deadline = new DateTime($scholarship['deadline']);
                    $now = new DateTime();
                    return $deadline >= $now;
                } catch (Exception $e) {
                    return true; // If we can't parse the date, include it
                }
            });

            $this->dataResponse(array_values($activeScholarships), count($activeScholarships));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getActiveScholarships');
        }
    }

    /**
     * Get all portfolio items for admin
     */
    public function getPortfolio(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM portfolio ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $portfolio = $stmt->fetchAll();

            $this->dataResponse($portfolio, count($portfolio));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getPortfolio');
        }
    }

    /**
     * Create a new portfolio item
     */
    public function createPortfolio(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$this->validateRequired($input, ['title', 'description'])) {
                $this->errorResponse('VALIDATION_FAILED', 400);
                return;
            }

            $input = $this->sanitizeInput($input);

            // Generate slug from title
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($input['title'])));

            // Handle technologies - convert to proper JSON format
            $technologies = '';
            if (isset($input['technologies'])) {
                if (is_array($input['technologies'])) {
                    $technologies = json_encode($input['technologies']);
                } elseif (is_string($input['technologies']) && !empty($input['technologies'])) {
                    // If it's a comma-separated string, convert to array then JSON
                    $techArray = array_map('trim', explode(',', $input['technologies']));
                    $technologies = json_encode($techArray);
                }
            }

            $stmt = $this->db->prepare("
                INSERT INTO portfolio (
                    title, slug, description, short_description, category,
                    technologies, image_url, live_url, github_url,
                    client_type, duration, team_size, featured, status, sort_order,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
                )
            ");

            $stmt->execute([
                $input['title'],
                $slug,
                $input['description'],
                $input['short_description'] ?? '',
                $input['category'] ?? '',
                $technologies,
                $input['image_url'] ?? '/api/placeholder/600/400',
                $input['live_url'] ?? '',
                $input['github_url'] ?? '',
                $input['client_type'] ?? '',
                $input['duration'] ?? '',
                (int)($input['team_size'] ?? 1),
                (bool)($input['featured'] ?? $this->getAppConfig('portfolio', 'default_featured', false)) ? 1 : 0,
                $input['status'] ?? $this->getAppConfig('portfolio', 'default_status', 'active'),
                (int)($input['sort_order'] ?? $this->getAppConfig('portfolio', 'default_sort_order', 0))
            ]);

            $portfolioId = $this->db->lastInsertId();
            $this->successResponse('PORTFOLIO_CREATED', ['id' => $portfolioId], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createPortfolio');
        }
    }

    /**
     * Update an existing portfolio item
     */
    public function updatePortfolio(int $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$this->validateRequired($input, ['title', 'description'])) {
                $this->errorResponse('VALIDATION_FAILED', 400);
                return;
            }

            $input = $this->sanitizeInput($input);

            // Generate slug from title
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($input['title'])));

            // Handle technologies - convert to proper JSON format
            $technologies = '';
            if (isset($input['technologies'])) {
                if (is_array($input['technologies'])) {
                    $technologies = json_encode($input['technologies']);
                } elseif (is_string($input['technologies']) && !empty($input['technologies'])) {
                    // If it's a comma-separated string, convert to array then JSON
                    $techArray = array_map('trim', explode(',', $input['technologies']));
                    $technologies = json_encode($techArray);
                }
            }

            $stmt = $this->db->prepare("
                UPDATE portfolio SET
                    title = ?, slug = ?, description = ?, short_description = ?, category = ?,
                    technologies = ?, image_url = ?, live_url = ?, github_url = ?,
                    client_type = ?, duration = ?, team_size = ?, featured = ?, status = ?, sort_order = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $input['title'],
                $slug,
                $input['description'],
                $input['short_description'] ?? '',
                $input['category'] ?? '',
                $technologies,
                $input['image_url'] ?? '/api/placeholder/600/400',
                $input['live_url'] ?? '',
                $input['github_url'] ?? '',
                $input['client_type'] ?? '',
                $input['duration'] ?? '',
                (int)($input['team_size'] ?? 1),
                (bool)($input['featured'] ?? false) ? 1 : 0,
                $input['status'] ?? 'active',
                (int)($input['sort_order'] ?? 0),
                $id
            ]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('PORTFOLIO_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('PORTFOLIO_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updatePortfolio');
        }
    }

    /**
     * Update a single field of a portfolio item
     */
    public function updatePortfolioField(int $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input) || count($input) !== 1) {
                $this->errorResponse('VALIDATION_FAILED', 400);
                return;
            }

            $field = array_keys($input)[0];
            $value = array_values($input)[0];

            // Validate allowed fields for update
            $allowedFields = [
                'featured', 'status', 'category', 'sort_order'
            ];

            if (!in_array($field, $allowedFields)) {
                $this->errorResponse('INVALID_FIELD', 400);
                return;
            }

            // Sanitize boolean values
            if (in_array($field, ['featured'])) {
                $value = (bool)$value ? 1 : 0;
            }

            $stmt = $this->db->prepare("UPDATE portfolio SET {$field} = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$value, $id]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('PORTFOLIO_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('PORTFOLIO_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updatePortfolioField');
        }
    }

    /**
     * Delete a portfolio item
     */
    public function deletePortfolio(int $id): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM portfolio WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('PORTFOLIO_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('PORTFOLIO_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deletePortfolio');
        }
    }

    /**
     * Get all team members for admin
     */
    public function getTeam(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT
                id, name, position, email, bio,
                image_url as photo_url, linkedin_url, twitter_url, github_url as website_url,
                skills, years_experience, featured, active, sort_order as order_position,
                created_at, updated_at
                FROM team
                ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $team = $stmt->fetchAll();

            $this->dataResponse($team, count($team));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getTeam');
        }
    }

    /**
     * Create new team member
     */
    public function createTeamMember(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name', 'position'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $name = $input['name'];
            $position = $input['position'];
            $email = $input['email'] ?? null;
            $bio = $input['bio'] ?? null;
            $photoUrl = $input['photo_url'] ?? null;
            $linkedinUrl = $input['linkedin_url'] ?? null;
            $twitterUrl = $input['twitter_url'] ?? null;
            $websiteUrl = $input['website_url'] ?? null;
            $skills = !empty($input['skills']) ? json_encode($input['skills']) : null;
            $yearsExperience = !empty($input['years_experience']) ? (int)$input['years_experience'] : null;
            $featured = isset($input['featured']) ? (int)$input['featured'] : 0;
            $active = isset($input['active']) ? (int)$input['active'] : 1;
            $sortOrder = isset($input['order_position']) ? (int)$input['order_position'] : 0;

            $stmt = $this->db->prepare("INSERT INTO team (
                name, position, email, bio, image_url, linkedin_url, twitter_url, github_url,
                skills, years_experience, featured, active, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            $stmt->execute([
                $name, $position, $email, $bio, $photoUrl, $linkedinUrl, $twitterUrl, $websiteUrl,
                $skills, $yearsExperience, $featured, $active, $sortOrder
            ]);

            $this->successResponse('TEAM_MEMBER_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createTeamMember');
        }
    }

    /**
     * Update existing team member
     */
    public function updateTeamMember(int $memberId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            // Check if team member exists
            $stmt = $this->db->prepare("SELECT id FROM team WHERE id = ?");
            $stmt->execute([$memberId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('TEAM_MEMBER_NOT_FOUND', 404);
                return;
            }

            $name = $input['name'];
            $position = $input['position'];
            $email = $input['email'] ?? null;
            $bio = $input['bio'] ?? null;
            $photoUrl = $input['photo_url'] ?? null;
            $linkedinUrl = $input['linkedin_url'] ?? null;
            $twitterUrl = $input['twitter_url'] ?? null;
            $websiteUrl = $input['website_url'] ?? null;
            $skills = !empty($input['skills']) ? json_encode($input['skills']) : null;
            $yearsExperience = !empty($input['years_experience']) ? (int)$input['years_experience'] : null;
            $featured = isset($input['featured']) ? (int)$input['featured'] : 0;
            $active = isset($input['active']) ? (int)$input['active'] : 1;
            $sortOrder = isset($input['order_position']) ? (int)$input['order_position'] : 0;

            $stmt = $this->db->prepare("UPDATE team SET
                name = ?, position = ?, email = ?, bio = ?, image_url = ?,
                linkedin_url = ?, twitter_url = ?, github_url = ?, skills = ?,
                years_experience = ?, featured = ?, active = ?, sort_order = ?,
                updated_at = NOW()
                WHERE id = ?");

            $stmt->execute([
                $name, $position, $email, $bio, $photoUrl, $linkedinUrl, $twitterUrl, $websiteUrl,
                $skills, $yearsExperience, $featured, $active, $sortOrder, $memberId
            ]);

            $this->successResponse('TEAM_MEMBER_UPDATED', ['id' => $memberId]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateTeamMember');
        }
    }

    /**
     * Delete team member
     */
    public function deleteTeamMember(int $memberId): void
    {
        try {
            // Check if team member exists
            $stmt = $this->db->prepare("SELECT id FROM team WHERE id = ?");
            $stmt->execute([$memberId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('TEAM_MEMBER_NOT_FOUND', 404);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM team WHERE id = ?");
            $stmt->execute([$memberId]);

            $this->successResponse('TEAM_MEMBER_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteTeamMember');
        }
    }

    /**
     * Update team member field (for status toggles)
     */
    public function updateTeamMemberField(int $memberId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Check if team member exists
            $stmt = $this->db->prepare("SELECT id FROM team WHERE id = ?");
            $stmt->execute([$memberId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('TEAM_MEMBER_NOT_FOUND', 404);
                return;
            }

            $fields = [];
            $params = [];

            // Allow updating specific fields
            $allowedFields = ['active', 'featured', 'sort_order'];
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $dbField = $field === 'sort_order' ? 'sort_order' : $field;
                    $fields[] = "$dbField = ?";
                    $params[] = $input[$field];
                }
            }

            if (empty($fields)) {
                $this->errorResponse('NO_FIELDS_TO_UPDATE', 400);
                return;
            }

            $params[] = $memberId;
            $sql = "UPDATE team SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $this->successResponse('TEAM_MEMBER_UPDATED', ['id' => $memberId]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateTeamMemberField');
        }
    }

    /**
     * Get all announcements for admin
     */
    public function getAnnouncements(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT
                id, title, content, type, priority,
                active as is_active, expires_at, created_by,
                created_at, updated_at
                FROM announcements
                ORDER BY created_at DESC");
            $stmt->execute();
            $announcements = $stmt->fetchAll();

            $this->dataResponse($announcements, count($announcements));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnnouncements');
        }
    }

    /**
     * Create new announcement
     */
    public function createAnnouncement(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'content'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $title = $input['title'];
            $content = $input['content'];
            $type = $input['type'] ?? 'general';
            $priority = $input['priority'] ?? 'normal';
            $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;
            $expiresAt = !empty($input['expires_at']) ? $input['expires_at'] : null;

            $stmt = $this->db->prepare("INSERT INTO announcements (title, content, type, priority, active, expires_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $content, $type, $priority, $isActive, $expiresAt]);

            $this->successResponse('ANNOUNCEMENT_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createAnnouncement');
        }
    }

    /**
     * Update existing announcement
     */
    public function updateAnnouncement(int $announcementId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'content'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            // Check if announcement exists
            $stmt = $this->db->prepare("SELECT id FROM announcements WHERE id = ?");
            $stmt->execute([$announcementId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('ANNOUNCEMENT_NOT_FOUND', 404);
                return;
            }

            $title = $input['title'];
            $content = $input['content'];
            $type = $input['type'] ?? 'general';
            $priority = $input['priority'] ?? 'normal';
            $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;
            $expiresAt = !empty($input['expires_at']) ? $input['expires_at'] : null;

            $stmt = $this->db->prepare("UPDATE announcements SET
                title = ?, content = ?, type = ?, priority = ?,
                active = ?, expires_at = ?, updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([$title, $content, $type, $priority, $isActive, $expiresAt, $announcementId]);

            $this->successResponse('ANNOUNCEMENT_UPDATED', ['id' => $announcementId]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateAnnouncement');
        }
    }

    /**
     * Delete announcement
     */
    public function deleteAnnouncement(int $announcementId): void
    {
        try {
            // Check if announcement exists
            $stmt = $this->db->prepare("SELECT id FROM announcements WHERE id = ?");
            $stmt->execute([$announcementId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('ANNOUNCEMENT_NOT_FOUND', 404);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM announcements WHERE id = ?");
            $stmt->execute([$announcementId]);

            $this->successResponse('ANNOUNCEMENT_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteAnnouncement');
        }
    }

    /**
     * Toggle announcement visibility
     */
    public function toggleAnnouncement(int $announcementId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Check if announcement exists
            $stmt = $this->db->prepare("SELECT id, active FROM announcements WHERE id = ?");
            $stmt->execute([$announcementId]);
            $announcement = $stmt->fetch();

            if (!$announcement) {
                $this->errorResponse('ANNOUNCEMENT_NOT_FOUND', 404);
                return;
            }

            $newStatus = isset($input['is_active']) ? (int)$input['is_active'] : ($announcement['active'] ? 0 : 1);

            $stmt = $this->db->prepare("UPDATE announcements SET active = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newStatus, $announcementId]);

            $this->successResponse('ANNOUNCEMENT_UPDATED', ['id' => $announcementId, 'is_active' => $newStatus]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'toggleAnnouncement');
        }
    }

    /**
     * Get all content for admin
     */
    public function getContent(): void
    {
        try {
            // Check if content table exists
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'content'");
            $stmt->execute();


            $stmt = $this->db->prepare("SELECT * FROM content ORDER BY created_at DESC");
            $stmt->execute();
            $content = $stmt->fetchAll();

            $this->dataResponse($content, count($content));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContent');
        }
    }

    /**
     * Create new content
     */
    public function createContent(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['title', 'content'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            // Map input fields to actual database schema
            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace([' ', '&', '?', '!'], ['-', 'and', '', ''], preg_replace('/[^A-Za-z0-9\s]/', '', $title)));
            $content = $input['content'];
            $excerpt = $input['excerpt'] ?? '';
            $contentType = $input['content_type'] ?? $this->getAppConfig('content', 'default_content_type', 'blog');
            $category = $input['category'] ?? '';
            $published = isset($input['published']) ? (int)$input['published'] : $this->getAppConfig('content', 'default_published', 1);
            $featured = isset($input['featured']) ? (int)$input['featured'] : $this->getAppConfig('content', 'default_featured', 0);
            $author = $input['author'] ?? '';
            $featuredImage = $input['featured_image'] ?? '';
            $gallery = isset($input['gallery']) && !empty($input['gallery'])
                ? (is_string($input['gallery']) && strpos($input['gallery'], ',') !== false
                    ? json_encode(array_map('trim', explode(',', $input['gallery'])))
                    : (is_array($input['gallery']) ? json_encode($input['gallery']) : $input['gallery']))
                : null;
            $tags = is_array($input['tags']) ? json_encode($input['tags']) : ($input['tags'] ?? null);
            $metaTitle = $input['meta_title'] ?? '';
            $metaDescription = $input['meta_description'] ?? '';
            $views = $input['views'] ?? $this->getAppConfig('content', 'default_views', 0);
            $commentCount = $input['comment_count'] ?? $this->getAppConfig('content', 'default_comment_count', 0);
            $likeCount = $input['like_count'] ?? $this->getAppConfig('content', 'default_like_count', 0);

            $stmt = $this->db->prepare("
                INSERT INTO content (
                    title, slug, content_type, content, excerpt, published, category,
                    featured_image, gallery, author, tags, meta_description, views,
                    comment_count, like_count, meta_title, featured, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $title, $slug, $contentType, $content, $excerpt, $published, $category,
                $featuredImage, $gallery, $author, $tags, $metaDescription, $views,
                $commentCount, $likeCount, $metaTitle, $featured
            ]);

            $this->successResponse('CONTENT_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createContent');
        }
    }

    /**
     * Update existing content
     */
    public function updateContent(int $contentId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            // Get current content data
            $currentStmt = $this->db->prepare("SELECT * FROM content WHERE id = ?");
            $currentStmt->execute([$contentId]);
            $currentContent = $currentStmt->fetch();

            if (!$currentContent) {
                $this->errorResponse('CONTENT_NOT_FOUND', 404);
                return;
            }

            // Map input fields to actual database schema
            $title = $input['title'] ?? $currentContent['title'];
            $slug = $input['slug'] ?? $currentContent['slug'];
            if ($title !== $currentContent['title'] && empty($input['slug'])) {
                $slug = strtolower(str_replace([' ', '&', '?', '!'], ['-', 'and', '', ''], preg_replace('/[^A-Za-z0-9\s]/', '', $title)));
            }
            $content = $input['content'] ?? $currentContent['content'];
            $excerpt = $input['excerpt'] ?? $currentContent['excerpt'];
            $contentType = $input['content_type'] ?? $currentContent['content_type'];
            $category = $input['category'] ?? $currentContent['category'];
            $published = isset($input['published']) ? (int)$input['published'] : $currentContent['published'];
            $featured = isset($input['featured']) ? (int)$input['featured'] : $currentContent['featured'];
            $author = $input['author'] ?? $currentContent['author'];
            $featuredImage = $input['featured_image'] ?? $currentContent['featured_image'];
            $gallery = isset($input['gallery']) && !empty($input['gallery'])
                ? (is_string($input['gallery']) && strpos($input['gallery'], ',') !== false
                    ? json_encode(array_map('trim', explode(',', $input['gallery'])))
                    : (is_array($input['gallery']) ? json_encode($input['gallery']) : $input['gallery']))
                : $currentContent['gallery'];
            $tags = isset($input['tags']) ? (is_array($input['tags']) ? json_encode($input['tags']) : $input['tags']) : $currentContent['tags'];
            $metaTitle = $input['meta_title'] ?? $currentContent['meta_title'];
            $metaDescription = $input['meta_description'] ?? $currentContent['meta_description'];
            $views = $input['views'] ?? $currentContent['views'];
            $commentCount = $input['comment_count'] ?? $currentContent['comment_count'];
            $likeCount = $input['like_count'] ?? $currentContent['like_count'];

            $stmt = $this->db->prepare("
                UPDATE content SET
                    title = ?, slug = ?, content_type = ?, content = ?, excerpt = ?, published = ?, category = ?,
                    featured_image = ?, gallery = ?, author = ?, tags = ?, meta_description = ?, views = ?,
                    comment_count = ?, like_count = ?, meta_title = ?, featured = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $title, $slug, $contentType, $content, $excerpt, $published, $category,
                $featuredImage, $gallery, $author, $tags, $metaDescription, $views,
                $commentCount, $likeCount, $metaTitle, $featured, $contentId
            ]);

            $this->successResponse('CONTENT_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateContent');
        }
    }

    /**
     * Delete content
     */
    public function deleteContent(int $contentId): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM content WHERE id = ?");
            $stmt->execute([$contentId]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('CONTENT_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('CONTENT_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteContent');
        }
    }

    /**
     * Get individual job for admin
     */
    public function getJob(int $jobId): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jobs WHERE id = ?");
            $stmt->execute([$jobId]);
            $job = $stmt->fetch();

            if (!$job) {
                $this->errorResponse('JOB_NOT_FOUND', 404);
                return;
            }

            $this->dataResponse($job);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJob');
        }
    }

    /**
     * Get job categories for admin
     */
    public function getJobCategories(): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    jc.id,
                    jc.name,
                    jc.slug,
                    jc.description,
                    jc.active,
                    jc.sort_order,
                    COUNT(j.id) as count
                FROM job_categories jc
                LEFT JOIN jobs j ON jc.name = j.department OR jc.slug = j.department
                WHERE jc.active = 1
                GROUP BY jc.id, jc.name, jc.slug, jc.description, jc.active, jc.sort_order
                ORDER BY jc.sort_order ASC, jc.name ASC
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            // Format the response
            $formattedCategories = array_map(function($category) {
                return [
                    'id' => (int)$category['id'],
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'description' => $category['description'],
                    'count' => (int)$category['count'],
                    'active' => (bool)$category['active']
                ];
            }, $categories);

            $this->jsonResponse([
                'success' => true,
                'data' => $formattedCategories,
                'total' => count($formattedCategories)
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobCategories');
        }
    }

    /**
     * Get job statistics for admin
     */
    public function getJobStats(): void
    {
        try {
            // Get overview statistics
            $overviewStmt = $this->db->prepare("
                SELECT
                    COUNT(id) as total_jobs,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
                    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_jobs,
                    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_jobs,
                    SUM(applications_count) as total_applications,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as jobs_posted_this_month
                FROM jobs
            ");
            $overviewStmt->execute();
            $overview = $overviewStmt->fetch();

            // Get category statistics
            $categoryStmt = $this->db->prepare("
                SELECT
                    department as category,
                    COUNT(id) as jobs,
                    SUM(applications_count) as applications,
                    CONCAT('$', FORMAT(AVG((salary_min + salary_max) / 2), 0)) as avg_salary
                FROM jobs
                WHERE department IS NOT NULL AND department != ''
                GROUP BY department
                ORDER BY jobs DESC
                LIMIT 5
            ");
            $categoryStmt->execute();
            $categories = $categoryStmt->fetchAll();

            // Get monthly trends (last 6 months)
            $monthlyStmt = $this->db->prepare("
                SELECT
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(id) as jobs_posted,
                    SUM(applications_count) as applications
                FROM jobs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month
            ");
            $monthlyStmt->execute();
            $monthlyTrends = $monthlyStmt->fetchAll();

            // Get by location
            $locationStmt = $this->db->prepare("
                SELECT
                    location,
                    COUNT(id) as jobs,
                    SUM(applications_count) as applications
                FROM jobs
                WHERE location IS NOT NULL AND location != ''
                GROUP BY location
                ORDER BY jobs DESC
                LIMIT 5
            ");
            $locationStmt->execute();
            $locations = $locationStmt->fetchAll();

            // Get by job type
            $typeStmt = $this->db->prepare("
                SELECT
                    type,
                    COUNT(id) as count,
                    ROUND(COUNT(id) * 100.0 / (SELECT COUNT(*) FROM jobs), 1) as percentage
                FROM jobs
                WHERE type IS NOT NULL AND type != ''
                GROUP BY type
                ORDER BY count DESC
            ");
            $typeStmt->execute();
            $types = $typeStmt->fetchAll();

            // Get recent activity (latest 5)
            $activityStmt = $this->db->prepare("
                SELECT
                    title,
                    created_at,
                    'Job posted' as action
                FROM jobs
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $activityStmt->execute();
            $activities = $activityStmt->fetchAll();

            $stats = [
                'overview' => [
                    'total_jobs' => (int)$overview['total_jobs'],
                    'active_jobs' => (int)$overview['active_jobs'],
                    'draft_jobs' => (int)$overview['draft_jobs'],
                    'archived_jobs' => (int)$overview['archived_jobs'],
                    'total_applications' => (int)$overview['total_applications'],
                    'pending_applications' => 0, // Would need job_applications table
                    'reviewed_applications' => 0, // Would need job_applications table
                    'average_applications_per_job' => $overview['total_jobs'] > 0 ? round($overview['total_applications'] / $overview['total_jobs'], 1) : 0,
                    'jobs_posted_this_month' => (int)$overview['jobs_posted_this_month'],
                    'applications_this_month' => 0 // Would need job_applications table
                ],
                'by_category' => array_map(function($cat) {
                    return [
                        'category' => $cat['category'],
                        'jobs' => (int)$cat['jobs'],
                        'applications' => (int)$cat['applications'],
                        'avg_salary' => $cat['avg_salary']
                    ];
                }, $categories),
                'monthly_trends' => array_map(function($trend) {
                    return [
                        'month' => $trend['month'],
                        'jobs_posted' => (int)$trend['jobs_posted'],
                        'applications' => (int)$trend['applications']
                    ];
                }, $monthlyTrends),
                'by_location' => array_map(function($location) {
                    return [
                        'location' => $location['location'],
                        'jobs' => (int)$location['jobs'],
                        'applications' => (int)$location['applications']
                    ];
                }, $locations),
                'by_type' => array_map(function($type) {
                    return [
                        'type' => ucwords($type['type']),
                        'count' => (int)$type['count'],
                        'percentage' => (float)$type['percentage']
                    ];
                }, $types),
                'recent_activity' => array_map(function($activity) {
                    $timeAgo = $this->timeAgo($activity['created_at']);
                    return [
                        'action' => $activity['action'],
                        'job_title' => $activity['title'],
                        'time' => $timeAgo
                    ];
                }, $activities)
            ];

            $this->jsonResponse([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobStats');
        }
    }

    /**
     * Helper method to calculate time ago
     */
    private function timeAgo($datetime) {
        $time = strtotime($datetime);
        $now = time();
        $diff = $now - $time;

        if ($diff < 60) return $diff . ' seconds ago';
        if ($diff < 3600) return floor($diff / 60) . ' minutes ago';
        if ($diff < 86400) return floor($diff / 3600) . ' hours ago';
        if ($diff < 2592000) return floor($diff / 86400) . ' days ago';
        return floor($diff / 2592000) . ' months ago';
    }

    // =============================================
    // REGIONS MANAGEMENT
    // =============================================

    /**
     * Create a new region
     */
    public function createRegion(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name', 'code', 'type'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                INSERT INTO regions (name, slug, code, type, description, active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['code'],
                $input['type'],
                $input['description'] ?? '',
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0)
            ]);

            $this->successResponse('REGION_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createRegion');
        }
    }

    /**
     * Update a region
     */
    public function updateRegion(int $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name', 'code', 'type'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                UPDATE regions SET
                name = ?, slug = ?, code = ?, type = ?, description = ?,
                active = ?, sort_order = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['code'],
                $input['type'],
                $input['description'] ?? '',
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0),
                $id
            ]);

            $this->successResponse('REGION_UPDATED', ['id' => $id]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateRegion');
        }
    }

    /**
     * Delete a region
     */
    public function deleteRegion(int $id): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM regions WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('REGION_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('REGION_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteRegion');
        }
    }

    // =============================================
    // EDUCATION LEVELS MANAGEMENT
    // =============================================

    /**
     * Create a new education level
     */
    public function createEducationLevel(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name', 'order_level'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                INSERT INTO education_levels (name, slug, description, order_level, active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                (int)$input['order_level'],
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0)
            ]);

            $this->successResponse('EDUCATION_LEVEL_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createEducationLevel');
        }
    }

    /**
     * Update an education level
     */
    public function updateEducationLevel(int $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name', 'order_level'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                UPDATE education_levels SET
                name = ?, slug = ?, description = ?, order_level = ?,
                active = ?, sort_order = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                (int)$input['order_level'],
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0),
                $id
            ]);

            $this->successResponse('EDUCATION_LEVEL_UPDATED', ['id' => $id]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateEducationLevel');
        }
    }

    /**
     * Delete an education level
     */
    public function deleteEducationLevel(int $id): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM education_levels WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('EDUCATION_LEVEL_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('EDUCATION_LEVEL_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteEducationLevel');
        }
    }

    // =============================================
    // JOB CATEGORIES MANAGEMENT
    // =============================================

    /**
     * Create a new job category
     */
    public function createJobCategory(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                INSERT INTO job_categories (name, slug, description, active, sort_order)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0)
            ]);

            $this->successResponse('JOB_CATEGORY_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createJobCategory');
        }
    }

    /**
     * Update a job category
     */
    public function updateJobCategory(int $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $input['name']));

            $stmt = $this->db->prepare("
                UPDATE job_categories SET
                name = ?, slug = ?, description = ?, active = ?,
                sort_order = ?, updated_at = NOW()
                WHERE id = ?
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                isset($input['active']) ? (int)$input['active'] : 1,
                (int)($input['sort_order'] ?? 0),
                $id
            ]);

            $this->successResponse('JOB_CATEGORY_UPDATED', ['id' => $id]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateJobCategory');
        }
    }

    /**
     * Delete a job category
     */
    public function deleteJobCategory(int $id): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM job_categories WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('JOB_CATEGORY_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('JOB_CATEGORY_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteJobCategory');
        }
    }

    /**
     * Get individual scholarship for admin
     */
    public function getScholarship(int $scholarshipId): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM scholarships WHERE id = ?");
            $stmt->execute([$scholarshipId]);
            $scholarship = $stmt->fetch();

            if (!$scholarship) {
                $this->errorResponse('SCHOLARSHIP_NOT_FOUND', 404);
                return;
            }

            $this->dataResponse($scholarship);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarship');
        }
    }

    /**
     * Get scholarship categories for admin
     */
    public function getScholarshipCategories(): void
    {
        try {
            // Get categories from database with scholarship counts
            $stmt = $this->db->prepare("
                SELECT
                    sc.id,
                    sc.name,
                    LOWER(REPLACE(sc.name, ' ', '-')) as slug,
                    sc.description,
                    sc.active,
                    COUNT(s.id) as count,
                    COALESCE(SUM(CAST(REPLACE(s.amount, '$', '') AS DECIMAL(10,2))), 0) as total_amount
                FROM scholarship_categories sc
                LEFT JOIN scholarships s ON sc.name = s.category
                GROUP BY sc.id, sc.name, sc.description, sc.active
                ORDER BY sc.name
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            // Format the response
            $formattedCategories = array_map(function($cat) {
                return [
                    'id' => (int)$cat['id'],
                    'name' => $cat['name'],
                    'slug' => $cat['slug'],
                    'description' => $cat['description'],
                    'count' => (int)$cat['count'],
                    'total_amount' => (float)$cat['total_amount'],
                    'active' => (bool)$cat['active']
                ];
            }, $categories);

            $this->dataResponse($formattedCategories, count($formattedCategories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipCategories');
        }
    }

    /**
     * Get scholarship statistics for admin
     */
    public function getScholarshipStats(): void
    {
        try {
            // Get overview statistics from database
            $overviewStmt = $this->db->prepare("
                SELECT
                    COUNT(id) as total_scholarships,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_scholarships,
                    SUM(applications_count) as total_applications,
                    COALESCE(SUM(CAST(REPLACE(amount, '$', '') AS DECIMAL(10,2))), 0) as total_awarded_amount
                FROM scholarships
            ");
            $overviewStmt->execute();
            $overview = $overviewStmt->fetch();

            // Get category statistics
            $categoryStmt = $this->db->prepare("
                SELECT
                    category,
                    COUNT(id) as scholarships,
                    SUM(applications_count) as applications,
                    COALESCE(SUM(CAST(REPLACE(amount, '$', '') AS DECIMAL(10,2))), 0) as total_amount
                FROM scholarships
                GROUP BY category
                ORDER BY scholarships DESC
            ");
            $categoryStmt->execute();
            $categories = $categoryStmt->fetchAll();

            // Get monthly trends (last 6 months)
            $monthlyStmt = $this->db->prepare("
                SELECT
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(id) as scholarships,
                    SUM(applications_count) as applications,
                    COALESCE(SUM(CAST(REPLACE(amount, '$', '') AS DECIMAL(10,2))), 0) as amount
                FROM scholarships
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month
            ");
            $monthlyStmt->execute();
            $monthlyTrends = $monthlyStmt->fetchAll();

            // Get by education level
            $educationStmt = $this->db->prepare("
                SELECT
                    education_level,
                    COUNT(id) as count
                FROM scholarships
                GROUP BY education_level
                ORDER BY count DESC
            ");
            $educationStmt->execute();
            $educationLevels = $educationStmt->fetchAll();

            // Get by region/country
            $regionStmt = $this->db->prepare("
                SELECT
                    region as country,
                    COUNT(id) as count
                FROM scholarships
                GROUP BY region
                ORDER BY count DESC
                LIMIT 5
            ");
            $regionStmt->execute();
            $regions = $regionStmt->fetchAll();

            $stats = [
                'overview' => [
                    'total_scholarships' => (int)$overview['total_scholarships'],
                    'active_scholarships' => (int)$overview['active_scholarships'],
                    'total_applications' => (int)$overview['total_applications'],
                    'pending_applications' => 0, // Would need additional logic to calculate
                    'approved_applications' => 0, // Would need additional logic to calculate
                    'rejected_applications' => 0, // Would need additional logic to calculate
                    'total_awarded_amount' => (float)$overview['total_awarded_amount'],
                    'average_award_amount' => $overview['total_scholarships'] > 0 ? round($overview['total_awarded_amount'] / $overview['total_scholarships']) : 0,
                    'application_success_rate' => 0 // Would need additional logic to calculate
                ],
                'by_category' => array_map(function($cat) {
                    return [
                        'category' => $cat['category'],
                        'scholarships' => (int)$cat['scholarships'],
                        'applications' => (int)$cat['applications'],
                        'awarded' => 0, // Would need additional logic
                        'total_amount' => (float)$cat['total_amount']
                    ];
                }, $categories),
                'monthly_trends' => array_map(function($trend) {
                    return [
                        'month' => $trend['month'],
                        'applications' => (int)$trend['applications'],
                        'awarded' => 0, // Would need additional logic
                        'amount' => (float)$trend['amount']
                    ];
                }, $monthlyTrends),
                // Legacy format for backward compatibility
                'total' => (int)$overview['total_scholarships'],
                'active' => (int)$overview['active_scholarships'],
                'inactive' => (int)$overview['total_scholarships'] - (int)$overview['active_scholarships'],
                'by_country' => array_map(function($region) {
                    return [
                        'country' => $region['country'],
                        'count' => (int)$region['count']
                    ];
                }, $regions),
                'by_education_level' => array_map(function($edu) {
                    return [
                        'education_level' => $edu['education_level'],
                        'count' => (int)$edu['count']
                    ];
                }, $educationLevels),
                'recent_applications' => 0 // Would need additional logic
            ];

            $this->dataResponse($stats);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipStats');
        }
    }

    /**
     * Get scholarship education levels
     */
    public function getScholarshipEducationLevels(): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT id, name, slug, description, order_level, active, sort_order
                FROM education_levels
                WHERE active = 1
                ORDER BY order_level ASC, sort_order ASC, name ASC
            ");
            $stmt->execute();
            $levels = $stmt->fetchAll();

            // Format the response
            $formattedLevels = array_map(function($level) {
                return [
                    'id' => (int)$level['id'],
                    'name' => $level['name'],
                    'slug' => $level['slug'],
                    'description' => $level['description'],
                    'order_level' => (int)$level['order_level'],
                    'active' => (bool)$level['active']
                ];
            }, $levels);

            $this->jsonResponse([
                'success' => true,
                'data' => $formattedLevels,
                'total' => count($formattedLevels)
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipEducationLevels');
        }
    }

    /**
     * Get scholarship regions
     */
    public function getScholarshipRegions(): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT id, name, slug, code, type, description, active, sort_order
                FROM regions
                WHERE active = 1
                ORDER BY sort_order ASC, name ASC
            ");
            $stmt->execute();
            $regions = $stmt->fetchAll();

            // Format the response
            $formattedRegions = array_map(function($region) {
                return [
                    'id' => (int)$region['id'],
                    'name' => $region['name'],
                    'slug' => $region['slug'],
                    'code' => $region['code'],
                    'type' => $region['type'],
                    'description' => $region['description'],
                    'active' => (bool)$region['active']
                ];
            }, $regions);

            $this->jsonResponse([
                'success' => true,
                'data' => $formattedRegions,
                'total' => count($formattedRegions)
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipRegions');
        }
    }

    /**
     * Create a new scholarship
     */
    public function createScholarship(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (empty($input['title'])) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Title is required'
                ], 400);
                return;
            }

            $scholarship = [
                'id' => rand(1000, 9999),
                'title' => $input['title'] ?? '',
                'slug' => $input['slug'] ?? strtolower(str_replace(' ', '-', $input['title'])),
                'short_description' => $input['short_description'] ?? '',
                'full_description' => $input['full_description'] ?? '',
                'content' => $input['content'] ?? '',
                'provider' => $input['provider'] ?? '',
                'provider_logo' => $input['provider_logo'] ?? '',
                'website_url' => $input['website_url'] ?? '',
                'application_url' => $input['application_url'] ?? '',
                'application_deadline' => $input['application_deadline'] ?? null,
                'program_start_date' => $input['program_start_date'] ?? null,
                'program_end_date' => $input['program_end_date'] ?? null,
                'notification_date' => $input['notification_date'] ?? null,
                'category_id' => $input['category_id'] ?? 1,
                'education_level_id' => $input['education_level_id'] ?? 1,
                'funding_amount' => $input['funding_amount'] ?? '',
                'currency' => $input['currency'] ?? 'USD',
                'funding_type_id' => $input['funding_type_id'] ?? 1,
                'covers_tuition' => $input['covers_tuition'] ?? false,
                'covers_living' => $input['covers_living'] ?? false,
                'covers_travel' => $input['covers_travel'] ?? false,
                'regions' => $input['regions'] ?? '',
                'min_age' => $input['min_age'] ?? null,
                'max_age' => $input['max_age'] ?? null,
                'gpa_requirement' => $input['gpa_requirement'] ?? null,
                'language_requirements' => $input['language_requirements'] ?? '',
                'other_requirements' => $input['other_requirements'] ?? '',
                'meta_title' => $input['meta_title'] ?? '',
                'meta_description' => $input['meta_description'] ?? '',
                'status' => $input['status'] ?? 'draft',
                'featured' => $input['featured'] ?? false,
                'verified' => $input['verified'] ?? false,
                'study_fields' => $input['study_fields'] ?? '[]',
                'tags' => $input['tags'] ?? '[]',
                'published_at' => $input['published_at'] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->jsonResponse([
                'success' => true,
                'data' => $scholarship,
                'message' => 'Scholarship created successfully'
            ]);

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createScholarship');
        }
    }

    /**
     * Update an existing scholarship
     */
    public function updateScholarship(): void
    {
        try {
            $scholarshipId = $this->getRouteParam('id');
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$scholarshipId) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Scholarship ID is required'
                ], 400);
                return;
            }

            // Validate required fields
            if (empty($input['title'])) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Title is required'
                ], 400);
                return;
            }

            $scholarship = [
                'id' => $scholarshipId,
                'title' => $input['title'] ?? '',
                'slug' => $input['slug'] ?? strtolower(str_replace(' ', '-', $input['title'])),
                'short_description' => $input['short_description'] ?? '',
                'full_description' => $input['full_description'] ?? '',
                'content' => $input['content'] ?? '',
                'provider' => $input['provider'] ?? '',
                'provider_logo' => $input['provider_logo'] ?? '',
                'website_url' => $input['website_url'] ?? '',
                'application_url' => $input['application_url'] ?? '',
                'application_deadline' => $input['application_deadline'] ?? null,
                'program_start_date' => $input['program_start_date'] ?? null,
                'program_end_date' => $input['program_end_date'] ?? null,
                'notification_date' => $input['notification_date'] ?? null,
                'category_id' => $input['category_id'] ?? 1,
                'education_level_id' => $input['education_level_id'] ?? 1,
                'funding_amount' => $input['funding_amount'] ?? '',
                'currency' => $input['currency'] ?? 'USD',
                'funding_type_id' => $input['funding_type_id'] ?? 1,
                'covers_tuition' => $input['covers_tuition'] ?? false,
                'covers_living' => $input['covers_living'] ?? false,
                'covers_travel' => $input['covers_travel'] ?? false,
                'regions' => $input['regions'] ?? '',
                'min_age' => $input['min_age'] ?? null,
                'max_age' => $input['max_age'] ?? null,
                'gpa_requirement' => $input['gpa_requirement'] ?? null,
                'language_requirements' => $input['language_requirements'] ?? '',
                'other_requirements' => $input['other_requirements'] ?? '',
                'meta_title' => $input['meta_title'] ?? '',
                'meta_description' => $input['meta_description'] ?? '',
                'status' => $input['status'] ?? 'draft',
                'featured' => $input['featured'] ?? false,
                'verified' => $input['verified'] ?? false,
                'study_fields' => $input['study_fields'] ?? '[]',
                'tags' => $input['tags'] ?? '[]',
                'published_at' => $input['published_at'] ?? null,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->jsonResponse([
                'success' => true,
                'data' => $scholarship,
                'message' => 'Scholarship updated successfully'
            ]);

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateScholarship');
        }
    }

    /**
     * Delete a scholarship
     */
    public function deleteScholarship(int $scholarshipId): void
    {
        try {
            if (!$scholarshipId || $scholarshipId <= 0) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Valid scholarship ID is required'
                ], 400);
                return;
            }

            // Check if database connection is available
            if (!$this->db) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Database connection not available'
                ], 500);
                return;
            }

            // Check if scholarship exists
            $stmt = $this->db->prepare("SELECT id, title FROM scholarships WHERE id = ? AND status != 'deleted'");
            $stmt->execute([$scholarshipId]);
            $scholarship = $stmt->fetch();

            if (!$scholarship) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Scholarship not found or already deleted'
                ], 404);
                return;
            }

            // Soft delete - update status to 'deleted' instead of actually deleting
            $deleteStmt = $this->db->prepare("UPDATE scholarships SET status = 'deleted', updated_at = NOW() WHERE id = ?");
            $result = $deleteStmt->execute([$scholarshipId]);

            if (!$result) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Failed to update scholarship status'
                ], 500);
                return;
            }

            // Log the deletion for audit purposes
            error_log("Scholarship deleted successfully: ID={$scholarshipId}, Title='{$scholarship['title']}'");

            $this->jsonResponse([
                'success' => true,
                'message' => 'Scholarship deleted successfully',
                'data' => [
                    'id' => $scholarshipId,
                    'title' => $scholarship['title']
                ]
            ]);

        } catch (Exception $e) {
            error_log("Delete scholarship error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());

            $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to delete scholarship',
                'error' => $e->getMessage(),
                'debug' => [
                    'scholarship_id' => $scholarshipId,
                    'error_type' => get_class($e)
                ]
            ], 500);
        }
    }

    /**
     * Get all organizations for admin
     */
    public function getOrganizations(): void
    {
        try {
            // Check if organizations table exists, create it if not
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'organizations'");
            $stmt->execute();


            $stmt = $this->db->prepare("SELECT * FROM organizations ORDER BY featured DESC, created_at DESC");
            $stmt->execute();
            $organizations = $stmt->fetchAll();

            $this->dataResponse($organizations, count($organizations));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getOrganizations');
        }
    }

    /**
     * Create new organization
     */
    public function createOrganization(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            if (!$this->validateRequired($input, ['name'])) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $name = $input['name'];
            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $name));
            $description = $input['description'] ?? '';
            $logo = $input['logo'] ?? '';
            $website = $input['website'] ?? '';
            $email = $input['email'] ?? '';
            $phone = $input['phone'] ?? '';
            $address = $input['address'] ?? '';
            $city = $input['city'] ?? '';
            $country = $input['country'] ?? '';
            $industry = $input['industry'] ?? '';
            $size = $input['size'] ?? '';
            $foundedYear = $input['founded_year'] ?? null;
            $status = $input['status'] ?? 'active';
            $featured = isset($input['featured']) ? (int)$input['featured'] : 0;
            $verificationStatus = $input['verification_status'] ?? 'pending';

            $stmt = $this->db->prepare("INSERT INTO organizations (name, slug, description, logo, website, email, phone, address, city, country, industry, size, founded_year, status, featured, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $slug, $description, $logo, $website, $email, $phone, $address, $city, $country, $industry, $size, $foundedYear, $status, $featured, $verificationStatus]);

            $this->successResponse('ORGANIZATION_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createOrganization');
        }
    }

    /**
     * Update organization
     */
    public function updateOrganization(int $organizationId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $input = $this->sanitizeInput($input);

            // Get current organization data
            $currentStmt = $this->db->prepare("SELECT * FROM organizations WHERE id = ?");
            $currentStmt->execute([$organizationId]);
            $currentOrg = $currentStmt->fetch();

            if (!$currentOrg) {
                $this->errorResponse('ORGANIZATION_NOT_FOUND', 404);
                return;
            }

            $name = $input['name'] ?? $currentOrg['name'];
            $slug = $input['slug'] ?? $currentOrg['slug'];
            $description = $input['description'] ?? $currentOrg['description'];
            $logo = $input['logo'] ?? $currentOrg['logo'];
            $website = $input['website'] ?? $currentOrg['website'];
            $email = $input['email'] ?? $currentOrg['email'];
            $phone = $input['phone'] ?? $currentOrg['phone'];
            $address = $input['address'] ?? $currentOrg['address'];
            $city = $input['city'] ?? $currentOrg['city'];
            $country = $input['country'] ?? $currentOrg['country'];
            $industry = $input['industry'] ?? $currentOrg['industry'];
            $size = $input['size'] ?? $currentOrg['size'];
            $foundedYear = $input['founded_year'] ?? $currentOrg['founded_year'];
            $status = $input['status'] ?? $currentOrg['status'];
            $featured = isset($input['featured']) ? (int)$input['featured'] : $currentOrg['featured'];
            $verificationStatus = $input['verification_status'] ?? $currentOrg['verification_status'];

            $stmt = $this->db->prepare("UPDATE organizations SET name = ?, slug = ?, description = ?, logo = ?, website = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, industry = ?, size = ?, founded_year = ?, status = ?, featured = ?, verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$name, $slug, $description, $logo, $website, $email, $phone, $address, $city, $country, $industry, $size, $foundedYear, $status, $featured, $verificationStatus, $organizationId]);

            $this->successResponse('ORGANIZATION_UPDATED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateOrganization');
        }
    }

    /**
     * Delete organization
     */
    public function deleteOrganization(int $organizationId): void
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM organizations WHERE id = ?");
            $stmt->execute([$organizationId]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('ORGANIZATION_NOT_FOUND', 404);
                return;
            }

            $this->successResponse('ORGANIZATION_DELETED');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteOrganization');
        }
    }

    /**
     * Get individual organization for admin
     */
    public function getOrganization(int $organizationId): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM organizations WHERE id = ?");
            $stmt->execute([$organizationId]);
            $organization = $stmt->fetch();

            if (!$organization) {
                $this->errorResponse('ORGANIZATION_NOT_FOUND', 404);
                return;
            }

            $this->dataResponse($organization);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getOrganization');
        }
    }

    /**
     * Get admin settings
     */
    public function getSettings(): void
    {
        try {
            // Get settings from multiple tables and organize them
            $response = [
                'success' => true,
                'settings' => []
            ];


            // First, check what columns actually exist in the settings table
            $columns = $this->getTableColumns('settings');
            error_log("Available columns in settings table: " . json_encode($columns));

            // Build query based on available columns
            if (in_array('category', $columns) && in_array('name', $columns) && in_array('value', $columns)) {
                // Production structure: category, name, value
                $stmt = $this->db->prepare("SELECT category, name, value FROM settings ORDER BY category, name");
            } else {
                // Fallback: use whatever columns exist
                $availableColumns = array_intersect(['id', 'category', 'name', 'value', 'setting_key', 'setting_value'], $columns);
                if (empty($availableColumns)) {
                    $availableColumns = ['*'];
                }
                $columnList = implode(', ', $availableColumns);
                $stmt = $this->db->prepare("SELECT {$columnList} FROM settings ORDER BY id");
            }
            $stmt->execute();
            $allSettings = $stmt->fetchAll();

            // Organize settings by categories that the frontend expects
            $organized = [
                'general' => [],
                'site' => [],
                'analytics' => [],
                'email' => [],
                'security' => [],
                'branding' => [],
                'company' => [],
                'seo' => [],
                'social_media' => []
            ];

            // Process each setting from database
            foreach ($allSettings as $setting) {
                $category = isset($setting['category']) ? $setting['category'] : 'general';
                $name = isset($setting['name']) ? $setting['name'] : $setting['setting_key'];
                $value = isset($setting['value']) ? $setting['value'] : $setting['setting_value'];

                $formattedSetting = [
                    'key' => $name,
                    'value' => $value,
                    'label' => $this->generateLabel($name),
                    'type' => $this->determineSettingType($name, $value),
                    'description' => $this->generateDescription($name)
                ];

                if (isset($organized[$category])) {
                    $organized[$category][] = $formattedSetting;
                }
            }

            // Add default settings for empty categories
            $this->addMissingSettings($organized);

            $response['settings'] = $organized;

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getSettings');
        }
    }

    /**
     * Get about information for admin
     */
    public function getAbout(): void
    {
        try {
            // Check if about_page table exists, if not use default content
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'about_page'");
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $stmt = $this->db->prepare("SELECT * FROM about_page WHERE id = 1");
                $stmt->execute();
                $about = $stmt->fetch();
            } else {
                $about = [
                    'id' => 1,
                    'mission' => 'To deliver innovative technology solutions that empower businesses to thrive in the digital age.',
                    'vision' => 'To be the leading technology partner for businesses seeking digital transformation.',
                    'story' => 'Founded in 2020, Sabiteck Limited has been at the forefront of technology innovation...',
                    'company_values' => json_encode(['Innovation', 'Quality', 'Integrity', 'Customer Focus'])
                ];
            }

            $this->dataResponse($about);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAbout');
        }
    }

    /**
     * Create analytics tables if they don't exist
     */




    /**
     * Create analytics tables if they don't exist
     */
    private function createAnalyticsTables(): void
    {
        try {
            // Create analytics_visits table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS analytics_visits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    visitor_id VARCHAR(255) NOT NULL,
                    session_id VARCHAR(255) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    device_type VARCHAR(50) DEFAULT 'desktop',
                    operating_system VARCHAR(50),
                    browser VARCHAR(50),
                    country VARCHAR(100),
                    city VARCHAR(100),
                    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_duration INT DEFAULT 0,
                    pages_viewed INT DEFAULT 1,
                    is_bounce BOOLEAN DEFAULT FALSE,
                    referrer_url TEXT,
                    landing_page VARCHAR(500),
                    exit_page VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_visit_date (visit_date),
                    INDEX idx_visitor_id (visitor_id),
                    INDEX idx_device_type (device_type),
                    INDEX idx_country (country)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create analytics_pageviews table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS analytics_pageviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    visit_id INT,
                    visitor_id VARCHAR(255) NOT NULL,
                    page_url VARCHAR(1000) NOT NULL,
                    page_title VARCHAR(500),
                    time_on_page INT DEFAULT 0,
                    scroll_depth FLOAT DEFAULT 0,
                    view_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_page_url (page_url(255)),
                    INDEX idx_view_date (view_date),
                    INDEX idx_visitor_id (visitor_id),
                    FOREIGN KEY (visit_id) REFERENCES analytics_visits(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create analytics_events table for tracking custom events
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS analytics_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    visit_id INT,
                    visitor_id VARCHAR(255) NOT NULL,
                    event_type VARCHAR(100) NOT NULL,
                    event_name VARCHAR(255) NOT NULL,
                    event_value TEXT,
                    page_url VARCHAR(1000),
                    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_event_type (event_type),
                    INDEX idx_event_date (event_date),
                    INDEX idx_visitor_id (visitor_id),
                    FOREIGN KEY (visit_id) REFERENCES analytics_visits(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Do not insert sample data - use real data only
            // $this->insertSampleAnalyticsData();

        } catch (Exception $e) {
            error_log("Error creating analytics tables: " . $e->getMessage());
        }
    }

    /**
     * Insert sample analytics data for testing
     */
    private function insertSampleAnalyticsData(): void
    {
        try {
            // Check if we already have data
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM analytics_visits");
            $stmt->execute();
            $count = $stmt->fetchColumn();

            if ($count > 0) {
                return; // Data already exists
            }

            // Insert sample visits data for the last 30 days
            $countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Netherlands', 'Sweden'];
            $devices = ['desktop', 'mobile', 'tablet'];
            $browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
            $os = ['Windows 10', 'macOS', 'Linux', 'iOS', 'Android'];
            $pages = ['/', '/services', '/about', '/contact', '/portfolio', '/blog', '/pricing', '/team'];

            for ($day = 30; $day >= 0; $day--) {
                $date = date('Y-m-d H:i:s', strtotime("-$day days"));
                $dailyVisitors = rand(50, 200);

                for ($i = 0; $i < $dailyVisitors; $i++) {
                    $visitorId = 'visitor_' . uniqid() . '_' . $day . '_' . $i;
                    $sessionId = 'session_' . uniqid();
                    $pagesViewed = rand(1, 8);
                    $sessionDuration = rand(30, 600);
                    $isBounce = $pagesViewed === 1 ? (rand(0, 100) < 40) : false;

                    $stmt = $this->db->prepare("
                        INSERT INTO analytics_visits
                        (visitor_id, session_id, ip_address, device_type, operating_system, browser, country,
                         visit_date, session_duration, pages_viewed, is_bounce, landing_page, exit_page)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");

                    $stmt->execute([
                        $visitorId,
                        $sessionId,
                        '192.168.' . rand(1, 255) . '.' . rand(1, 255),
                        $devices[array_rand($devices)],
                        $os[array_rand($os)],
                        $browsers[array_rand($browsers)],
                        $countries[array_rand($countries)],
                        $date,
                        $sessionDuration,
                        $pagesViewed,
                        $isBounce,
                        $pages[array_rand($pages)],
                        $pages[array_rand($pages)]
                    ]);

                    $visitId = $this->db->lastInsertId();

                    // Insert pageviews for this visit
                    $viewedPages = array_rand(array_flip($pages), min($pagesViewed, count($pages)));
                    if (!is_array($viewedPages)) $viewedPages = [$viewedPages];

                    foreach ($viewedPages as $pageIndex => $page) {
                        $pageViewTime = date('Y-m-d H:i:s', strtotime($date . " + " . ($pageIndex * rand(10, 120)) . " seconds"));

                        $stmt = $this->db->prepare("
                            INSERT INTO analytics_pageviews
                            (visit_id, visitor_id, page_url, page_title, time_on_page, scroll_depth, view_date)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");

                        $stmt->execute([
                            $visitId,
                            $visitorId,
                            $page,
                            ucwords(trim($page, '/')) ?: 'Home',
                            rand(15, 300),
                            rand(20, 100),
                            $pageViewTime
                        ]);
                    }
                }
            }

        } catch (Exception $e) {
            error_log("Error inserting sample analytics data: " . $e->getMessage());
        }
    }

    /**
     * Get analytics data from database
     */
    private function getAnalyticsDataFromDB($period): ?array
    {
        try {
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            // Get current period stats
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT visitor_id) as total_visitors,
                    COUNT(*) as total_visits,
                    SUM(pages_viewed) as total_pageviews,
                    AVG(session_duration) as avg_session_duration,
                    (SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as bounce_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $currentStats = $stmt->fetch();

            if (!$currentStats || $currentStats['total_visitors'] == 0) {
                return null; // No data available, will use mock data
            }

            // Get previous period stats for growth calculation
            $prevStartDate = date('Y-m-d 00:00:00', strtotime("-" . ($days * 2) . " days"));
            $prevEndDate = date('Y-m-d 23:59:59', strtotime("-$days days"));

            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT visitor_id) as total_visitors,
                    SUM(pages_viewed) as total_pageviews,
                    AVG(session_duration) as avg_session_duration,
                    (SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as bounce_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date < ?
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevStats = $stmt->fetch();

            // Calculate growth percentages
            $visitorGrowth = $prevStats['total_visitors'] > 0
                ? round((($currentStats['total_visitors'] - $prevStats['total_visitors']) / $prevStats['total_visitors']) * 100, 1)
                : 0;

            $pageviewGrowth = $prevStats['total_pageviews'] > 0
                ? round((($currentStats['total_pageviews'] - $prevStats['total_pageviews']) / $prevStats['total_pageviews']) * 100, 1)
                : 0;

            $bounceRateGrowth = $prevStats['bounce_rate'] > 0
                ? round($currentStats['bounce_rate'] - $prevStats['bounce_rate'], 1)
                : 0;

            $sessionGrowth = $prevStats['avg_session_duration'] > 0
                ? round((($currentStats['avg_session_duration'] - $prevStats['avg_session_duration']) / $prevStats['avg_session_duration']) * 100, 1)
                : 0;

            return [
                'visitors' => [
                    'total' => (int)$currentStats['total_visitors'],
                    'growth' => $visitorGrowth
                ],
                'pageviews' => [
                    'total' => (int)$currentStats['total_pageviews'],
                    'growth' => $pageviewGrowth
                ],
                'bounce_rate' => [
                    'rate' => round($currentStats['bounce_rate'], 1),
                    'growth' => $bounceRateGrowth
                ],
                'session_duration' => [
                    'average' => round($currentStats['avg_session_duration']),
                    'growth' => $sessionGrowth
                ]
            ];

        } catch (Exception $e) {
            error_log("Error getting analytics data from DB: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create newsletter tables if they don't exist
     */


    /**
     * Get newsletter subscribers
     */
    public function getNewsletterSubscribers(): void
    {
        try {
            // Create tables first

            // Try to get actual data from database
            try {
                $stmt = $this->db->prepare("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC");
                $stmt->execute();
                $subscribers = $stmt->fetchAll();
                $this->dataResponse($subscribers, count($subscribers));
            } catch (Exception $e) {
                // Table doesn't exist, return empty data
                $this->dataResponse([], 0);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getNewsletterSubscribers');
        }
    }

    /**
     * Get newsletter templates
     */
    public function getNewsletterTemplates(): void
    {
        try {
            // Try to get actual data from database
            try {
                $stmt = $this->db->prepare("SELECT * FROM newsletter_templates ORDER BY created_at DESC");
                $stmt->execute();
                $templates = $stmt->fetchAll();
                $this->dataResponse($templates, count($templates));
            } catch (Exception $e) {
                // Table doesn't exist, return empty data
                $this->dataResponse([], 0);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getNewsletterTemplates');
        }
    }

    /**
     * Get newsletter campaigns
     */
    public function getNewsletterCampaigns(): void
    {
        try {
            // Try to get actual data from database
            try {
                $stmt = $this->db->prepare("
                    SELECT c.*, t.name as template_name
                    FROM newsletter_campaigns c
                    LEFT JOIN newsletter_templates t ON c.template_id = t.id
                    ORDER BY c.created_at DESC
                ");
                $stmt->execute();
                $campaigns = $stmt->fetchAll();
                $this->dataResponse($campaigns, count($campaigns));
            } catch (Exception $e) {
                // Table doesn't exist, return empty data
                $this->dataResponse([], 0);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getNewsletterCampaigns');
        }
    }

    /**
     * Create newsletter campaign
     */
    public function createNewsletterCampaign(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['name']) || !isset($input['subject'])) {
                $this->errorResponse('Campaign name and subject are required');
                return;
            }

            $stmt = $this->db->prepare("
                INSERT INTO newsletter_campaigns (name, subject, content, template_id, created_at, status)
                VALUES (?, ?, ?, ?, NOW(), 'draft')
            ");

            $stmt->execute([
                $input['name'],
                $input['subject'],
                $input['content'] ?? '',
                $input['template_id'] ?? null
            ]);

            $campaignId = $this->db->lastInsertId();
            $this->successResponse('Campaign created successfully', ['campaign_id' => $campaignId]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createNewsletterCampaign');
        }
    }

    /**
     * Update newsletter subscriber
     */
    public function updateNewsletterSubscriber(int $subscriberId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                $this->errorResponse('Invalid input data');
                return;
            }

            // Check if subscriber exists
            $checkStmt = $this->db->prepare("SELECT id FROM newsletter_subscribers WHERE id = ?");
            $checkStmt->execute([$subscriberId]);
            if (!$checkStmt->fetch()) {
                $this->errorResponse('Subscriber not found');
                return;
            }

            // Prepare update query with all possible fields
            $updates = [];
            $params = [];

            if (isset($input['email'])) {
                $updates[] = "email = ?";
                $params[] = $input['email'];
            }

            if (isset($input['name'])) {
                $updates[] = "name = ?";
                $params[] = $input['name'];
            }

            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
            }

            if (isset($input['active'])) {
                $updates[] = "active = ?";
                $params[] = $input['active'] ? 1 : 0;
            }

            if (isset($input['verified'])) {
                $updates[] = "verified = ?";
                $params[] = $input['verified'] ? 1 : 0;
            }

            if (isset($input['subscription_type'])) {
                $updates[] = "subscription_type = ?";
                $params[] = $input['subscription_type'];
            }

            if (isset($input['tags'])) {
                $updates[] = "tags = ?";
                $params[] = is_array($input['tags']) ? json_encode($input['tags']) : $input['tags'];
            }

            if (isset($input['segment'])) {
                $updates[] = "segment = ?";
                $params[] = $input['segment'];
            }

            if (isset($input['preferences'])) {
                $updates[] = "preferences = ?";
                $params[] = is_array($input['preferences']) ? json_encode($input['preferences']) : $input['preferences'];
            }

            if (empty($updates)) {
                $this->errorResponse('No valid fields to update');
                return;
            }

            $params[] = $subscriberId;

            $sql = "UPDATE newsletter_subscribers SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() > 0) {
                // Get updated subscriber data
                $getStmt = $this->db->prepare("SELECT * FROM newsletter_subscribers WHERE id = ?");
                $getStmt->execute([$subscriberId]);
                $updatedSubscriber = $getStmt->fetch();

                $this->successResponse('Subscriber updated successfully', ['subscriber' => $updatedSubscriber]);
            } else {
                $this->errorResponse('No changes made to subscriber');
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateNewsletterSubscriber');
        }
    }

    /**
     * Send email to specific subscriber
     */
    public function sendEmailToSubscriber(int $subscriberId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['subject']) || !isset($input['content'])) {
                $this->errorResponse('Subject and content are required');
                return;
            }

            // Get subscriber details
            $stmt = $this->db->prepare("SELECT email, name FROM newsletter_subscribers WHERE id = ? AND status = 'subscribed' AND active = 1");
            $stmt->execute([$subscriberId]);
            $subscriber = $stmt->fetch();

            if (!$subscriber) {
                $this->errorResponse('Subscriber not found or inactive');
                return;
            }

            // Get email configuration from database
            $emailConfig = $this->getEmailConfiguration();

            // Create email service and send email
            $emailService = new EmailService($emailConfig);
            $success = $emailService->sendEmail(
                $subscriber['email'],
                $input['subject'],
                $input['content'],
                true,
                $subscriber['name'] ?? ''
            );

            if ($success) {
                $this->successResponse('Email sent successfully', ['recipient' => $subscriber['email']]);
            } else {
                $errorDetail = $emailService->getLastError();
                $this->errorResponse('Failed to send email: ' . $errorDetail, 500);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'sendEmailToSubscriber');
        }
    }

    /**
     * Upload image for newsletter
     */
    public function uploadNewsletterImage(): void
    {
        try {
            if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                $this->errorResponse('No image uploaded or upload error');
                return;
            }

            $file = $_FILES['image'];
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            $maxSize = 5 * 1024 * 1024; // 5MB

            // Validate file type
            $fileType = mime_content_type($file['tmp_name']);
            if (!in_array($fileType, $allowedTypes)) {
                $this->errorResponse('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
                return;
            }

            // Validate file size
            if ($file['size'] > $maxSize) {
                $this->errorResponse('File too large. Maximum size is 5MB.');
                return;
            }

            // Create upload directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../public/uploads/newsletter/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'newsletter_' . time() . '_' . uniqid() . '.' . $extension;
            $uploadPath = $uploadDir . $filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $this->errorResponse('Failed to save uploaded file');
                return;
            }

            // Return the public URL (correct path for PHP server serving from public directory)
            $imageUrl = '/uploads/newsletter/' . $filename;

            $this->successResponse('Image uploaded successfully', [
                'filename' => $filename,
                'url' => $imageUrl,
                'full_url' => 'http://localhost:8002' . $imageUrl,
                'size' => $file['size'],
                'type' => $fileType
            ]);

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'uploadNewsletterImage');
        }
    }

    /**
     * Send newsletter to filtered subscribers
     */
    public function sendNewsletter(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['subject']) || !isset($input['content'])) {
                $this->errorResponse('Subject and content are required');
                return;
            }

            // Get active subscribers (apply filters if provided)
            $query = "SELECT email, name FROM newsletter_subscribers WHERE status = 'subscribed' AND active = 1";
            $params = [];

            // You can add filter logic here based on $input['filters'] if needed

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $subscribers = $stmt->fetchAll();

            if (empty($subscribers)) {
                $this->errorResponse('No active subscribers found');
                return;
            }

            // Get email configuration from database
            $emailConfig = $this->getEmailConfiguration();

            // Create email service and send newsletter
            $emailService = new EmailService($emailConfig);

            // Prepare recipients array for bulk sending
            $recipients = array_map(function($subscriber) {
                return [
                    'email' => $subscriber['email'],
                    'name' => $subscriber['name'] ?? ''
                ];
            }, $subscribers);

            // Add professional footer to the newsletter content
            $newsletterFooter = '
                <div style="margin-top: 40px; padding: 30px; background-color: #f8f9fa; border-top: 3px solid #007bff; text-align: center; font-family: Arial, sans-serif;">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Sabiteck Limited</h3>
                        <p style="color: #666; margin: 0; font-size: 14px;">Professional Newsletter • Bo, Sierra Leone</p>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; display: inline-block;">
                        <p style="color: #333; margin: 0; font-size: 13px;">
                            <strong>📧 Stay Connected:</strong><br>
                            Visit our website: <a href="https://sabiteck.com" style="color: #007bff; text-decoration: none;">sabiteck.com</a><br>
                            Contact us: info@sabiteck.com
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #888; font-size: 12px; margin: 0;">
                            <a href="#" style="color: #007bff; text-decoration: none; margin: 0 10px;">Unsubscribe</a> |
                            <a href="#" style="color: #007bff; text-decoration: none; margin: 0 10px;">Manage Preferences</a> |
                            <a href="#" style="color: #007bff; text-decoration: none; margin: 0 10px;">View Online</a>
                        </p>
                        <p style="color: #aaa; font-size: 11px; margin: 10px 0 0 0;">
                            © ' . date('Y') . ' Sabiteck Limited. All rights reserved.<br>
                            You received this email because you subscribed to our newsletter.
                        </p>
                    </div>
                </div>';

            // Combine content with footer
            $fullContent = $input['content'] . $newsletterFooter;

            $results = $emailService->sendNewsletter(
                $recipients,
                $input['subject'],
                $fullContent
            );

            $this->successResponse('Newsletter sent successfully', [
                'total_subscribers' => count($subscribers),
                'sent' => $results['sent'],
                'failed' => $results['failed'],
                'errors' => $results['errors']
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'sendNewsletter');
        }
    }

    /**
     * Get analytics dashboard data
     */
    public function getAnalyticsDashboard(): void
    {
        try {
            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Try to get real data first, fallback to mock data
            $period = $_GET['period'] ?? '30d';
            $dashboardData = $this->getAnalyticsDataFromDB($period);

            if (!$dashboardData) {
                // Return proper empty state instead of mock data
                $dashboardData = [
                    'unique_visitors' => 0,
                    'sessions' => 0,
                    'page_views' => 0,
                    'avg_session_duration' => 0,
                    'avg_pages_per_session' => 0,
                    'bounce_rate' => 0,
                    'active_users' => 0,
                    'visitors' => [
                        'total' => 0,
                        'growth' => 0
                    ],
                    'pageviews' => [
                        'total' => 0,
                        'growth' => 0
                    ],
                    'bounce_rate' => [
                        'rate' => 0,
                        'growth' => 0
                    ],
                    'session_duration' => [
                        'average' => 0,
                        'growth' => 0
                    ]
                ];
            }

            $this->successResponse('Analytics dashboard data retrieved successfully', $dashboardData);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsDashboard');
        }
    }

    /**
     * Get top pages analytics
     */
    public function getAnalyticsPages(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $pagesData = $this->getTopPagesFromDB($period, $limit);

            if (!$pagesData) {
                // Return empty array if no data exists
                $pagesData = [];
            }

            $this->dataResponse($pagesData, count($pagesData));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsPages');
        }
    }

    /**
     * Get top pages from database
     */
    private function getTopPagesFromDB($period, $limit): ?array
    {
        try {
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            $stmt = $this->db->prepare("
                SELECT
                    p.page_url as page,
                    COUNT(*) as views,
                    COUNT(DISTINCT p.visitor_id) as unique_views,
                    AVG(p.time_on_page) as avg_session_duration,
                    (
                        SELECT (COUNT(CASE WHEN v.is_bounce = 1 THEN 1 END) * 100.0 / COUNT(*))
                        FROM analytics_visits v
                        WHERE v.landing_page = p.page_url
                        AND v.visit_date >= ?
                        AND v.visit_date <= ?
                    ) as bounce_rate
                FROM analytics_pageviews p
                WHERE p.view_date >= ? AND p.view_date <= ?
                GROUP BY p.page_url
                ORDER BY views DESC
                LIMIT ?
            ");

            $stmt->execute([$startDate, $endDate, $startDate, $endDate, $limit]);
            $results = $stmt->fetchAll();

            if (empty($results)) {
                return null;
            }

            // Format the data for frontend
            foreach ($results as &$page) {
                $page['views'] = (int)$page['views'];
                $page['unique_views'] = (int)$page['unique_views'];
                $page['bounce_rate'] = round($page['bounce_rate'] ?: 0, 1);
                $page['avg_session_duration'] = round($page['avg_session_duration'] ?: 0);
            }

            return $results;

        } catch (Exception $e) {
            error_log("Error getting top pages from DB: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get referrers analytics
     */
    public function getAnalyticsReferrers(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $referrersData = $this->getReferrersFromDB($period, $limit);

            if (!$referrersData) {
                // Return empty array if no data exists
                $referrersData = [];
            }

            $this->dataResponse($referrersData, count($referrersData));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsReferrers');
        }
    }

    /**
     * Get referrers from database
     */
    private function getReferrersFromDB($period, $limit): ?array
    {
        try {
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            // First get total visits for percentage calculation
            $totalStmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $totalStmt->execute([$startDate, $endDate]);
            $totalVisits = $totalStmt->fetchColumn() ?: 1;

            // Get referrer data
            $stmt = $this->db->prepare("
                SELECT
                    CASE
                        WHEN referrer_url IS NULL OR referrer_url = '' THEN 'Direct'
                        WHEN referrer_url LIKE '%google%' THEN 'google.com'
                        WHEN referrer_url LIKE '%facebook%' OR referrer_url LIKE '%fb.%' THEN 'facebook.com'
                        WHEN referrer_url LIKE '%linkedin%' THEN 'linkedin.com'
                        WHEN referrer_url LIKE '%twitter%' OR referrer_url LIKE '%t.co%' THEN 'twitter.com'
                        WHEN referrer_url LIKE '%youtube%' THEN 'youtube.com'
                        ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(REPLACE(referrer_url, 'https://', ''), 'http://', ''), '/', 1), '.', -2)
                    END as source,
                    COUNT(*) as visits,
                    ROUND((COUNT(*) * 100.0 / ?), 1) as percentage
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
                GROUP BY source
                ORDER BY visits DESC
                LIMIT ?
            ");

            $stmt->execute([$totalVisits, $startDate, $endDate, $limit]);
            $results = $stmt->fetchAll();

            if (empty($results)) {
                return null;
            }

            // Format the data for frontend
            foreach ($results as &$referrer) {
                $referrer['visits'] = (int)$referrer['visits'];
                $referrer['percentage'] = (float)$referrer['percentage'];
            }

            return $results;

        } catch (Exception $e) {
            error_log("Error getting referrers from DB: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get devices analytics
     */
    public function getAnalyticsDevices(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $devicesData = $this->getDevicesFromDB($period);

            if (!$devicesData) {
                // Return empty array if no data exists
                $devicesData = [];
            }

            $this->dataResponse($devicesData);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsDevices');
        }
    }

    /**
     * Get devices from database
     */
    private function getDevicesFromDB($period): ?array
    {
        try {
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            // Get total visits for percentage calculation
            $totalStmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $totalStmt->execute([$startDate, $endDate]);
            $totalVisits = $totalStmt->fetchColumn() ?: 1;

            $stmt = $this->db->prepare("
                SELECT
                    device_type,
                    COUNT(*) as visits,
                    ROUND((COUNT(*) * 100.0 / ?), 1) as percentage
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
                GROUP BY device_type
                ORDER BY visits DESC
            ");

            $stmt->execute([$totalVisits, $startDate, $endDate]);
            $results = $stmt->fetchAll();

            if (empty($results)) {
                return null;
            }

            // Format as associative array expected by frontend
            $devices = [];
            foreach ($results as $device) {
                $devices[$device['device_type']] = [
                    'visits' => (int)$device['visits'],
                    'percentage' => (float)$device['percentage']
                ];
            }

            return $devices;

        } catch (Exception $e) {
            error_log("Error getting devices from DB: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get geography analytics
     */
    public function getAnalyticsGeography(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $geographyData = $this->getGeographyFromDB($period, $limit);

            if (!$geographyData) {
                // Return empty array if no data exists
                $geographyData = [];
            }

            $this->dataResponse($geographyData, count($geographyData));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsGeography');
        }
    }

    /**
     * Track analytics data (from frontend)
     */
    public function trackAnalytics(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                $this->errorResponse('INVALID_JSON', 400);
                return;
            }

            // Validate required fields
            $required = ['visitor_id', 'session_id', 'page_url'];
            foreach ($required as $field) {
                if (!isset($input[$field])) {
                    $this->errorResponse("Missing required field: {$field}", 400);
                    return;
                }
            }

            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Check if this is a new visit or existing session
            $visitorId = $input['visitor_id'];
            $sessionId = $input['session_id'];
            $pageUrl = $input['page_url'];
            $pageTitle = $input['page_title'] ?? '';
            $referrer = $input['referrer'] ?? '';
            $userAgent = $input['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';

            // Extract device info from input
            $deviceType = $input['device_type'] ?? 'desktop';
            $operatingSystem = $input['operating_system'] ?? 'Unknown';
            $browser = $input['browser'] ?? 'Unknown';
            $country = $input['country'] ?? null;
            $isEntryPage = $input['is_entry_page'] ?? false;

            // Check if visit exists
            $stmt = $this->db->prepare("SELECT id FROM analytics_visits WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            $visit = $stmt->fetch();

            if (!$visit) {
                // Create new visit record
                $stmt = $this->db->prepare("
                    INSERT INTO analytics_visits
                    (visitor_id, session_id, ip_address, user_agent, device_type, operating_system, browser, country, referrer_url, landing_page, visit_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $visitorId, $sessionId, $ipAddress, $userAgent, $deviceType,
                    $operatingSystem, $browser, $country, $referrer, $pageUrl
                ]);
                $visitId = $this->db->lastInsertId();
            } else {
                $visitId = $visit['id'];

                // Update visit with exit page
                $stmt = $this->db->prepare("UPDATE analytics_visits SET exit_page = ?, pages_viewed = pages_viewed + 1 WHERE id = ?");
                $stmt->execute([$pageUrl, $visitId]);
            }

            // Record page view
            $timeOnPage = $input['time_on_page'] ?? 0;
            $scrollDepth = $input['scroll_depth'] ?? 0;

            $stmt = $this->db->prepare("
                INSERT INTO analytics_pageviews
                (visit_id, visitor_id, page_url, page_title, time_on_page, scroll_depth, view_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$visitId, $visitorId, $pageUrl, $pageTitle, $timeOnPage, $scrollDepth]);

            $this->successResponse('Analytics tracked successfully');

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'trackAnalytics');
        }
    }

    /**
     * Track analytics event
     */
    public function trackEvent(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                $this->errorResponse('INVALID_JSON', 400);
                return;
            }

            // Validate required fields
            $required = ['visitor_id', 'session_id', 'event_category', 'event_action'];
            foreach ($required as $field) {
                if (!isset($input[$field])) {
                    $this->errorResponse("Missing required field: {$field}", 400);
                    return;
                }
            }

            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Get visit ID
            $stmt = $this->db->prepare("SELECT id FROM analytics_visits WHERE session_id = ?");
            $stmt->execute([$input['session_id']]);
            $visit = $stmt->fetch();
            $visitId = $visit ? $visit['id'] : null;

            // Record event
            $stmt = $this->db->prepare("
                INSERT INTO analytics_events
                (visit_id, visitor_id, event_type, event_name, event_value, event_date)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $visitId,
                $input['visitor_id'],
                $input['event_category'],
                $input['event_action'],
                $input['event_label'] ?? null
            ]);

            $this->successResponse('Event tracked successfully');

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'trackEvent');
        }
    }

    /**
     * Analytics opt-in
     */
    public function analyticsOptIn(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $visitorId = $input['visitor_id'] ?? null;

            if ($visitorId) {
                // Remove from opt-out list if exists
                // For now, just return success as we don't maintain opt-out records
                $this->successResponse('Analytics opt-in successful');
            } else {
                $this->errorResponse('Missing visitor_id', 400);
            }

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'analyticsOptIn');
        }
    }

    /**
     * Analytics opt-out
     */
    public function analyticsOptOut(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $visitorId = $input['visitor_id'] ?? null;

            if ($visitorId) {
                // In a full implementation, you'd add to opt-out table
                // For now, just return success
                $this->successResponse('Analytics opt-out successful');
            } else {
                $this->errorResponse('Missing visitor_id', 400);
            }

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'analyticsOptOut');
        }
    }

    /**
     * Get realtime analytics
     */
    public function getRealtimeAnalytics(): void
    {
        try {
            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Get active users (last 5 minutes)
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT visitor_id) as active_users
                FROM analytics_pageviews
                WHERE view_date >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ");
            $stmt->execute();
            $activeUsers = $stmt->fetchColumn() ?: 0;

            // Get current active pages
            $stmt = $this->db->prepare("
                SELECT page_url, page_title, COUNT(*) as viewers
                FROM analytics_pageviews
                WHERE view_date >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                GROUP BY page_url, page_title
                ORDER BY viewers DESC
                LIMIT 10
            ");
            $stmt->execute();
            $activePages = $stmt->fetchAll();

            $this->successResponse('Realtime analytics retrieved', [
                'total_active_users' => $activeUsers,
                'active_pages' => $activePages
            ]);

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getRealtimeAnalytics');
        }
    }

    /**
     * Export analytics data
     */
    public function exportAnalytics(): void
    {
        try {
            $format = $_GET['format'] ?? 'csv';
            $period = $_GET['period'] ?? '30d';
            $type = $_GET['type'] ?? 'overview';

            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Get date range
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            $data = [];
            $filename = "analytics_export_{$type}_{$period}_" . date('Y-m-d');

            switch ($type) {
                case 'overview':
                    $data = $this->getOverviewExportData($startDate, $endDate);
                    break;
                case 'pages':
                    $data = $this->getPagesExportData($startDate, $endDate);
                    break;
                case 'referrers':
                    $data = $this->getReferrersExportData($startDate, $endDate);
                    break;
                case 'devices':
                    $data = $this->getDevicesExportData($startDate, $endDate);
                    break;
                default:
                    $data = $this->getOverviewExportData($startDate, $endDate);
            }

            if ($format === 'csv') {
                $this->exportAsCSV($data, $filename);
            } elseif ($format === 'json') {
                $this->exportAsJSON($data, $filename);
            } else {
                $this->errorResponse('Invalid export format', 400);
            }

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'exportAnalytics');
        }
    }

    /**
     * Get overview data for export
     */
    private function getOverviewExportData($startDate, $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT
                DATE(visit_date) as date,
                COUNT(DISTINCT visitor_id) as unique_visitors,
                COUNT(*) as total_visits,
                SUM(pages_viewed) as total_pageviews,
                AVG(session_duration) as avg_session_duration,
                (SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as bounce_rate
            FROM analytics_visits
            WHERE visit_date >= ? AND visit_date <= ?
            GROUP BY DATE(visit_date)
            ORDER BY date DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get pages data for export
     */
    private function getPagesExportData($startDate, $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT
                p.page_url,
                p.page_title,
                COUNT(*) as views,
                COUNT(DISTINCT p.visitor_id) as unique_views,
                AVG(p.time_on_page) as avg_time_on_page,
                AVG(p.scroll_depth) as avg_scroll_depth
            FROM analytics_pageviews p
            WHERE p.view_date >= ? AND p.view_date <= ?
            GROUP BY p.page_url, p.page_title
            ORDER BY views DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get referrers data for export
     */
    private function getReferrersExportData($startDate, $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT
                CASE
                    WHEN referrer_url IS NULL OR referrer_url = '' THEN 'Direct'
                    WHEN referrer_url LIKE '%google%' THEN 'google.com'
                    WHEN referrer_url LIKE '%facebook%' OR referrer_url LIKE '%fb.%' THEN 'facebook.com'
                    WHEN referrer_url LIKE '%linkedin%' THEN 'linkedin.com'
                    WHEN referrer_url LIKE '%twitter%' OR referrer_url LIKE '%t.co%' THEN 'twitter.com'
                    ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(REPLACE(referrer_url, 'https://', ''), 'http://', ''), '/', 1), '.', -2)
                END as source,
                COUNT(*) as visits,
                COUNT(DISTINCT visitor_id) as unique_visitors
            FROM analytics_visits
            WHERE visit_date >= ? AND visit_date <= ?
            GROUP BY source
            ORDER BY visits DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get devices data for export
     */
    private function getDevicesExportData($startDate, $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT
                device_type,
                operating_system,
                browser,
                COUNT(*) as visits,
                COUNT(DISTINCT visitor_id) as unique_visitors
            FROM analytics_visits
            WHERE visit_date >= ? AND visit_date <= ?
            GROUP BY device_type, operating_system, browser
            ORDER BY visits DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Export data as CSV
     */
    private function exportAsCSV($data, $filename): void
    {
        if (empty($data)) {
            $this->errorResponse('No data to export', 404);
            return;
        }

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

        $output = fopen('php://output', 'w');

        // Write headers
        fputcsv($output, array_keys($data[0]));

        // Write data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }

        fclose($output);
        exit;
    }

    /**
     * Export data as JSON
     */
    private function exportAsJSON($data, $filename): void
    {
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '.json"');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

        echo json_encode([
            'export_date' => date('Y-m-d H:i:s'),
            'filename' => $filename,
            'total_records' => count($data),
            'data' => $data
        ], JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Get geography from database
     */
    private function getGeographyFromDB($period, $limit): ?array
    {
        try {
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT) ?: 30;
            $startDate = date('Y-m-d 00:00:00', strtotime("-$days days"));
            $endDate = date('Y-m-d 23:59:59');

            // Get total visits for percentage calculation
            $totalStmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $totalStmt->execute([$startDate, $endDate]);
            $totalVisits = $totalStmt->fetchColumn() ?: 1;

            $stmt = $this->db->prepare("
                SELECT
                    country,
                    COUNT(*) as visits,
                    ROUND((COUNT(*) * 100.0 / ?), 1) as percentage
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ? AND country IS NOT NULL
                GROUP BY country
                ORDER BY visits DESC
                LIMIT ?
            ");

            $stmt->execute([$totalVisits, $startDate, $endDate, $limit]);
            $results = $stmt->fetchAll();

            if (empty($results)) {
                return null;
            }

            // Format the data for frontend
            foreach ($results as &$country) {
                $country['visits'] = (int)$country['visits'];
                $country['percentage'] = (float)$country['percentage'];
            }

            return $results;

        } catch (Exception $e) {
            error_log("Error getting geography from DB: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get blog categories
     */
    public function getBlogCategories(): void
    {
        try {
            // Get categories from database with content counts
            $stmt = $this->db->prepare("
                SELECT
                    bc.id,
                    bc.name,
                    bc.slug,
                    bc.description,
                    bc.active,
                    bc.sort_order,
                    COALESCE(COUNT(c.id), 0) as count
                FROM blog_categories bc
                LEFT JOIN content c ON c.category = bc.name AND c.published = 1
                WHERE bc.active = 1
                GROUP BY bc.id, bc.name, bc.slug, bc.description, bc.active, bc.sort_order
                ORDER BY bc.sort_order ASC, bc.name ASC
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->successResponse('Blog categories retrieved successfully', $categories);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getBlogCategories');
        }
    }

    /**
     * Get content types
     */
    public function getContentTypes(): void
    {
        try {
            // Get content types from database with usage counts
            $stmt = $this->db->prepare("
                SELECT
                    ct.id,
                    ct.name,
                    ct.content_type as type,
                    ct.description,
                    ct.icon,
                    ct.active,
                    ct.sort_order,
                    COALESCE(COUNT(c.id), 0) as count
                FROM content_types ct
                LEFT JOIN content c ON c.content_type = ct.content_type AND c.published = 1
                WHERE ct.active = 1
                GROUP BY ct.id, ct.name, ct.content_type, ct.description, ct.icon, ct.active, ct.sort_order
                ORDER BY ct.sort_order ASC, ct.name ASC
            ");
            $stmt->execute();
            $contentTypes = $stmt->fetchAll();

            $this->successResponse('Content types retrieved successfully', $contentTypes);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContentTypes');
        }
    }


    /**
     * Create user management tables if they don't exist
     */


    /**
     * Get users with pagination and filtering
     */
    public function getUsers(): void
    {
        try {

            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 15);
            $search = trim($_GET['search'] ?? '');
            $organization = trim($_GET['organization'] ?? '');

            // Convert empty strings to null and handle 'all' value
            $search = $search === '' ? null : $search;
            $organization = ($organization === '' || $organization === 'all') ? null : $organization;

            $offset = ($page - 1) * $limit;

            try {

                // Build WHERE clause based on filters
                $whereConditions = [];
                $params = [];

                if ($search !== null && $search !== '') {
                    $whereConditions[] = "(email LIKE ? OR username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
                    $searchParam = "%$search%";
                    $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
                }

                if ($organization !== null && $organization !== '') {
                    $whereConditions[] = "organization_id = ?";
                    $params[] = $organization;
                }

                $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

                // Force fresh query without any caching
                $this->db->exec("SET SESSION query_cache_type = OFF");

                // Main query
                $sql = "SELECT * FROM users $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
                $executeParams = array_merge($params, [$limit, $offset]);

                $stmt = $this->db->prepare($sql);
                $stmt->execute($executeParams);
                $users = $stmt->fetchAll();

                // Process users for frontend
                foreach ($users as &$user) {
                    $user['organization_name'] = $user['organization'] ?? '';
                    $user['role_name'] = $user['role'];
                    $user['role_display_name'] = $user['role'];
                    $user['role_permissions'] = '';
                    $user['role_permission_names'] = '';
                    $user['role_permissions_list'] = [];
                    $user['role_permission_names_list'] = [];
                    $user['individual_permissions'] = [];

                    // Parse individual user permissions from JSON
                    if (!empty($user['permissions'])) {
                        $individualPerms = json_decode($user['permissions'], true);
                        $user['individual_permissions'] = is_array($individualPerms) ? $individualPerms : [];
                    }

                    $user['all_permissions'] = $user['individual_permissions'];
                }

                // Get total count
                $countSql = "SELECT COUNT(*) FROM users $whereClause";
                $countStmt = $this->db->prepare($countSql);
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();

                $response = [
                    'success' => true,
                    'users' => $users,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ];

                header('Content-Type: application/json');
                echo json_encode($response);
            } catch (Exception $e) {
                // Log the exception for debugging
                error_log("Exception in getUsers inner try-catch: " . $e->getMessage());
                error_log("Exception trace: " . $e->getTraceAsString());
                throw $e; // Re-throw to be handled by outer catch
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getUsers');
        }
    }

    /**
     * Get permissions list
     */
    public function getPermissions(): void
    {
        try {
            // First check if permissions table exists
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'permissions'");
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                // Permissions table doesn't exist, return static data
                $permissions = [
                    ['id' => 1, 'name' => 'content.view', 'display_name' => 'View Content', 'description' => 'Can view content items', 'category' => 'Content', 'role_count' => 0],
                    ['id' => 2, 'name' => 'content.create', 'display_name' => 'Create Content', 'description' => 'Can create new content items', 'category' => 'Content', 'role_count' => 0],
                    ['id' => 3, 'name' => 'content.edit', 'display_name' => 'Edit Content', 'description' => 'Can edit existing content items', 'category' => 'Content', 'role_count' => 0],
                    ['id' => 4, 'name' => 'content.delete', 'display_name' => 'Delete Content', 'description' => 'Can delete content items', 'category' => 'Content', 'role_count' => 0],
                    ['id' => 5, 'name' => 'jobs.view', 'display_name' => 'View Jobs', 'description' => 'Can view job listings', 'category' => 'Jobs', 'role_count' => 0],
                    ['id' => 6, 'name' => 'jobs.create', 'display_name' => 'Create Jobs', 'description' => 'Can create new job listings', 'category' => 'Jobs', 'role_count' => 0],
                    ['id' => 7, 'name' => 'jobs.edit', 'display_name' => 'Edit Jobs', 'description' => 'Can edit existing job listings', 'category' => 'Jobs', 'role_count' => 0],
                    ['id' => 8, 'name' => 'jobs.delete', 'display_name' => 'Delete Jobs', 'description' => 'Can delete job listings', 'category' => 'Jobs', 'role_count' => 0],
                    ['id' => 9, 'name' => 'users.view', 'display_name' => 'View Users', 'description' => 'Can view user listings', 'category' => 'User Management', 'role_count' => 0],
                    ['id' => 10, 'name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Can create new users', 'category' => 'User Management', 'role_count' => 0],
                    ['id' => 11, 'name' => 'users.edit', 'display_name' => 'Edit Users', 'description' => 'Can edit user information', 'category' => 'User Management', 'role_count' => 0],
                    ['id' => 12, 'name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Can delete users', 'category' => 'User Management', 'role_count' => 0],
                    ['id' => 13, 'name' => 'analytics.view', 'display_name' => 'View Analytics', 'description' => 'Can view analytics data', 'category' => 'Analytics', 'role_count' => 0],
                    ['id' => 14, 'name' => 'settings.view', 'display_name' => 'View Settings', 'description' => 'Can view system settings', 'category' => 'Settings', 'role_count' => 0],
                    ['id' => 15, 'name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Can edit system settings', 'category' => 'Settings', 'role_count' => 0]
                ];
                $this->dataResponse($permissions, count($permissions));
                return;
            }

            // Check if role_permissions table exists
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'role_permissions'");
            $stmt->execute();
            $hasRolePermissions = $stmt->rowCount() > 0;

            if ($hasRolePermissions) {
                // Both tables exist, use full query
                $stmt = $this->db->prepare("
                    SELECT p.*,
                           COUNT(rp.role_id) as role_count
                    FROM permissions p
                    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
                    GROUP BY p.id
                    ORDER BY p.category, p.name
                ");
            } else {
                // Only permissions table exists
                $stmt = $this->db->prepare("
                    SELECT p.*, 0 as role_count
                    FROM permissions p
                    ORDER BY p.category, p.name
                ");
            }

            $stmt->execute();
            $permissions = $stmt->fetchAll();

            // Format the data
            foreach ($permissions as &$permission) {
                $permission['role_count'] = (int)$permission['role_count'];
            }

            $this->dataResponse($permissions, count($permissions));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getPermissions');
        }
    }

    /**
     * Create new user
     */
    public function createUser(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $email = $input['email'] ?? '';
            $username = $input['username'] ?? '';
            $firstName = $input['first_name'] ?? '';
            $lastName = $input['last_name'] ?? '';
            $password = $input['password'] ?? '';
            $roleId = $input['role_id'] ?? 1; // Default to user role

            // Generate username if not provided
            if (empty($username)) {
                $username = strtolower($firstName . '.' . $lastName);
                $username = preg_replace('/[^a-z0-9._]/', '', $username);
            }

            // Generate password if not provided
            if (empty($password)) {
                $password = bin2hex(random_bytes(8));
                $tempPassword = $password;
            } else {
                $tempPassword = null;
            }

            // Hash the password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // Insert user into database
            $organizationId = !empty($input['organization_id']) ? $input['organization_id'] : null;
            $status = $input['status'] ?? 'active';
            $emailVerified = $input['email_verified'] ?? false;

            // Use the new database structure with foreign keys
            $stmt = $this->db->prepare("
                INSERT INTO users (email, username, first_name, last_name, password_hash, role_id, organization_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $email,
                $username,
                $firstName,
                $lastName,
                $passwordHash,
                $roleId,
                $organizationId,
                $status
            ]);

            $userId = $this->db->lastInsertId();

            // Role is now stored in users.role_id column via foreign key

            $response = [
                'success' => true,
                'message' => 'User created successfully',
                'user_id' => $userId,
                'username' => $username
            ];

            if ($tempPassword) {
                $response['temporary_password'] = $tempPassword;
            }

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createUser');
        }
    }

    /**
     * Update user
     */
    public function updateUser(int $userId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Build update fields dynamically
            $updateFields = [];
            $params = [];

            if (isset($input['email'])) {
                $updateFields[] = 'email = ?';
                $params[] = $input['email'];
            }

            if (isset($input['username'])) {
                $updateFields[] = 'username = ?';
                $params[] = $input['username'];
            }

            if (isset($input['first_name'])) {
                $updateFields[] = 'first_name = ?';
                $params[] = $input['first_name'];
            }

            if (isset($input['last_name'])) {
                $updateFields[] = 'last_name = ?';
                $params[] = $input['last_name'];
            }

            if (isset($input['role'])) {
                $updateFields[] = 'role = ?';
                $params[] = $input['role'];
            }

            if (isset($input['organization_id'])) {
                $updateFields[] = 'organization_id = ?';
                $params[] = !empty($input['organization_id']) ? $input['organization_id'] : null;
            }

            if (isset($input['status'])) {
                $updateFields[] = 'status = ?';
                $params[] = $input['status'];
            }

            if (isset($input['email_verified'])) {
                $updateFields[] = 'email_verified = ?';
                $params[] = $input['email_verified'];
            }

            // Handle password update if provided
            if (!empty($input['password'])) {
                $updateFields[] = 'password_hash = ?';
                $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            }

            if (empty($updateFields)) {
                $this->errorResponse('No fields to update', 400);
                return;
            }

            $updateFields[] = 'updated_at = NOW()';
            $params[] = $userId;

            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('User not found', 404);
                return;
            }

            $this->successResponse('User updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateUser');
        }
    }

    /**
     * Delete user
     */
    public function deleteUser(int $userId): void
    {
        try {
            // Check if user exists
            $stmt = $this->db->prepare("SELECT id, username, role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                $this->errorResponse('User not found');
                return;
            }

            // Prevent deletion of super admin users
            if ($user['role'] === 'super_admin') {
                $this->errorResponse('Super admin users cannot be deleted');
                return;
            }

            // Delete the user
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('User deletion failed');
                return;
            }

            $this->successResponse('User deleted successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteUser');
        }
    }

    /**
     * Invite user
     */
    public function inviteUser(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $email = $input['email'] ?? '';
            $organizationId = $input['organization_id'] ?? null;
            $roleId = $input['role_id'] ?? 1; // Default to user role
            $permissions = $input['permissions'] ?? [];

            if (empty($email)) {
                $this->errorResponse('Email is required', 400);
                return;
            }

            // Check if user already exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $this->errorResponse('User with this email already exists', 400);
                return;
            }

            // Generate username from email (use part before @ as base)
            $emailParts = explode('@', $email);
            $baseUsername = preg_replace('/[^a-zA-Z0-9_]/', '', $emailParts[0]);

            // Ensure username is unique by checking if it exists
            $username = $baseUsername;
            $counter = 1;
            while (true) {
                $checkStmt = $this->db->prepare("SELECT id FROM users WHERE username = ?");
                $checkStmt->execute([$username]);
                if (!$checkStmt->fetch()) {
                    break; // Username is available
                }
                $username = $baseUsername . $counter;
                $counter++;
            }

            // Generate temporary password
            $tempPassword = bin2hex(random_bytes(8));
            $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

            // Create user with must_change_password flag set to true
            $stmt = $this->db->prepare("
                INSERT INTO users (username, email, password_hash, role_id, organization_id, status, must_change_password, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', 1, NOW())
            ");
            $stmt->execute([$username, $email, $passwordHash, $roleId, $organizationId]);
            $userId = $this->db->lastInsertId();

            // Assign individual permissions if provided
            if (!empty($permissions)) {
                $permissionService = new \App\Services\PermissionService($this->db);
                $currentAdminId = $this->getCurrentUserId();
                foreach ($permissions as $permission) {
                    $permissionService->grantPermission($userId, $permission, $currentAdminId);
                }
            }

            // Send invitation email with temporary password
            $this->sendInvitationEmail($email, $username, $tempPassword);

            $this->successResponse('User invitation sent successfully', [
                'user_id' => $userId,
                'username' => $username,
                'email' => $email,
                'message' => 'Invitation email sent to ' . $email
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'inviteUser');
        }
    }

    /**
     * Send invitation email to new user
     */
    private function sendInvitationEmail(string $email, string $username, string $tempPassword): void
    {
        try {
            // Use authentication email configuration for invitations
            $emailConfig = [
                'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
                'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
                'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
                'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
                'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
                'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabitech Authentication'
            ];

            $emailService = new EmailService($emailConfig);

            $subject = 'Welcome to Sabiteck Limited - Your Account Invitation';
            $loginUrl = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . '/login';

            $body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: #007bff; color: white; padding: 20px; text-align: center;'>
                    <h1>Welcome to Sabiteck Limited</h1>
                </div>
                <div style='padding: 30px; background: #f8f9fa;'>
                    <h2>You've been invited to join our platform!</h2>
                    <p>Hello,</p>
                    <p>You have been invited to create an account on Sabiteck Limited. Here are your login credentials:</p>

                    <div style='background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;'>
                        <p><strong>Username:</strong> {$username}</p>
                        <p><strong>Email:</strong> {$email}</p>
                        <p><strong>Temporary Password:</strong> <code style='background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;'>{$tempPassword}</code></p>
                    </div>

                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$loginUrl}' style='background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;'>Login to Your Account</a>
                    </div>

                    <div style='background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;'>
                        <p style='margin: 0; color: #856404;'><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                    </div>

                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

                    <p>Best regards,<br>The Sabiteck Team</p>
                </div>
                <div style='background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;'>
                    <p>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>";

            $emailService->sendEmail($email, $subject, $body, true);

        } catch (Exception $e) {
            error_log("Send invitation email error: " . $e->getMessage());
            // Don't throw exception to prevent breaking the user creation process
        }
    }

    /**
     * Update user role
     */
    public function updateUserRole(int $userId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $role = $input['role'] ?? '';
            $organizationId = $input['organization_id'] ?? null;

            if (empty($role)) {
                $this->errorResponse('Role is required', 400);
                return;
            }

            // Check if user exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                $this->errorResponse('User not found', 404);
                return;
            }

            // Check if roles and user_roles tables exist
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'roles'");
            $stmt->execute();
            $hasRoles = $stmt->rowCount() > 0;

            $stmt = $this->db->prepare("SHOW TABLES LIKE 'user_roles'");
            $stmt->execute();
            $hasUserRoles = $stmt->rowCount() > 0;

            if ($hasRoles && $hasUserRoles) {
                // Get role ID from role name
                $stmt = $this->db->prepare("SELECT id FROM roles WHERE name = ?");
                $stmt->execute([$role]);
                $roleData = $stmt->fetch();

                if (!$roleData) {
                    $this->errorResponse('Invalid role specified', 400);
                    return;
                }

                $roleId = $roleData['id'];

                // Remove existing role assignments
                $stmt = $this->db->prepare("DELETE FROM user_roles WHERE user_id = ?");
                $stmt->execute([$userId]);

                // Assign new role
                $stmt = $this->db->prepare("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())");
                $stmt->execute([$userId, $roleId]);
            } else {
                // Fallback to updating role column directly in users table
                $stmt = $this->db->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$role, $userId]);
            }

            // Update organization_id in users table
            if ($organizationId !== null) {
                $stmt = $this->db->prepare("UPDATE users SET organization_id = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$organizationId, $userId]);
            }

            $this->successResponse('User role updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateUserRole');
        }
    }

    /**
     * Update user permissions
     */
    public function updateUserPermissions(int $userId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $permissions = $input['permissions'] ?? [];

            // Update the permissions field in the users table as JSON
            $permissionsJson = !empty($permissions) ? json_encode($permissions) : null;

            $stmt = $this->db->prepare("
                UPDATE users
                SET permissions = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$permissionsJson, $userId]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('User not found', 404);
                return;
            }

            $this->successResponse('User permissions updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateUserPermissions');
        }
    }


    /**
     * Create route settings table if it doesn't exist
     */

    /**
     * Get route settings
     */
    public function getRouteSettings(): void
    {
        try {

            $stmt = $this->db->prepare("
                SELECT * FROM route_settings
                ORDER BY display_order ASC, route_name ASC
            ");
            $stmt->execute();
            $routes = $stmt->fetchAll();

            $response = [
                'success' => true,
                'routes' => $routes
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getRouteSettings');
        }
    }

    /**
     * Create route setting
     */
    public function createRouteSettings(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $routeName = $input['route_name'] ?? '';
            $displayName = $input['display_name'] ?? '';
            $description = $input['description'] ?? '';
            $isVisible = isset($input['is_visible']) ? (int)(bool)$input['is_visible'] : 1;
            $displayOrder = (int)($input['display_order'] ?? 0);

            if (empty($routeName) || empty($displayName)) {
                $this->errorResponse('Route name and display name are required');
                return;
            }

            $stmt = $this->db->prepare("
                INSERT INTO route_settings (route_name, display_name, description, is_visible, display_order)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$routeName, $displayName, $description, $isVisible, $displayOrder]);

            $this->successResponse('Route setting created successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createRouteSettings');
        }
    }

    /**
     * Update route setting
     */
    public function updateRouteSettings(string $routeName): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $displayName = $input['display_name'] ?? '';
            $description = $input['description'] ?? '';
            $isVisible = isset($input['is_visible']) ? (int)(bool)$input['is_visible'] : 1;
            $displayOrder = (int)($input['display_order'] ?? 0);

            if (empty($displayName)) {
                $this->errorResponse('Display name is required');
                return;
            }

            $stmt = $this->db->prepare("
                UPDATE route_settings
                SET display_name = ?, description = ?, is_visible = ?, display_order = ?
                WHERE route_name = ?
            ");
            $stmt->execute([$displayName, $description, $isVisible, $displayOrder, $routeName]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('Route setting not found');
                return;
            }

            $this->successResponse('Route setting updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateRouteSettings');
        }
    }

    /**
     * Update route visibility
     */
    public function updateRouteVisibility(string $routeName): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $isVisible = isset($input['is_visible']) ? (int)(bool)$input['is_visible'] : 1;

            $stmt = $this->db->prepare("
                UPDATE route_settings
                SET is_visible = ?
                WHERE route_name = ?
            ");
            $stmt->execute([$isVisible, $routeName]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('Route setting not found');
                return;
            }

            $this->successResponse('Route visibility updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateRouteVisibility');
        }
    }

    /**
     * Update all route settings
     */
    public function updateAllRouteSettings(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $routes = $input['routes'] ?? [];

            if (empty($routes)) {
                $this->errorResponse('No routes provided');
                return;
            }

            $this->db->beginTransaction();

            foreach ($routes as $route) {
                $stmt = $this->db->prepare("
                    UPDATE route_settings
                    SET display_name = ?, description = ?, is_visible = ?, display_order = ?
                    WHERE route_name = ?
                ");
                $stmt->execute([
                    $route['display_name'],
                    $route['description'] ?? '',
                    (int)(bool)$route['is_visible'],
                    (int)$route['display_order'],
                    $route['route_name']
                ]);
            }

            $this->db->commit();
            $this->successResponse('All route settings updated successfully');
        } catch (Exception $e) {
            $this->db->rollback();
            $this->handleDatabaseException($e, 'updateAllRouteSettings');
        }
    }

    /**
     * Delete route setting
     */
    public function deleteRouteSettings(string $routeName): void
    {
        try {

            $stmt = $this->db->prepare("DELETE FROM route_settings WHERE route_name = ?");
            $stmt->execute([$routeName]);

            if ($stmt->rowCount() === 0) {
                $this->errorResponse('Route setting not found');
                return;
            }

            $this->successResponse('Route setting deleted successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'deleteRouteSettings');
        }
    }


    /**
     * Update settings
     */
    public function updateSettings(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $settings = $input['settings'] ?? [];

            if (empty($settings)) {
                $this->errorResponse('No settings provided');
                return;
            }

            $this->db->beginTransaction();

            foreach ($settings as $category => $categorySettings) {
                foreach ($categorySettings as $setting) {
                    $this->updateSingleSetting($category, $setting);
                }
            }

            $this->db->commit();
            $this->successResponse('Settings updated successfully');
        } catch (Exception $e) {
            $this->db->rollback();
            $this->handleDatabaseException($e, 'updateSettings');
        }
    }

    /**
     * Update a single setting
     */
    private function updateSingleSetting(string $category, array $setting): void
    {
        $table = $this->getSettingTable($category);
        $keyColumn = $this->getSettingKeyColumn($category);
        $valueColumn = $this->getSettingValueColumn($category);

        $stmt = $this->db->prepare("
            UPDATE {$table}
            SET {$valueColumn} = ?
            WHERE {$keyColumn} = ?
        ");
        $stmt->execute([$setting['value'], $setting['key']]);

        // If no rows were affected, insert the setting
        if ($stmt->rowCount() === 0) {
            $this->insertSetting($category, $setting);
        }
    }

    /**
     * Generate user-friendly label from setting name
     */
    private function generateLabel(string $name): string
    {
        // Convert snake_case to Title Case
        return ucwords(str_replace('_', ' ', $name));
    }

    /**
     * Determine setting type based on name and value
     */
    private function determineSettingType(string $name, $value): string
    {
        $nameLower = strtolower($name);

        // Check for specific types based on name
        if (strpos($nameLower, 'password') !== false) {
            return 'password';
        }
        if (strpos($nameLower, 'email') !== false) {
            return 'email';
        }
        if (strpos($nameLower, 'port') !== false || strpos($nameLower, 'year') !== false || strpos($nameLower, 'count') !== false) {
            return 'number';
        }
        if (strpos($nameLower, 'color') !== false) {
            return 'color';
        }
        if (strpos($nameLower, 'url') !== false || strpos($nameLower, 'link') !== false) {
            return 'url';
        }
        if (strpos($nameLower, 'description') !== false || strpos($nameLower, 'content') !== false) {
            return 'textarea';
        }

        // Check for boolean values
        if (in_array(strtolower($value), ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])) {
            return 'boolean';
        }

        return 'text';
    }

    /**
     * Get configuration value from database
     */
    private function getAppConfig(string $category, string $key, $default = null)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT config_value, data_type
                FROM app_configurations
                WHERE category = ? AND config_key = ?
            ");
            $stmt->execute([$category, $key]);
            $result = $stmt->fetch();

            if ($result) {
                $value = $result['config_value'];
                switch ($result['data_type']) {
                    case 'boolean':
                        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    case 'integer':
                        return (int)$value;
                    case 'float':
                        return (float)$value;
                    case 'json':
                        return json_decode($value, true);
                    default:
                        return $value;
                }
            }

            return $default;
        } catch (Exception $e) {
            error_log("Error getting config {$category}.{$key}: " . $e->getMessage());
            return $default;
        }
    }

    /**
     * Generate description for setting
     */
    private function generateDescription(string $name): string
    {
        // Get descriptions from database configuration
        $descriptions = $this->getAppConfig('system', 'setting_descriptions', []);

        return $descriptions[$name] ?? '';
    }

    /**
     * Add missing common settings if they don't exist
     */
    private function addMissingSettings(array &$organized): void
    {
        // Add default email settings if the email category is empty
        if (empty($organized['email'])) {
            $this->ensureEmailSettingsExist();

            // Refetch email settings
            $stmt = $this->db->prepare("SELECT name, value FROM settings WHERE category = 'email' ORDER BY name");
            $stmt->execute();
            $emailSettings = $stmt->fetchAll();

            foreach ($emailSettings as $setting) {
                $organized['email'][] = [
                    'key' => $setting['name'],
                    'value' => $setting['value'],
                    'label' => $this->generateLabel($setting['name']),
                    'type' => $this->determineSettingType($setting['name'], $setting['value']),
                    'description' => $this->generateDescription($setting['name'])
                ];
            }
        }
    }

    /**
     * Insert a new setting
     */
    private function insertSetting(string $category, array $setting): void
    {
        $table = $this->getSettingTable($category);

        // Use the correct column names for the actual table structure
        $stmt = $this->db->prepare("
            INSERT INTO {$table} (category, name, value) VALUES (?, ?, ?)
        ");
        $stmt->execute([$category, $setting['key'], $setting['value']]);
    }

    /**
     * Get the appropriate table for a setting category
     */
    private function getSettingTable(string $category): string
    {
        // All settings now go to the main 'settings' table
        return 'settings';
    }

    /**
     * Get the key column name for a setting category
     */
    private function getSettingKeyColumn(string $category): string
    {
        // All settings now use the same column name
        return 'name';
    }

    /**
     * Get the value column name for a setting category
     */
    private function getSettingValueColumn(string $category): string
    {
        // All settings now use the same column name
        return 'value';
    }

    /**
     * Determine setting type based on key
     */
    private function getSettingType(string $key): string
    {
        // Get boolean settings from database configuration
        $booleanSettings = $this->getAppConfig('system', 'boolean_settings', ['allowComments', 'moderateComments', 'emailNotifications']);

        if (in_array($key, $booleanSettings)) {
            return 'boolean';
        }

        if (strpos($key, 'email') !== false || strpos($key, 'Email') !== false) {
            return 'email';
        }

        if (strpos($key, 'password') !== false || strpos($key, 'Password') !== false) {
            return 'password';
        }

        if (strpos($key, 'url') !== false || strpos($key, 'URL') !== false || strpos($key, 'Url') !== false) {
            return 'url';
        }

        return 'text';
    }

    /**
     * Ensure default settings exist
     */
    private function ensureDefaultSettings(array &$organized): void
    {
        // Add common email settings if missing
        if (empty($organized['email'])) {
            $organized['email'] = [
                [
                    'key' => 'smtp_host',
                    'value' => 'localhost',
                    'label' => 'SMTP Host',
                    'type' => 'text',
                    'description' => 'SMTP server hostname'
                ],
                [
                    'key' => 'smtp_port',
                    'value' => '587',
                    'label' => 'SMTP Port',
                    'type' => 'number',
                    'description' => 'SMTP server port'
                ],
                [
                    'key' => 'smtp_username',
                    'value' => '',
                    'label' => 'SMTP Username',
                    'type' => 'text',
                    'description' => 'SMTP authentication username'
                ],
                [
                    'key' => 'smtp_password',
                    'value' => '',
                    'label' => 'SMTP Password',
                    'type' => 'password',
                    'description' => 'SMTP authentication password'
                ]
            ];
        }

        // Add common security settings if missing
        if (empty($organized['security'])) {
            $organized['security'] = [
                [
                    'key' => 'two_factor_enabled',
                    'value' => 'false',
                    'label' => 'Two Factor Authentication',
                    'type' => 'boolean',
                    'description' => 'Enable two-factor authentication'
                ],
                [
                    'key' => 'session_timeout',
                    'value' => '3600',
                    'label' => 'Session Timeout (seconds)',
                    'type' => 'number',
                    'description' => 'User session timeout in seconds'
                ],
                [
                    'key' => 'max_login_attempts',
                    'value' => '5',
                    'label' => 'Max Login Attempts',
                    'type' => 'number',
                    'description' => 'Maximum failed login attempts before lockout'
                ]
            ];
        }
    }

    /**
     * Get table columns
     */
    private function getTableColumns(string $tableName): array
    {
        try {
            $stmt = $this->db->query("SHOW COLUMNS FROM {$tableName}");
            $columns = [];
            while ($row = $stmt->fetch()) {
                $columns[] = $row['Field'];
            }
            return $columns;
        } catch (Exception $e) {
            error_log("Error getting columns for table {$tableName}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get all roles from database
     */
    public function getRoles(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT id, name, display_name, description FROM roles ORDER BY name");
            $stmt->execute();
            $roles = $stmt->fetchAll();

            $this->successResponse('Roles retrieved successfully', ['data' => $roles]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getRoles');
        }
    }


    /**
     * Get all users with role and organization information
     */
    public function getUsersWithRoles(): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    u.id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    u.status,
                    u.created_at,
                    r.id as role_id,
                    r.name as role_name,
                    r.display_name as role_display_name,
                    o.id as organization_id,
                    o.name as organization_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN organizations o ON u.organization_id = o.id
                ORDER BY u.created_at DESC
            ");
            $stmt->execute();
            $users = $stmt->fetchAll();

            $this->successResponse('Users retrieved successfully', ['data' => $users]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getUsersWithRoles');
        }
    }

    /**
     * Check if email settings exist in database
     */
    private function ensureEmailSettingsExist(): void
    {
        try {
            // Check if email settings exist
            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM settings WHERE category = 'email'");
            $stmt->execute();
            $result = $stmt->fetch();

            if ($result['count'] == 0) {
                error_log("No email settings found in database. Please configure email settings in the admin panel or run the insert_email_settings.php script.");
            }
        } catch (Exception $e) {
            error_log("Error checking email settings: " . $e->getMessage());
        }
    }

    /**
     * Get email configuration from database settings only
     */
    private function getEmailConfiguration(): array
    {
        try {
            // Get email settings from database
            $stmt = $this->db->prepare("SELECT name, value FROM settings WHERE category = 'email'");
            $stmt->execute();
            $settings = $stmt->fetchAll();

            if (empty($settings)) {
                throw new Exception("No email settings found in database. Please configure email settings in the admin panel.");
            }

            $config = [];
            foreach ($settings as $setting) {
                $config[$setting['name']] = $setting['value'];
            }

            // Validate required settings
            $requiredSettings = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_encryption'];
            foreach ($requiredSettings as $required) {
                if (empty($config[$required])) {
                    throw new Exception("Required email setting '{$required}' is missing or empty in database.");
                }
            }

            return $config;
        } catch (Exception $e) {
            error_log("Error getting email configuration: " . $e->getMessage());
            throw new Exception("Email configuration error: " . $e->getMessage());
        }
    }

    /**
     * Test email configuration
     */
    public function testEmailConnection(): void
    {
        try {
            $emailConfig = $this->getEmailConfiguration();
            $emailService = new EmailService($emailConfig);

            $result = $emailService->testConnection();

            if ($result['success']) {
                $this->successResponse('Email connection test successful', $result);
            } else {
                $this->errorResponse($result['message'], 500);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'testEmailConnection');
        }
    }

    /**
     * Generate PDF or Image document with scholarship information
     */
    public function generateScholarshipDocument(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                $this->errorResponse('INVALID_REQUEST', 400);
                return;
            }

            $scholarships = $input['scholarships'] ?? [];
            $format = $input['format'] ?? 'pdf'; // 'pdf' or 'image'
            $orientation = $input['orientation'] ?? 'portrait'; // 'portrait' or 'landscape'
            $includeLinks = $input['includeLinks'] ?? false;
            $template = $input['template'] ?? 'table'; // 'table' or 'cards'

            if (empty($scholarships)) {
                $this->errorResponse('NO_SCHOLARSHIPS_PROVIDED', 400);
                return;
            }

            // Generate HTML content
            $html = $this->generateScholarshipTableHTML($scholarships, $includeLinks, $template, $orientation);

            if ($format === 'pdf') {
                $this->generatePDF($html, $orientation);
            } else {
                $this->generateImage($html, $orientation);
            }

        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'generateScholarshipDocument');
        }
    }

    /**
     * Generate HTML content for scholarships
     */
    private function generateScholarshipHTML(array $scholarships, bool $includeLinks, string $template, string $orientation): string
    {
        $company = "Sabiteck Limited";
        $subtitle = "Premium Scholarship Opportunities";
        $currentDate = date('F j, Y');

        // CSS styles for proper 3-column table format
        $styles = "
        <style>
            @page {
                margin: 10mm;
                size: A4 portrait;
            }

            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                background: white;
                font-size: 12px;
                line-height: 1.3;
            }
            .container {
                max-width: " . ($orientation === 'landscape' ? '100%' : '90%') . ";
                margin: 0 auto;
                background: white;
                padding: " . ($orientation === 'landscape' ? '20px' : '30px') . ";
                border-radius: 15px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: " . ($orientation === 'landscape' ? '20px' : '30px') . ";
                border-bottom: 2px solid #667eea;
                padding-bottom: " . ($orientation === 'landscape' ? '15px' : '20px') . ";
            }
            .company-name {
                font-size: 36px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 18px;
                color: #666;
                margin-bottom: 15px;
            }
            .date {
                font-size: 14px;
                color: #999;
            }
            .scholarships-container {
                margin-top: 30px;
            }
            .table-template {
                margin-top: 20px;
            }
            .scholarships-grid {
                display: grid;
                grid-template-columns: " . ($orientation === 'landscape' ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)') . ";
                gap: " . ($orientation === 'landscape' ? '6px' : '8px') . ";
                max-width: 100%;
                margin: 0 auto;
            }
            .scholarship-column {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border: 1px solid #dee2e6;
                border-radius: 6px;
                padding: 8px;
                text-align: center;
                min-height: 160px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 10px;
                line-height: 1.2;
                max-width: 140px;
            }
            .scholarship-column:nth-child(odd) {
                background: linear-gradient(135deg, #fff, #f8f9fa);
            }
            .scholarship-number {
                background: #667eea;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 10px;
                margin: 0 auto 8px auto;
            }
            .scholarship-name {
                font-weight: bold;
                color: #333;
                margin-bottom: 8px;
                font-size: 12px;
                line-height: 1.2;
                height: 36px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            }
            .scholarship-info {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
            }
            .info-row {
                margin: 3px 0;
                padding: 2px 0;
            }
            .info-label {
                font-weight: bold;
                color: #666;
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .info-value {
                color: #333;
                font-size: 10px;
                margin-top: 1px;
            }
            .amount-value {
                color: #28a745;
                font-weight: bold;
            }
            .deadline-value {
                color: #dc3545;
                font-weight: bold;
            }
            .status-value {
                background: #667eea;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 8px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .link-value {
                color: #007bff;
                font-size: 8px;
                word-break: break-all;
                text-decoration: none;
            }
            .cards-template {
                display: grid;
                grid-template-columns: " . ($orientation === 'landscape' ? 'repeat(2, 1fr)' : '1fr') . ";
                gap: 20px;
                margin-top: 20px;
            }
            .scholarship-card {
                background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                border-left: 5px solid #667eea;
            }
            .scholarship-title {
                font-size: 16px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 15px;
            }
            .scholarship-details {
                line-height: 1.6;
            }
            .scholarship-amount {
                font-size: 18px;
                font-weight: bold;
                color: #28a745;
                margin: 10px 0;
            }
            .scholarship-deadline {
                color: #dc3545;
                font-weight: bold;
            }
            .scholarship-link {
                color: #007bff;
                text-decoration: none;
                font-size: 12px;
                word-break: break-all;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                padding-top: 20px;
                border-top: 2px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>";

        $html = "<!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>$company - Scholarship Opportunities</title>
            $styles
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='company-name'>$company</div>
                    <div class='subtitle'>$subtitle</div>
                    <div class='date'>Generated on $currentDate</div>
                </div>

                <div class='scholarships-container'>";

        if ($template === 'table') {
            $html .= "<div class='table-template'>
                <div class='scholarships-grid'>";

            foreach ($scholarships as $index => $scholarship) {
                $scholarshipNumber = $index + 1;
                $title = htmlspecialchars($scholarship['title'] ?? 'Scholarship ' . $scholarshipNumber);
                $amount = htmlspecialchars($scholarship['amount'] ?? 'Amount TBD');
                $deadline = htmlspecialchars($scholarship['deadline'] ?? 'Open');
                $status = strtoupper(htmlspecialchars($scholarship['status'] ?? 'Active'));

                // Format deadline for display
                if (!empty($scholarship['deadline']) && $scholarship['deadline'] !== 'Open') {
                    try {
                        $deadlineDate = new DateTime($scholarship['deadline']);
                        $deadline = $deadlineDate->format('M j, Y');
                    } catch (Exception $e) {
                        $deadline = htmlspecialchars($scholarship['deadline']);
                    }
                }

                $html .= "<div class='scholarship-column'>
                    <div class='scholarship-number'>$scholarshipNumber</div>
                    <div class='scholarship-name'>$title</div>
                    <div class='scholarship-info'>
                        <div class='info-row'>
                            <div class='info-label'>💰 Amount</div>
                            <div class='info-value amount-value'>$amount</div>
                        </div>
                        <div class='info-row'>
                            <div class='info-label'>📅 Deadline</div>
                            <div class='info-value deadline-value'>$deadline</div>
                        </div>
                        <div class='info-row'>
                            <div class='info-label'>📋 Status</div>
                            <div class='status-value'>$status</div>
                        </div>";

                if ($includeLinks) {
                    $link = $scholarship['link'] ?? $scholarship['application_url'] ?? '#';
                    if ($link && $link !== '#') {
                        // Shorten long URLs for display
                        $displayLink = strlen($link) > 30 ? substr($link, 0, 27) . '...' : $link;
                        $html .= "<div class='info-row'>
                            <div class='info-label'>🔗 Link</div>
                            <div class='info-value'><a href='$link' class='link-value' target='_blank'>$displayLink</a></div>
                        </div>";
                    }
                }

                $html .= "</div>
                </div>";
            }

            $html .= "</div></div>";
        } else {
            // Cards template
            $html .= "<div class='cards-template'>";

            foreach ($scholarships as $scholarship) {
                $html .= "<div class='scholarship-card'>
                    <div class='scholarship-title'>" . htmlspecialchars($scholarship['title'] ?? 'N/A') . "</div>
                    <div class='scholarship-details'>
                        <div class='scholarship-amount'>Amount: " . htmlspecialchars($scholarship['amount'] ?? 'N/A') . "</div>
                        <div><strong>Deadline:</strong> <span class='scholarship-deadline'>" . htmlspecialchars($scholarship['deadline'] ?? 'N/A') . "</span></div>
                        <div><strong>Status:</strong> " . strtoupper(htmlspecialchars($scholarship['status'] ?? 'N/A')) . "</div>";

                if ($includeLinks) {
                    $link = $scholarship['link'] ?? '#';
                    $html .= "<div><strong>Link:</strong> <a href='$link' class='scholarship-link'>$link</a></div>";
                }

                $html .= "</div>
                </div>";
            }

            $html .= "</div>";
        }

        $html .= "</div>
                <div class='footer'>
                    <p><strong>$company</strong> - Professional Academic Solutions</p>
                    <p>For more information, visit our website or contact our academic advisory team.</p>
                </div>
            </div>
        </body>
        </html>";

        return $html;
    }

    /**
     * Generate PDF from HTML
     */
    private function generatePDF(string $html, string $orientation): void
    {
        try {
            // Check if autoload exists
            $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
            if (!file_exists($autoloadPath)) {
                throw new Exception('Composer autoload not found at: ' . $autoloadPath);
            }

            require_once $autoloadPath;

            if (!class_exists('\Dompdf\Dompdf')) {
                throw new Exception('Dompdf class not available. Please run: composer install');
            }

            $dompdf = new \Dompdf\Dompdf([
                'enable_remote' => true,
                'enable_html5_parser' => true,
                'default_font' => 'Arial'
            ]);

            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', $orientation);
            $dompdf->render();

            // Set headers for PDF download
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="scholarship_detail_' . date('Y-m-d') . '.pdf"');
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . strlen($dompdf->output()));

            echo $dompdf->output();
            exit;

        } catch (Exception $e) {
            error_log("PDF generation error: " . $e->getMessage());

            // Return JSON error instead of PDF
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'PDF generation failed',
                'debug' => $e->getMessage()
            ]);
            exit;
        }
    }

    /**
     * Generate Image from HTML (using HTML to image conversion)
     */
    private function generateImage(string $html, string $orientation): void
    {
        // For image generation, we'll create an HTML file optimized for conversion
        $filename = 'scholarship_image_' . time() . '.html';

        // Add additional CSS for image optimization
        $imageOptimizedHtml = str_replace(
            '</head>',
            '<style>
                @media screen {
                    body {
                        transform: scale(0.8);
                        transform-origin: top left;
                        width: 125%;
                    }
                }
            </style></head>',
            $html
        );

        // Set headers for HTML download
        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($imageOptimizedHtml));

        echo $imageOptimizedHtml;
        exit;
    }

    /**
     * Ensure settings table exists
     */
    private function ensureSettingsTable(): void
    {
        try {
            // Check if settings table exists
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'settings'");
            $stmt->execute();
            $result = $stmt->fetch();

            if (!$result) {
                // Create settings table
                $this->db->exec("
                    CREATE TABLE settings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL UNIQUE,
                        value TEXT,
                        description TEXT,
                        type VARCHAR(50) DEFAULT 'text',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
            }
        } catch (Exception $e) {
            error_log("Error ensuring settings table: " . $e->getMessage());
        }
    }

    /**
     * Generate detailed PDF or Image for a single scholarship
     */
    public function generateSingleScholarshipDocument(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Invalid request data'
                ], 400);
                return;
            }

            $scholarship = $input['scholarship'] ?? null;
            $format = $input['format'] ?? 'pdf'; // 'pdf' or 'image'
            $includeContact = $input['includeContact'] ?? true;
            $includeRequirements = $input['includeRequirements'] ?? true;

            if (!$scholarship) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No scholarship data provided'
                ], 400);
                return;
            }

            // Log the input data for debugging
            error_log("Generating single scholarship document for: " . json_encode($scholarship));

            // Generate HTML content for single scholarship detail
            $html = $this->generateSingleScholarshipHTML($scholarship, $includeContact, $includeRequirements);

            if ($format === 'pdf') {
                // Check if Dompdf is available
                if (!class_exists('\Dompdf\Dompdf')) {
                    $this->jsonResponse([
                        'success' => false,
                        'error' => 'PDF generation library not available',
                        'debug' => 'Dompdf class not found'
                    ], 500);
                    return;
                }

                $this->generatePDF($html, 'portrait');
            } else {
                // For image/HTML format, return JSON with HTML content
                $this->jsonResponse([
                    'success' => true,
                    'data' => [
                        'html_content' => $html,
                        'format' => $format
                    ]
                ]);
            }

        } catch (Exception $e) {
            error_log("Error in generateSingleScholarshipDocument: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());

            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to generate scholarship document',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate HTML content for scholarships with proper 3-column table format
     */
    private function generateScholarshipTableHTML(array $scholarships, bool $includeLinks, string $template, string $orientation): string
    {
        $company = "Sabiteck Limited";
        $subtitle = "Premium Scholarship Opportunities";
        $currentDate = date('F j, Y');

        // CSS styles for proper 3-column table format
        $styles = "
        <style>
            @page {
                margin: 10mm;
                size: A4 portrait;
            }

            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                background: white;
                font-size: 12px;
                line-height: 1.3;
            }

            .container {
                max-width: 100%;
                margin: 0 auto;
                padding: 10px;
            }

            .header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #007bff;
                padding-bottom: 10px;
            }

            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
                gap: 15px;
            }

            .logo {
                width: 40px;
                height: 40px;
                background-image: url('data:image/png;base64,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');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 50%;
            }

            .company-name {
                font-size: 22px;
                font-weight: bold;
                color: #007bff;
                margin: 0;
            }

            .subtitle {
                font-size: 14px;
                color: #666;
                margin: 5px 0;
            }

            .date {
                font-size: 12px;
                color: #888;
                margin: 0;
            }

            .scholarships-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 11px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .scholarships-table th {
                background: #2c3e50 !important;
                color: #ffffff !important;
                font-weight: bold !important;
                padding: 10px 8px;
                text-align: center;
                border: 2px solid #34495e !important;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .scholarships-table td {
                padding: 4px 6px;
                border: 1px solid #dee2e6;
                text-align: left;
                vertical-align: middle;
                line-height: 1.1;
            }

            .scholarships-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }

            .scholarships-table tr:hover {
                background-color: #e9ecef;
            }

            .number-col {
                width: 8%;
                text-align: center;
                font-weight: bold;
                color: #007bff;
                background-color: #f0f8ff !important;
            }

            .name-col {
                width: 65%;
                font-weight: 500;
                color: #2c3e50;
            }

            .deadline-col {
                width: 27%;
                text-align: center;
                color: #dc3545;
                font-weight: 500;
            }

            .scholarship-name {
                font-size: 11px;
                line-height: 1.2;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                max-height: 2.4em;
            }

            .deadline-text {
                font-size: 10px;
                white-space: nowrap;
            }

            .link-url {
                color: #007bff;
                text-decoration: none;
                font-size: 9px;
                display: block;
                margin-top: 2px;
                word-break: break-all;
                line-height: 1.1;
            }

            .footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px solid #dee2e6;
                text-align: center;
                color: #666;
                font-size: 10px;
            }

            /* Compact spacing for 18+ scholarships */
            .compact-table {
                margin: 15px 0;
            }

            .compact-table th {
                padding: 6px 4px;
                font-size: 11px;
            }

            .compact-table td {
                padding: 4px 6px;
                font-size: 10px;
            }

            .compact-table .scholarship-name {
                font-size: 10px;
                line-height: 1.1;
                max-height: 2.2em;
            }

            .compact-table .deadline-text {
                font-size: 9px;
            }

            @media print {
                body {
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }

                .scholarships-table {
                    page-break-inside: avoid;
                }
            }
        </style>";

        // HTML structure
        $html = "<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>$company - $subtitle</title>
            $styles
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo-container'>
                        <div class='logo'></div>
                        <h1 class='company-name'>$company</h1>
                    </div>
                    <div class='subtitle'>$subtitle</div>
                    <div class='date'>Generated on $currentDate</div>
                </div>";

        // Always use table format for better structure
        $isCompact = count($scholarships) > 12; // Use compact styling for more than 12 scholarships
        $tableClass = $isCompact ? 'scholarships-table compact-table' : 'scholarships-table';

        $html .= "<table class='$tableClass'>
            <thead>
                <tr>
                    <th class='number-col'>#</th>
                    <th class='name-col'>Scholarship Name</th>
                    <th class='deadline-col'>Application Deadline</th>
                </tr>
            </thead>
            <tbody>";

        $scholarshipNumber = 1;
        foreach ($scholarships as $scholarship) {
            $title = htmlspecialchars($scholarship['title'] ?? 'N/A');

            // Format deadline
            $deadline = 'N/A';
            if (!empty($scholarship['deadline'])) {
                try {
                    $deadlineDate = new DateTime($scholarship['deadline']);
                    $deadline = $deadlineDate->format('M j, Y');
                } catch (Exception $e) {
                    $deadline = htmlspecialchars($scholarship['deadline']);
                }
            }

            $html .= "<tr>
                <td class='number-col'>$scholarshipNumber</td>
                <td class='name-col'>
                    <div class='scholarship-name'>$title</div>";

            // Add application link if requested and available
            if ($includeLinks) {
                $link = $scholarship['application_url'] ?? $scholarship['link'] ?? '';
                if (!empty($link) && $link !== '#') {
                    $displayLink = strlen($link) > 45 ? substr($link, 0, 42) . '...' : $link;
                    $html .= "<a href='$link' class='link-url' target='_blank'>$displayLink</a>";
                }
            }

            $html .= "</td>
                <td class='deadline-col'>
                    <div class='deadline-text'>$deadline</div>
                </td>
            </tr>";

            $scholarshipNumber++;
        }

        $html .= "</tbody>
        </table>

        <div class='footer'>
            <p><strong>$company</strong> - Professional Academic Solutions</p>
            <p>Total Scholarships: " . count($scholarships) . " | Generated on $currentDate</p>
            <p>For more information, visit our website or contact our academic advisory team.</p>
        </div>
        </div>
        </body>
        </html>";

        return $html;
    }

    /**
     * Generate detailed HTML content for a single scholarship
     */
    private function generateSingleScholarshipHTML(array $scholarship, bool $includeContact, bool $includeRequirements): string
    {
        $company = "Sabiteck Limited";
        $currentDate = date('F j, Y');

        // Extract scholarship details - remove question marks from all text fields
        $title = htmlspecialchars(str_replace('?', '', $scholarship['title'] ?? 'N/A'));
        $description = htmlspecialchars(str_replace('?', '', $scholarship['description'] ?? ''));
        $amount = htmlspecialchars(str_replace('?', '', $scholarship['amount'] ?? 'N/A'));
        $currency = htmlspecialchars(str_replace('?', '', $scholarship['currency'] ?? 'USD'));
        $category = htmlspecialchars(str_replace('?', '', $scholarship['category'] ?? ''));
        $region = htmlspecialchars(str_replace('?', '', $scholarship['region'] ?? ''));
        $educationLevel = htmlspecialchars(str_replace('?', '', $scholarship['education_level'] ?? ''));
        $requirements = htmlspecialchars(str_replace('?', '', $scholarship['requirements'] ?? ''));
        $eligibilityCriteria = htmlspecialchars(str_replace('?', '', $scholarship['eligibility_criteria'] ?? ''));
        $applicationUrl = $scholarship['application_url'] ?? '';
        $contactEmail = htmlspecialchars(str_replace('?', '', $scholarship['contact_email'] ?? ''));
        $organization = htmlspecialchars(str_replace('?', '', $scholarship['organization'] ?? $company));

        // Format deadline
        $deadline = 'N/A';
        if (!empty($scholarship['deadline'])) {
            try {
                $deadlineDate = new DateTime($scholarship['deadline']);
                $deadline = $deadlineDate->format('F j, Y');
            } catch (Exception $e) {
                $deadline = htmlspecialchars($scholarship['deadline']);
            }
        }

        // Format amount with currency
        $formattedAmount = $amount;
        if ($amount !== 'N/A' && !empty($amount)) {
            $formattedAmount = "$currency $amount";
        }

        $styles = "
        <style>
            @page {
                margin: 5mm;
                size: A4 portrait;
            }

            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.0;
                color: #333;
                margin: 0;
                padding: 0;
                background: #fff;
                font-size: 16px;
            }

            .header {
                text-align: center;
                border-bottom: 1px solid #007bff;
                padding-bottom: 3px;
                margin-bottom: 5px;
            }

            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 3px;
                gap: 6px;
            }

            .logo {
                width: 32px;
                height: 32px;
                background-image: url('data:image/png;base64,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');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 50%;
            }

            .company-name {
                font-size: 16px;
                font-weight: bold;
                color: #007bff;
                margin: 0;
            }

            .subtitle {
                font-size: 16px;
                color: #666;
                margin: 1px 0;
            }

            .date {
                font-size: 16px;
                color: #888;
                margin-top: 2px;
            }

            .scholarship-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                text-align: center;
                margin: 5px 0;
                padding: 4px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 4px;
                border-left: 2px solid #007bff;
            }

            .main-content {
                display: grid;
                gap: 3px;
            }

            .info-section {
                background: #f8f9fa;
                padding: 2px;
                border-radius: 3px;
                border-left: 2px solid #007bff;
            }

            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 2px;
                display: flex;
                align-items: center;
                gap: 3px;
            }

            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                margin-bottom: 5px;
                align-items: start;
            }

            .info-item {
                background: white;
                padding: 4px;
                border-radius: 5px;
                border: 1px solid #dee2e6;
                border-left: 3px solid #007bff;
                min-height: 40px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .info-label {
                font-weight: bold;
                color: #495057;
                font-size: 16px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .info-value {
                color: #2c3e50;
                font-size: 16px;
                line-height: 1.4;
            }

            /* Specific styles for Basic Information section */
            .basic-info .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 6px;
                padding-bottom: 3px;
                border-bottom: 2px solid #007bff;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .basic-info .info-label {
                font-weight: bold;
                color: #495057;
                font-size: 16px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .basic-info .info-value {
                color: #2c3e50;
                font-size: 16px;
                line-height: 1.4;
            }

            .basic-info .amount-highlight {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                padding: 4px;
                border-radius: 3px;
            }

            .basic-info .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                background: #28a745;
                color: white;
            }

            .amount-highlight {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                padding: 4px;
                border-radius: 3px;
            }

            .description-section {
                background: white;
                padding: 6px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
                margin: 6px 0;
            }

            .description-text {
                font-size: 16px;
                line-height: 1.3;
                color: #2c3e50;
                column-count: 2;
                column-gap: 15px;
                column-rule: 1px solid #dee2e6;
                text-align: justify;
            }

            .requirements-section {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 6px;
                margin: 6px 0;
            }

            .contact-section {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 4px;
                padding: 6px;
                margin: 6px 0;
            }

            .application-link {
                background: #007bff;
                color: white;
                padding: 4px 8px;
                border-radius: 3px;
                text-decoration: none;
                display: inline-block;
                margin: 3px 0;
                font-weight: bold;
                text-align: center;
                font-size: 16px;
                transition: background-color 0.3s;
            }

            .application-link:hover {
                background: #0056b3;
                color: white;
                text-decoration: none;
            }

            .footer {
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #666;
                font-size: 16px;
            }

            .requirement-item {
                margin: 3px 0;
                padding: 4px;
                background: white;
                border-radius: 2px;
                border-left: 2px solid #ffc107;
                font-size: 16px;
            }

            .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                background: #28a745;
                color: white;
            }

            @media print {
                * {
                    print-color-adjust: exact !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                .scholarships-table th {
                    background: #2c3e50 !important;
                    color: #ffffff !important;
                }
            }
        </style>";

        $html = "<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>$title - $company</title>
            $styles
        </head>
        <body>
            <div class='header'>
                <div class='logo-container'>
                    <div class='logo'></div>
                    <h1 class='company-name'>$company</h1>
                </div>
                <div class='subtitle'>Scholarship Opportunity Details</div>
                <div class='date'>Generated on $currentDate</div>
            </div>

            <div class='scholarship-title'>$title</div>

            <div class='main-content'>";

        // Basic Information Section
        $html .= "<div class='info-section basic-info'>
                <div class='section-title'>📋 Basic Information</div>
                <div class='info-grid'>
                    <div class='info-item'>
                        <div class='info-label'>💰 Scholarship Amount</div>
                        <div class='info-value amount-highlight'>$formattedAmount</div>
                    </div>
                    <div class='info-item'>
                        <div class='info-label'>📅 Application Deadline</div>
                        <div class='info-value'>$deadline</div>
                    </div>";

        if (!empty($category)) {
            $html .= "<div class='info-item'>
                        <div class='info-label'>🏷️ Category</div>
                        <div class='info-value'>$category</div>
                    </div>";
        }

        if (!empty($educationLevel)) {
            $html .= "<div class='info-item'>
                        <div class='info-label'>🎓 Education Level</div>
                        <div class='info-value'>$educationLevel</div>
                    </div>";
        }

        if (!empty($region)) {
            $html .= "<div class='info-item'>
                        <div class='info-label'>🌍 Region</div>
                        <div class='info-value'>$region</div>
                    </div>";
        }

        $html .= "<div class='info-item'>
                    <div class='info-label'>✅ Status</div>
                    <div class='info-value'><span class='status-badge'>Active</span></div>
                </div>";

        $html .= "</div></div>";

        // Description Section
        if (!empty($description)) {
            $html .= "<div class='description-section'>
                        <div class='section-title'>📖 Description</div>
                        <div class='description-text'>$description</div>
                    </div>";
        }

        // Requirements Section
        if ($includeRequirements && (!empty($requirements) || !empty($eligibilityCriteria))) {
            $html .= "<div class='requirements-section'>
                        <div class='section-title'>📝 Requirements & Eligibility</div>";

            if (!empty($eligibilityCriteria)) {
                $html .= "<div class='requirement-item'>
                            <strong>Eligibility Criteria:</strong><br>$eligibilityCriteria
                        </div>";
            }

            if (!empty($requirements)) {
                $html .= "<div class='requirement-item'>
                            <strong>Additional Requirements:</strong><br>$requirements
                        </div>";
            }

            $html .= "</div>";
        }

        // Contact & Application Section
        if ($includeContact && (!empty($applicationUrl) || !empty($contactEmail) || !empty($organization))) {
            $html .= "<div class='contact-section'>
                        <div class='section-title'>📞 Application & Contact Information</div>";

            if (!empty($organization) && $organization !== $company) {
                $html .= "<div class='info-item'>
                            <div class='info-label'>🏢 Provider Organization</div>
                            <div class='info-value'>$organization</div>
                        </div>";
            }

            if (!empty($applicationUrl)) {
                $html .= "<div style='text-align: center; margin: 20px 0;'>
                            <a href='$applicationUrl' class='application-link' target='_blank'>
                                🚀 Apply for This Scholarship
                            </a>
                        </div>";
            }

            if (!empty($contactEmail)) {
                $html .= "<div class='info-item'>
                            <div class='info-label'>✉️ Contact Email</div>
                            <div class='info-value'>$contactEmail</div>
                        </div>";
            }

            $html .= "</div>";
        }

        $html .= "</div>

            <div class='footer'>
                <div>This scholarship information was generated by $company</div>
                <div>For more about other scholarships visit the link</div>
                <div><a href='https://sabiteck.com/scholarships' style='color: #007bff; text-decoration: none;'>https://sabiteck.com/scholarships</a></div>
                <div>Generated on $currentDate</div>
            </div>

        </body>
        </html>";

        return $html;
    }

    /**
     * Get current admin user ID from session/authentication
     * This is a simplified implementation - can be enhanced with proper JWT validation
     */
    private function getCurrentUserId(): int
    {
        // For now, return a default admin user ID (1)
        // TODO: Implement proper JWT token validation to get current admin user ID
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader)) {
            return 1; // Default to admin user ID 1
        }

        // Extract token and validate (simplified implementation)
        $token = str_replace('Bearer ', '', $authHeader);

        // Try to get user ID from JWT or database lookup
        try {
            $stmt = $this->db->prepare("SELECT id FROM users WHERE remember_token = ? AND role IN ('admin', 'super_admin') LIMIT 1");
            $stmt->execute([$token]);
            $user = $stmt->fetch();

            if ($user) {
                return (int)$user['id'];
            }
        } catch (Exception $e) {
            error_log("getCurrentUserId error: " . $e->getMessage());
        }

        return 1; // Default fallback to admin user ID 1
    }
}