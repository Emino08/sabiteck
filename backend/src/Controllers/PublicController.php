<?php

namespace App\Controllers;

use Exception;

class PublicController extends BaseController
{
    /**
     * Get all active services
     */
    public function getServices(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM services WHERE active = 1 ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $services = $stmt->fetchAll();

            $this->dataResponse($services, count($services));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getServices');
        }
    }

    /**
     * Get popular services (top featured or most viewed)
     */
    public function getPopularServices(): void
    {
        try {
            // Get popular services using the 'popular' column
            $stmt = $this->db->prepare("
                SELECT * FROM services
                WHERE active = 1
                ORDER BY
                    CASE WHEN popular = 1 THEN 0 ELSE 1 END,
                    sort_order ASC,
                    created_at DESC
                LIMIT 6
            ");
            $stmt->execute();
            $services = $stmt->fetchAll();

            $this->dataResponse($services, count($services));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getPopularServices');
        }
    }

    /**
     * Get service categories
     */
    public function getServiceCategories(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM service_categories WHERE active = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getServiceCategories');
        }
    }

    /**
     * Get all active jobs with filtering and pagination
     */
    public function getJobs(): void
    {
        try {
            // Get query parameters
            $search = $_GET['search'] ?? '';
            $category = $_GET['category'] ?? '';
            $location = $_GET['location'] ?? '';
            $jobType = $_GET['job_type'] ?? '';
            $remote = isset($_GET['remote']) ? (bool)$_GET['remote'] : null;
            $sort = $_GET['sort'] ?? 'newest';
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 10;
            $offset = ($page - 1) * $limit;

            // Build the WHERE clause
            $where = ["status = 'active'"];
            $params = [];

            if (!empty($search)) {
                $where[] = "(title LIKE ? OR description LIKE ? OR company_name LIKE ?)";
                $searchParam = '%' . $search . '%';
                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            if (!empty($category)) {
                $where[] = "department = ?";
                $params[] = $category;
            }

            if (!empty($location)) {
                $where[] = "location = ?";
                $params[] = $location;
            }

            if (!empty($jobType)) {
                $where[] = "type = ?";
                $params[] = $jobType;
            }

            if ($remote === true) {
                $where[] = "remote_work = 1";
            }

            $whereClause = implode(' AND ', $where);

            // Build the ORDER BY clause
            $orderBy = match($sort) {
                'oldest' => 'created_at ASC',
                'title' => 'title ASC',
                'company' => 'company_name ASC',
                'location' => 'location ASC',
                'salary_high' => 'salary_max DESC',
                'salary_low' => 'salary_min ASC',
                default => 'created_at DESC' // newest
            };

            // Get total count
            $countQuery = "SELECT COUNT(*) FROM jobs WHERE {$whereClause}";
            $stmt = $this->db->prepare($countQuery);
            $stmt->execute($params);
            $total = $stmt->fetchColumn();

            // Get jobs with pagination
            $query = "
                SELECT *
                FROM jobs
                WHERE {$whereClause}
                ORDER BY featured DESC, {$orderBy}
                LIMIT ? OFFSET ?
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([...$params, $limit, $offset]);
            $jobs = $stmt->fetchAll();

            // Process jobs data
            foreach ($jobs as &$job) {
                // Parse JSON fields
                if ($job['skills_required']) {
                    $job['skills_required'] = json_decode($job['skills_required'], true) ?: [];
                }

                // Generate slug if not present
                if (empty($job['slug'])) {
                    $job['slug'] = $this->generateSlug($job['title']) . '-' . $job['id'];
                }

                // Add formatted dates
                $job['formatted_date'] = date('F j, Y', strtotime($job['created_at']));
                $job['relative_date'] = $this->getRelativeTime($job['created_at']);
            }

            $response = [
                'success' => true,
                'data' => $jobs,
                'total' => (int)$total,
                'pagination' => [
                    'total' => (int)$total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'page' => $page,
                    'pages' => ceil($total / $limit)
                ],
                'filters' => [
                    'search' => $search,
                    'category' => $category,
                    'location' => $location,
                    'job_type' => $jobType,
                    'remote' => $remote,
                    'sort' => $sort
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobs');
        }
    }

    /**
     * Get job locations
     */
    public function getJobLocations(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT location as name FROM jobs WHERE status = 'active' ORDER BY location");
            $stmt->execute();
            $locations = $stmt->fetchAll();

            $this->dataResponse($locations, count($locations));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobLocations');
        }
    }

    /**
     * Get job categories
     */
    public function getJobCategories(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT department as name FROM jobs WHERE status = 'active' AND department IS NOT NULL AND department != '' ORDER BY department");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobCategories');
        }
    }

    /**
     * Get featured jobs
     */
    public function getFeaturedJobs(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jobs WHERE status = 'active' AND featured = 1 ORDER BY created_at DESC LIMIT 6");
            $stmt->execute();
            $jobs = $stmt->fetchAll();

            // Process jobs data to add slugs
            foreach ($jobs as &$job) {
                // Generate slug if not present
                if (empty($job['slug'])) {
                    $job['slug'] = $this->generateSlug($job['title']) . '-' . $job['id'];
                }

                // Parse JSON fields
                if ($job['skills_required']) {
                    $job['skills_required'] = json_decode($job['skills_required'], true) ?: [];
                }

                // Add formatted dates
                $job['formatted_date'] = date('F j, Y', strtotime($job['created_at']));
                $job['relative_date'] = $this->getRelativeTime($job['created_at']);
            }

            $this->dataResponse($jobs, count($jobs));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getFeaturedJobs');
        }
    }

    /**
     * Get job by slug
     */
    public function getJobBySlug(string $slug): void
    {
        try {
            // First try to find by slug
            $stmt = $this->db->prepare("SELECT * FROM jobs WHERE slug = ? AND status = 'active'");
            $stmt->execute([$slug]);
            $job = $stmt->fetch();

            // If not found by slug, try to extract ID from slug and search by ID
            if (!$job) {
                // Extract ID from slug (format: title-words-123)
                if (preg_match('/-(\d+)$/', $slug, $matches)) {
                    $id = (int)$matches[1];
                    $stmt = $this->db->prepare("SELECT * FROM jobs WHERE id = ? AND status = 'active'");
                    $stmt->execute([$id]);
                    $job = $stmt->fetch();

                    // If found by ID, generate and update the slug for future requests
                    if ($job) {
                        $generatedSlug = $this->generateSlug($job['title']) . '-' . $job['id'];
                        $job['slug'] = $generatedSlug;
                    }
                }
            }

            if (!$job) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Job not found']);
                return;
            }

            // Parse JSON fields
            if ($job['skills_required']) {
                $job['skills_required'] = json_decode($job['skills_required'], true) ?: [];
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => $job
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobBySlug');
        }
    }

    /**
     * Check if user has applied for job
     */
    public function checkJobApplication(int $jobId): void
    {
        try {
            $userEmail = $_GET['user_email'] ?? '';

            if (empty($userEmail)) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'has_applied' => false
                ]);
                return;
            }

            $stmt = $this->db->prepare("SELECT id FROM job_applications WHERE job_id = ? AND applicant_email = ?");
            $stmt->execute([(string)$jobId, $userEmail]);
            $hasApplied = $stmt->fetch() !== false;

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'has_applied' => $hasApplied
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'checkJobApplication');
        }
    }

    /**
     * Apply for job
     */
    public function applyForJob(int $jobId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
                return;
            }

            $applicantName = trim($input['applicant_name'] ?? '');
            $applicantEmail = trim($input['applicant_email'] ?? '');
            $coverLetter = trim($input['cover_letter'] ?? '');
            $resumeUrl = $input['resume_url'] ?? '';

            // Validate required fields
            if (empty($applicantName) || empty($applicantEmail)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name and email are required']);
                return;
            }

            // Validate email
            if (!filter_var($applicantEmail, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Valid email is required']);
                return;
            }

            // Check if user has already applied
            $stmt = $this->db->prepare("SELECT id FROM job_applications WHERE job_id = ? AND applicant_email = ?");
            $stmt->execute([(string)$jobId, $applicantEmail]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'You have already applied for this job']);
                return;
            }

            // Insert application
            $stmt = $this->db->prepare("
                INSERT INTO job_applications (job_id, applicant_name, applicant_email, cover_letter, resume_url, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([(string)$jobId, $applicantName, $applicantEmail, $coverLetter, $resumeUrl]);

            // Update applications count in jobs table
            $stmt = $this->db->prepare("UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?");
            $stmt->execute([$jobId]);

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Application submitted successfully!'
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'applyForJob');
        }
    }

    /**
     * Get all active scholarships
     */
    public function getScholarships(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM scholarships WHERE status = 'active' ORDER BY deadline ASC");
            $stmt->execute();
            $scholarships = $stmt->fetchAll();

            $this->dataResponse($scholarships, count($scholarships));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarships');
        }
    }

    /**
     * Get scholarship regions
     */
    public function getScholarshipRegions(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT region as name FROM scholarships WHERE status = 'active' AND region IS NOT NULL ORDER BY region");
            $stmt->execute();
            $regions = $stmt->fetchAll();

            $this->dataResponse($regions, count($regions));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipRegions');
        }
    }

    /**
     * Get education levels
     */
    public function getEducationLevels(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT education_level as name FROM scholarships WHERE status = 'active' AND education_level IS NOT NULL ORDER BY education_level");
            $stmt->execute();
            $levels = $stmt->fetchAll();

            $this->dataResponse($levels, count($levels));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getEducationLevels');
        }
    }

    /**
     * Get scholarship categories
     */
    public function getScholarshipCategories(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT category as name FROM scholarships WHERE status = 'active' AND category IS NOT NULL ORDER BY category");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            if (empty($categories)) {
                $categories = [
                    ['name' => 'Academic Excellence'],
                    ['name' => 'STEM Fields'],
                    ['name' => 'Arts & Humanities'],
                    ['name' => 'Community Service'],
                    ['name' => 'Sports & Athletics'],
                    ['name' => 'International Students'],
                    ['name' => 'Undergraduate'],
                    ['name' => 'Graduate'],
                    ['name' => 'Postgraduate'],
                    ['name' => 'Research']
                ];
            }

            $this->dataResponse($categories, count($categories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipCategories');
        }
    }

    /**
     * Get featured scholarships
     */
    public function getFeaturedScholarships(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM scholarships WHERE status = 'active' AND featured = 1 ORDER BY created_at DESC LIMIT 6");
            $stmt->execute();
            $scholarships = $stmt->fetchAll();

            if (empty($scholarships)) {
                $scholarships = [
                    [
                        'id' => 1,
                        'title' => 'Excellence in Technology Scholarship',
                        'description' => 'Supporting outstanding students pursuing degrees in computer science, engineering, and related technology fields.',
                        'amount' => '$5,000',
                        'deadline' => '2024-12-31',
                        'category' => 'STEM Fields',
                        'education_level' => 'Undergraduate',
                        'region' => 'Global',
                        'requirements' => 'Minimum 3.5 GPA, Technology-related major',
                        'featured' => 1,
                        'status' => 'active'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Global Leadership Scholarship',
                        'description' => 'Empowering future leaders who demonstrate exceptional leadership potential and community involvement.',
                        'amount' => '$7,500',
                        'deadline' => '2024-11-30',
                        'category' => 'Community Service',
                        'education_level' => 'Graduate',
                        'region' => 'International',
                        'requirements' => 'Leadership experience, Community service record',
                        'featured' => 1,
                        'status' => 'active'
                    ],
                    [
                        'id' => 3,
                        'title' => 'Innovation in Arts Scholarship',
                        'description' => 'Recognizing creative excellence and innovative approaches in arts, design, and creative industries.',
                        'amount' => '$4,000',
                        'deadline' => '2024-10-15',
                        'category' => 'Arts & Humanities',
                        'education_level' => 'Undergraduate',
                        'region' => 'North America',
                        'requirements' => 'Portfolio submission, Arts-related major',
                        'featured' => 1,
                        'status' => 'active'
                    ],
                    [
                        'id' => 4,
                        'title' => 'Research Excellence Award',
                        'description' => 'Supporting graduate students conducting groundbreaking research in their respective fields.',
                        'amount' => '$10,000',
                        'deadline' => '2025-01-31',
                        'category' => 'Research',
                        'education_level' => 'Graduate',
                        'region' => 'Global',
                        'requirements' => 'Research proposal, Faculty recommendation',
                        'featured' => 1,
                        'status' => 'active'
                    ]
                ];
            }

            $this->dataResponse($scholarships, count($scholarships));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getFeaturedScholarships');
        }
    }

    /**
     * Get scholarship by slug
     */
    public function getScholarshipBySlug(string $slug): void
    {
        try {
            // First try to find by actual slug if it exists in database
            $stmt = $this->db->prepare("SELECT * FROM scholarships WHERE slug = ? AND status = 'active' LIMIT 1");
            $stmt->execute([$slug]);
            $scholarship = $stmt->fetch();

            // If not found by slug, try to find by title conversion to slug
            if (!$scholarship) {
                $stmt = $this->db->prepare("SELECT * FROM scholarships WHERE LOWER(REPLACE(REPLACE(title, ' ', '-'), '_', '-')) = ? AND status = 'active' LIMIT 1");
                $stmt->execute([strtolower($slug)]);
                $scholarship = $stmt->fetch();
            }

            // If still not found, provide sample scholarship data based on slug
            if (!$scholarship) {
                $sampleScholarships = [
                    'community-leadership-award' => [
                        'id' => 1,
                        'title' => 'Community Leadership Award',
                        'description' => 'Recognizing outstanding leadership in community service and social impact initiatives.',
                        'amount' => '$5,000',
                        'deadline' => '2024-12-31',
                        'category' => 'Community Service',
                        'education_level' => 'Undergraduate',
                        'region' => 'Global',
                        'requirements' => 'Demonstrated leadership in community service, minimum 3.0 GPA, essay requirement',
                        'featured' => 1,
                        'status' => 'active',
                        'slug' => 'community-leadership-award',
                        'application_url' => 'https://scholarships.sabiteck.com/apply/community-leadership',
                        'eligibility' => 'Must be enrolled in an undergraduate program, demonstrate leadership experience',
                        'selection_criteria' => 'Leadership potential, academic achievement, community impact',
                        'contact_email' => 'scholarships@sabiteck.com',
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ],
                    'technology-innovation-scholarship' => [
                        'id' => 2,
                        'title' => 'Technology Innovation Scholarship',
                        'description' => 'Supporting students pursuing careers in technology and innovation.',
                        'amount' => '$7,500',
                        'deadline' => '2024-11-30',
                        'category' => 'STEM Fields',
                        'education_level' => 'Graduate',
                        'region' => 'North America',
                        'requirements' => 'Technology-related major, portfolio submission, minimum 3.5 GPA',
                        'featured' => 1,
                        'status' => 'active',
                        'slug' => 'technology-innovation-scholarship',
                        'application_url' => 'https://scholarships.sabiteck.com/apply/technology-innovation',
                        'eligibility' => 'Graduate students in STEM fields, portfolio required',
                        'selection_criteria' => 'Innovation potential, technical skills, academic excellence',
                        'contact_email' => 'tech-scholarships@sabiteck.com',
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ],
                    'global-excellence-award' => [
                        'id' => 3,
                        'title' => 'Global Excellence Award',
                        'description' => 'Empowering international students to achieve academic and professional excellence.',
                        'amount' => '$10,000',
                        'deadline' => '2025-01-15',
                        'category' => 'International Students',
                        'education_level' => 'Graduate',
                        'region' => 'International',
                        'requirements' => 'International student status, academic excellence, research proposal',
                        'featured' => 1,
                        'status' => 'active',
                        'slug' => 'global-excellence-award',
                        'application_url' => 'https://scholarships.sabiteck.com/apply/global-excellence',
                        'eligibility' => 'International students, research focus required',
                        'selection_criteria' => 'Academic merit, research potential, global impact vision',
                        'contact_email' => 'global@sabiteck.com',
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]
                ];

                $scholarship = $sampleScholarships[$slug] ?? null;
            }

            if ($scholarship) {
                $this->dataResponse($scholarship);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Scholarship not found',
                    'message' => 'The requested scholarship could not be found.'
                ]);
            }
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipBySlug');
        }
    }

    /**
     * Get all active portfolio items
     */
    public function getPortfolio(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM portfolio WHERE status = 'active' ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $portfolio = $stmt->fetchAll();

            $this->dataResponse($portfolio, count($portfolio));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getPortfolio');
        }
    }

    /**
     * Get featured portfolio projects
     */
    public function getFeaturedPortfolio(): void
    {
        try {
            // Get featured portfolio projects
            $stmt = $this->db->prepare("
                SELECT * FROM portfolio
                WHERE status = 'active'
                ORDER BY
                    CASE WHEN featured = 1 THEN 0 ELSE 1 END,
                    sort_order ASC,
                    created_at DESC
                LIMIT 6
            ");
            $stmt->execute();
            $portfolio = $stmt->fetchAll();

            $this->dataResponse($portfolio, count($portfolio));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getFeaturedPortfolio');
        }
    }

    /**
     * Get portfolio categories
     */
    public function getPortfolioCategories(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM portfolio_categories WHERE active = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getPortfolioCategories');
        }
    }

    /**
     * Get all active team members
     */
    public function getTeam(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM team WHERE active = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $team = $stmt->fetchAll();

            $this->dataResponse($team, count($team));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getTeam');
        }
    }

    /**
     * Get all active announcements
     */
    public function getAnnouncements(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM announcements WHERE active = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC");
            $stmt->execute();
            $announcements = $stmt->fetchAll();

            $this->dataResponse($announcements, count($announcements));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnnouncements');
        }
    }

    /**
     * Get blog categories (content categories)
     */
    public function getBlogCategories(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM content_categories WHERE active = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getBlogCategories');
        }
    }

    /**
     * Get content by type
     */
    public function getContent(): void
    {
        try {
            // Get query parameters
            $type = $_GET['type'] ?? null;
            $category = $_GET['category'] ?? null;
            $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : null;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

            // Build the query
            $where = ["published = 1"];
            $params = [];

            if ($type) {
                $where[] = "content_type = ?";
                $params[] = $type;
            }

            if ($category) {
                $where[] = "category = ?";
                $params[] = $category;
            }

            if ($featured !== null) {
                $where[] = "featured = ?";
                $params[] = $featured ? 1 : 0;
            }

            $whereClause = implode(' AND ', $where);

            // Get total count
            $countQuery = "SELECT COUNT(*) FROM content WHERE {$whereClause}";
            $stmt = $this->db->prepare($countQuery);
            $stmt->execute($params);
            $total = $stmt->fetchColumn();

            // Get content with pagination
            $query = "
                SELECT
                    id, title, slug, content_type, content, excerpt,
                    category, featured_image, author, tags,
                    meta_description, meta_title, views, comment_count, like_count,
                    featured, published, created_at, updated_at
                FROM content
                WHERE {$whereClause}
                ORDER BY
                    CASE WHEN featured = 1 THEN 0 ELSE 1 END,
                    created_at DESC
                LIMIT ? OFFSET ?
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([...$params, $limit, $offset]);
            $content = $stmt->fetchAll();

            // Process the content
            foreach ($content as &$item) {
                // Parse JSON fields
                $item['tags'] = json_decode($item['tags'] ?? '[]', true) ?: [];
                $item['gallery'] = json_decode($item['gallery'] ?? '[]', true) ?: [];

                // Add computed fields
                $item['summary'] = $item['excerpt'] ?: substr(strip_tags($item['content']), 0, 200) . '...';
                $item['read_time'] = ceil(str_word_count(strip_tags($item['content'])) / 200); // ~200 words per minute

                // Format dates
                $item['formatted_date'] = date('F j, Y', strtotime($item['created_at']));
                $item['relative_date'] = $this->getRelativeTime($item['created_at']);
            }

            $response = [
                'success' => true,
                'data' => $content,
                'pagination' => [
                    'total' => (int)$total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'pages' => ceil($total / $limit),
                    'current_page' => floor($offset / $limit) + 1
                ],
                'filters' => [
                    'type' => $type,
                    'category' => $category,
                    'featured' => $featured
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContent');
        }
    }

    /**
     * Get relative time string
     */
    private function getRelativeTime(string $datetime): string
    {
        $time = time() - strtotime($datetime);

        if ($time < 60) return 'Just now';
        if ($time < 3600) return floor($time/60) . ' minutes ago';
        if ($time < 86400) return floor($time/3600) . ' hours ago';
        if ($time < 2592000) return floor($time/86400) . ' days ago';
        if ($time < 31104000) return floor($time/2592000) . ' months ago';
        return floor($time/31104000) . ' years ago';
    }

    /**
     * Get content types
     */
    public function getContentTypes(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM content_types WHERE active = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $types = $stmt->fetchAll();

            $this->dataResponse($types, count($types));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContentTypes');
        }
    }

    /**
     * Get application routes (simplified version)
     */
    public function getRoutes(): void
    {
        try {
            // Get navigation routes from the database
            $stmt = $this->db->prepare("
                SELECT route_name, display_name, description, is_visible, display_order
                FROM route_settings
                WHERE is_visible = 1
                ORDER BY display_order ASC, route_name ASC
            ");
            $stmt->execute();
            $routes = $stmt->fetchAll();

            // Transform the data to the format expected by the frontend
            $navigationRoutes = [];
            foreach ($routes as $route) {
                $navigationRoutes[] = [
                    'route_name' => $route['route_name'],
                    'display_name' => $route['display_name'],
                    'description' => $route['description'],
                    'href' => $route['route_name'] === 'home' ? '/' : '/' . $route['route_name'],
                    'is_visible' => (bool)$route['is_visible'],
                    'display_order' => (int)$route['display_order']
                ];
            }

            $response = [
                'success' => true,
                'routes' => $navigationRoutes
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getRoutes');
        }
    }

    /**
     * Newsletter subscription endpoint
     */
    public function subscribeNewsletter(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
                return;
            }

            $email = trim($input['email'] ?? '');
            $name = trim($input['name'] ?? '');
            $source = $input['source'] ?? 'website';

            // Validate email
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Valid email is required']);
                return;
            }

            // Check if email already exists
            $stmt = $this->db->prepare("SELECT id, status FROM newsletter_subscriptions WHERE email = ?");
            $stmt->execute([$email]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['status'] === 'active') {
                    echo json_encode(['success' => true, 'message' => 'You are already subscribed to our newsletter']);
                    return;
                } else {
                    // Reactivate subscription
                    $stmt = $this->db->prepare("
                        UPDATE newsletter_subscriptions
                        SET status = 'active', updated_at = CURRENT_TIMESTAMP, name = ?
                        WHERE email = ?
                    ");
                    $stmt->execute([$name, $email]);
                    echo json_encode(['success' => true, 'message' => 'Welcome back! Your subscription has been reactivated']);
                    return;
                }
            }

            // Create new subscription
            $stmt = $this->db->prepare("
                INSERT INTO newsletter_subscriptions (email, name, status, subscription_source, created_at, updated_at)
                VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$email, $name, $source]);

            // Also add to newsletter_subscribers table for admin management
            $stmt = $this->db->prepare("
                INSERT INTO newsletter_subscribers (email, name, subscribed_at, active, status, verified, subscription_type)
                VALUES (?, ?, CURRENT_TIMESTAMP, 1, 'active', 0, 'website')
                ON DUPLICATE KEY UPDATE
                    active = 1,
                    status = 'active',
                    name = VALUES(name)
            ");
            $stmt->execute([$email, $name]);

            $response = [
                'success' => true,
                'message' => 'Thank you for subscribing to our newsletter!'
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            error_log('Newsletter subscription error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to process subscription']);
        }
    }

    /**
     * Get like status for content
     */
    public function getContentLikeStatus(int $contentId): void
    {
        try {
            $userIdentifier = $_GET['userIdentifier'] ?? '';

            if (empty($userIdentifier)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User identifier is required']);
                return;
            }

            // Check if user has liked this content
            $stmt = $this->db->prepare("SELECT id FROM content_likes WHERE content_id = ? AND user_identifier = ?");
            $stmt->execute([$contentId, $userIdentifier]);
            $liked = $stmt->fetch() !== false;

            // Get total like count for this content
            $stmt = $this->db->prepare("SELECT COUNT(*) as like_count FROM content_likes WHERE content_id = ?");
            $stmt->execute([$contentId]);
            $likeCount = $stmt->fetchColumn();

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'liked' => $liked,
                'like_count' => (int)$likeCount
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContentLikeStatus');
        }
    }

    /**
     * Toggle like for content
     */
    public function toggleContentLike(int $contentId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $userIdentifier = $input['user_identifier'] ?? '';

            if (empty($userIdentifier)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User identifier is required']);
                return;
            }

            // Check if user has already liked this content
            $stmt = $this->db->prepare("SELECT id FROM content_likes WHERE content_id = ? AND user_identifier = ?");
            $stmt->execute([$contentId, $userIdentifier]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Remove like
                $stmt = $this->db->prepare("DELETE FROM content_likes WHERE content_id = ? AND user_identifier = ?");
                $stmt->execute([$contentId, $userIdentifier]);
                $liked = false;
            } else {
                // Add like
                $stmt = $this->db->prepare("INSERT INTO content_likes (content_id, user_identifier, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
                $stmt->execute([$contentId, $userIdentifier]);
                $liked = true;
            }

            // Update like count in content table
            $stmt = $this->db->prepare("SELECT COUNT(*) as like_count FROM content_likes WHERE content_id = ?");
            $stmt->execute([$contentId]);
            $likeCount = $stmt->fetchColumn();

            $stmt = $this->db->prepare("UPDATE content SET like_count = ? WHERE id = ?");
            $stmt->execute([$likeCount, $contentId]);

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'liked' => $liked,
                'like_count' => (int)$likeCount
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'toggleContentLike');
        }
    }

    /**
     * Get comments for content
     */
    public function getContentComments(int $contentId): void
    {
        try {
            // Get all comments for this content
            $stmt = $this->db->prepare("
                SELECT id, parent_id, author_name, author_email,
                       COALESCE(NULLIF(comment_text, ''), comment) as comment, created_at
                FROM content_comments
                WHERE content_id = ? AND (status = 'approved' OR approved = 1)
                ORDER BY created_at ASC
            ");
            $stmt->execute([$contentId]);
            $comments = $stmt->fetchAll();

            // Organize comments into a hierarchical structure
            $commentMap = [];
            $rootComments = [];

            // First pass: create all comment objects
            foreach ($comments as $comment) {
                $comment['replies'] = [];
                $commentMap[$comment['id']] = $comment;
            }

            // Second pass: organize into hierarchy
            foreach ($comments as $comment) {
                if ($comment['parent_id'] === null) {
                    $rootComments[] = &$commentMap[$comment['id']];
                } else {
                    if (isset($commentMap[$comment['parent_id']])) {
                        $commentMap[$comment['parent_id']]['replies'][] = &$commentMap[$comment['id']];
                    }
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'comments' => array_values($rootComments)
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getContentComments');
        }
    }

    /**
     * Add comment to content
     */
    public function addContentComment(int $contentId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
                return;
            }

            $authorName = trim($input['author_name'] ?? '');
            $authorEmail = trim($input['author_email'] ?? '');
            $comment = trim($input['comment'] ?? '');
            $parentId = isset($input['parent_id']) ? (int)$input['parent_id'] : null;

            // Validate required fields
            if (empty($authorName) || empty($authorEmail) || empty($comment)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name, email, and comment are required']);
                return;
            }

            // Validate email
            if (!filter_var($authorEmail, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Valid email is required']);
                return;
            }

            // Insert comment using both comment fields and both approval fields for compatibility
            $stmt = $this->db->prepare("
                INSERT INTO content_comments (content_id, parent_id, author_name, author_email, comment, comment_text, status, approved, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'approved', 1, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$contentId, $parentId, $authorName, $authorEmail, $comment, $comment]);

            // Update comment count in content table
            $stmt = $this->db->prepare("SELECT COUNT(*) as comment_count FROM content_comments WHERE content_id = ? AND (status = 'approved' OR approved = 1)");
            $stmt->execute([$contentId]);
            $commentCount = $stmt->fetchColumn();

            $stmt = $this->db->prepare("UPDATE content SET comment_count = ? WHERE id = ?");
            $stmt->execute([$commentCount, $contentId]);

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Comment added successfully',
                'comment_count' => (int)$commentCount
            ]);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'addContentComment');
        }
    }

    /**
     * Generate URL-friendly slug from title
     */
    private function generateSlug(string $title): string
    {
        // Convert to lowercase
        $slug = strtolower($title);

        // Replace non-alphanumeric characters with hyphens
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        // Remove leading/trailing hyphens
        $slug = trim($slug, '-');

        // Limit length to 50 characters
        $slug = substr($slug, 0, 50);

        // Remove trailing hyphens again in case substr cut in the middle of a word
        $slug = rtrim($slug, '-');

        return $slug ?: 'job';
    }

    /**
     * Get about page content
     */
    public function getAboutContent()
    {
        try {
            // Check if content table exists first
            $tableCheck = $this->db->query("SHOW TABLES LIKE 'content'");
            if ($tableCheck->rowCount() == 0) {
                // Table doesn't exist, return default content
                $content = [
                    'id' => null,
                    'title' => 'About Us',
                    'content' => 'Welcome to our company. We are dedicated to providing excellent services and solutions.',
                    'meta_description' => 'Learn more about our company, mission, and values.',
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                $this->jsonResponse($content);
                return;
            }

            $stmt = $this->db->prepare("
                SELECT id, title, content, meta_description, updated_at
                FROM content
                WHERE type = 'about' AND status = 'published'
                ORDER BY updated_at DESC
                LIMIT 1
            ");
            $stmt->execute();
            $content = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$content) {
                // Return default content if none exists
                $content = [
                    'id' => null,
                    'title' => 'About Us',
                    'content' => 'Welcome to our company. We are dedicated to providing excellent services and solutions.',
                    'meta_description' => 'Learn more about our company, mission, and values.',
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }

            $this->jsonResponse($content);
        } catch (Exception $e) {
            // Return default content if any error occurs
            $content = [
                'id' => null,
                'title' => 'About Us',
                'content' => 'Welcome to our company. We are dedicated to providing excellent services and solutions.',
                'meta_description' => 'Learn more about our company, mission, and values.',
                'updated_at' => date('Y-m-d H:i:s')
            ];
            $this->jsonResponse($content);
        }
    }

    /**
     * Get company information
     */
    public function getCompanyInfo()
    {
        try {
            // Return default company info directly
            $info = [
                'id' => null,
                'company_name' => 'DevCo Solutions',
                'description' => 'We are a technology company focused on innovative solutions.',
                'founded_year' => '2020',
                'employees_count' => '50+',
                'headquarters' => 'Tech City',
                'industry' => 'Technology',
                'website' => 'https://devco.com',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->jsonResponse($info);
        } catch (Exception $e) {
            // Return default company info if any error occurs
            $info = [
                'id' => null,
                'company_name' => 'DevCo Solutions',
                'description' => 'We are a technology company focused on innovative solutions.',
                'founded_year' => '2020',
                'employees_count' => '50+',
                'headquarters' => 'Tech City',
                'industry' => 'Technology',
                'website' => 'https://devco.com',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            $this->jsonResponse($info);
        }
    }

    /**
     * Get company mission
     */
    public function getCompanyMission()
    {
        try {
            // Return default mission directly
            $mission = [
                'id' => null,
                'title' => 'Our Mission',
                'description' => 'To deliver innovative technology solutions that empower businesses and improve lives.',
                'vision' => 'To be a leading technology company that shapes the future through innovation.',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->jsonResponse($mission);
        } catch (Exception $e) {
            // Return default mission if any error occurs
            $mission = [
                'id' => null,
                'title' => 'Our Mission',
                'description' => 'To deliver innovative technology solutions that empower businesses and improve lives.',
                'vision' => 'To be a leading technology company that shapes the future through innovation.',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            $this->jsonResponse($mission);
        }
    }

    /**
     * Get company values
     */
    public function getCompanyValues()
    {
        try {
            // Return default values directly
            $values = [
                [
                    'id' => 1,
                    'title' => 'Innovation',
                    'description' => 'We constantly push boundaries and embrace new technologies to deliver cutting-edge solutions.',
                    'icon' => 'lightbulb',
                    'sort_order' => 1,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 2,
                    'title' => 'Excellence',
                    'description' => 'We strive for excellence in everything we do, from code quality to customer service.',
                    'icon' => 'star',
                    'sort_order' => 2,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 3,
                    'title' => 'Collaboration',
                    'description' => 'We believe in the power of teamwork and collaborative problem-solving.',
                    'icon' => 'users',
                    'sort_order' => 3,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 4,
                    'title' => 'Integrity',
                    'description' => 'We operate with honesty, transparency, and ethical business practices.',
                    'icon' => 'shield',
                    'sort_order' => 4,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];

            $this->jsonResponse(['values' => $values]);
        } catch (Exception $e) {
            // Return default values if any error occurs
            $values = [
                [
                    'id' => 1,
                    'title' => 'Innovation',
                    'description' => 'We constantly push boundaries and embrace new technologies to deliver cutting-edge solutions.',
                    'icon' => 'lightbulb',
                    'sort_order' => 1,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 2,
                    'title' => 'Excellence',
                    'description' => 'We strive for excellence in everything we do, from code quality to customer service.',
                    'icon' => 'star',
                    'sort_order' => 2,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 3,
                    'title' => 'Collaboration',
                    'description' => 'We believe in the power of teamwork and collaborative problem-solving.',
                    'icon' => 'users',
                    'sort_order' => 3,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 4,
                    'title' => 'Integrity',
                    'description' => 'We operate with honesty, transparency, and ethical business practices.',
                    'icon' => 'shield',
                    'sort_order' => 4,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];
            $this->jsonResponse(['values' => $values]);
        }
    }

    /**
     * Get featured team members
     */
    public function getFeaturedTeamMembers()
    {
        try {
            // Return default featured team members
            $teamMembers = [
                [
                    'id' => 1,
                    'name' => 'John Smith',
                    'position' => 'CEO & Founder',
                    'department' => 'Leadership',
                    'bio' => 'Visionary leader with 15+ years of experience in technology and business development.',
                    'image' => '/images/team/john-smith.jpg',
                    'social_links' => [
                        'linkedin' => 'https://linkedin.com/in/johnsmith',
                        'twitter' => 'https://twitter.com/johnsmith'
                    ],
                    'featured' => 1,
                    'skills' => ['Leadership', 'Strategy', 'Business Development'],
                    'experience_years' => 15,
                    'email' => 'john@devco.com',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 2,
                    'name' => 'Sarah Johnson',
                    'position' => 'CTO',
                    'department' => 'Engineering',
                    'bio' => 'Technical expert specializing in scalable architectures and modern development practices.',
                    'image' => '/images/team/sarah-johnson.jpg',
                    'social_links' => [
                        'linkedin' => 'https://linkedin.com/in/sarahjohnson',
                        'github' => 'https://github.com/sarahjohnson'
                    ],
                    'featured' => 1,
                    'skills' => ['System Architecture', 'Full-Stack Development', 'DevOps'],
                    'experience_years' => 12,
                    'email' => 'sarah@devco.com',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 3,
                    'name' => 'Michael Chen',
                    'position' => 'Lead Designer',
                    'department' => 'Design',
                    'bio' => 'Creative designer focused on user experience and innovative digital solutions.',
                    'image' => '/images/team/michael-chen.jpg',
                    'social_links' => [
                        'linkedin' => 'https://linkedin.com/in/michaelchen',
                        'dribbble' => 'https://dribbble.com/michaelchen'
                    ],
                    'featured' => 1,
                    'skills' => ['UI/UX Design', 'Branding', 'Product Design'],
                    'experience_years' => 8,
                    'email' => 'michael@devco.com',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 4,
                    'name' => 'Emily Rodriguez',
                    'position' => 'Marketing Director',
                    'department' => 'Marketing',
                    'bio' => 'Strategic marketer with expertise in digital campaigns and brand development.',
                    'image' => '/images/team/emily-rodriguez.jpg',
                    'social_links' => [
                        'linkedin' => 'https://linkedin.com/in/emilyrodriguez',
                        'twitter' => 'https://twitter.com/emilyrodriguez'
                    ],
                    'featured' => 1,
                    'skills' => ['Digital Marketing', 'Brand Strategy', 'Content Marketing'],
                    'experience_years' => 10,
                    'email' => 'emily@devco.com',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];

            $this->jsonResponse(['team_members' => $teamMembers]);
        } catch (Exception $e) {
            // Return default team members if any error occurs
            $teamMembers = [
                [
                    'id' => 1,
                    'name' => 'John Smith',
                    'position' => 'CEO & Founder',
                    'department' => 'Leadership',
                    'bio' => 'Visionary leader with 15+ years of experience in technology and business development.',
                    'image' => '/images/team/john-smith.jpg',
                    'featured' => 1,
                    'skills' => ['Leadership', 'Strategy', 'Business Development'],
                    'experience_years' => 15,
                    'email' => 'john@devco.com',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];
            $this->jsonResponse(['team_members' => $teamMembers]);
        }
    }

    /**
     * Get team departments
     */
    public function getTeamDepartments()
    {
        try {
            // Return default departments
            $departments = [
                [
                    'id' => 1,
                    'name' => 'Leadership',
                    'description' => 'Executive team providing strategic direction and vision.',
                    'head' => 'John Smith',
                    'member_count' => 3,
                    'icon' => 'crown',
                    'color' => '#3B82F6',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 2,
                    'name' => 'Engineering',
                    'description' => 'Software development and technical implementation team.',
                    'head' => 'Sarah Johnson',
                    'member_count' => 15,
                    'icon' => 'code',
                    'color' => '#10B981',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 3,
                    'name' => 'Design',
                    'description' => 'Creative team focused on user experience and visual design.',
                    'head' => 'Michael Chen',
                    'member_count' => 8,
                    'icon' => 'palette',
                    'color' => '#F59E0B',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 4,
                    'name' => 'Marketing',
                    'description' => 'Brand development and customer engagement specialists.',
                    'head' => 'Emily Rodriguez',
                    'member_count' => 6,
                    'icon' => 'megaphone',
                    'color' => '#EF4444',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 5,
                    'name' => 'Operations',
                    'description' => 'Business operations and project management team.',
                    'head' => 'David Kim',
                    'member_count' => 5,
                    'icon' => 'settings',
                    'color' => '#8B5CF6',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 6,
                    'name' => 'Sales',
                    'description' => 'Client acquisition and relationship management specialists.',
                    'head' => 'Lisa Wang',
                    'member_count' => 4,
                    'icon' => 'trending-up',
                    'color' => '#06B6D4',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];

            $this->jsonResponse(['departments' => $departments]);
        } catch (Exception $e) {
            // Return default departments if any error occurs
            $departments = [
                [
                    'id' => 1,
                    'name' => 'Engineering',
                    'description' => 'Software development and technical implementation team.',
                    'head' => 'Technical Lead',
                    'member_count' => 10,
                    'icon' => 'code',
                    'color' => '#10B981',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]
            ];
            $this->jsonResponse(['departments' => $departments]);
        }
    }
}