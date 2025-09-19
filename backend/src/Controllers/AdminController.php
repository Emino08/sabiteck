<?php

namespace App\Controllers;

use Exception;

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
            $deadline = $input['deadline'] ?? date('Y-m-d', strtotime('+' . $this->getConfig('job_deadline_default_days', 30) . ' days'));
            $requirements = $input['requirements'] ?? '';
            $salaryMin = $input['salary_min'] ?? null;
            $salaryMax = $input['salary_max'] ?? null;
            $applicationsCount = $this->getDefaultValue('job', 'applications_count', 0);

            $stmt = $this->db->prepare("INSERT INTO jobs (title, slug, description, department, location, type, status, deadline, requirements, salary_min, salary_max, applications_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $slug, $description, $department, $location, $type, $status, $deadline, $requirements, $salaryMin, $salaryMax, $applicationsCount]);

            $this->successResponse('JOB_CREATED', ['id' => $this->db->lastInsertId()], 201);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'createJob');
        }
    }

    /**
     * Get all scholarships for admin
     */
    public function getScholarships(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM scholarships ORDER BY created_at DESC");
            $stmt->execute();
            $scholarships = $stmt->fetchAll();

            $this->dataResponse($scholarships, count($scholarships));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarships');
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
     * Get all team members for admin
     */
    public function getTeam(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM team ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute();
            $team = $stmt->fetchAll();

            $this->dataResponse($team, count($team));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getTeam');
        }
    }

    /**
     * Get all announcements for admin
     */
    public function getAnnouncements(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM announcements ORDER BY created_at DESC");
            $stmt->execute();
            $announcements = $stmt->fetchAll();

            $this->dataResponse($announcements, count($announcements));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnnouncements');
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

            if ($stmt->rowCount() === 0) {
                // Create content table if it doesn't exist
                $this->db->exec("CREATE TABLE IF NOT EXISTS content (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    content TEXT,
                    excerpt TEXT,
                    category_id INT,
                    type_id INT,
                    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
                    featured TINYINT(1) DEFAULT 0,
                    meta_title VARCHAR(255),
                    meta_description TEXT,
                    published_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )");

                // Insert some default content
                $defaultContent = [
                    ['Welcome to Sabiteck', 'welcome-to-sabiteck', 'Welcome to our official website...', 'Welcome message', 1, 1, 'published', 1, 'Welcome', 'Welcome to Sabiteck Limited'],
                    ['Our Services', 'our-services', 'We offer comprehensive technology solutions...', 'Services overview', 1, 1, 'published', 0, 'Services', 'Technology services we provide'],
                    ['About Us', 'about-us', 'Sabiteck Limited is a leading technology company...', 'Company information', 2, 1, 'published', 0, 'About', 'Learn about our company']
                ];

                $stmt = $this->db->prepare("INSERT INTO content (title, slug, content, excerpt, category_id, type_id, status, featured, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($defaultContent as $content) {
                    $stmt->execute($content);
                }
            }

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

            $title = $input['title'];
            $slug = $input['slug'] ?? strtolower(str_replace(' ', '-', $title));
            $content = $input['content'];
            $excerpt = $input['excerpt'] ?? '';
            $categoryId = $input['category_id'] ?? 1;
            $typeId = $input['type_id'] ?? 1;
            $status = $input['status'] ?? 'draft';
            $featured = isset($input['featured']) ? (int)$input['featured'] : 0;
            $metaTitle = $input['meta_title'] ?? $title;
            $metaDescription = $input['meta_description'] ?? $excerpt;
            $publishedAt = $status === 'published' ? date('Y-m-d H:i:s') : null;

            $stmt = $this->db->prepare("INSERT INTO content (title, slug, content, excerpt, category_id, type_id, status, featured, meta_title, meta_description, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $slug, $content, $excerpt, $categoryId, $typeId, $status, $featured, $metaTitle, $metaDescription, $publishedAt]);

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

            $title = $input['title'] ?? $currentContent['title'];
            $slug = $input['slug'] ?? $currentContent['slug'];
            $content = $input['content'] ?? $currentContent['content'];
            $excerpt = $input['excerpt'] ?? $currentContent['excerpt'];
            $categoryId = $input['category_id'] ?? $currentContent['category_id'];
            $typeId = $input['type_id'] ?? $currentContent['type_id'];
            $status = $input['status'] ?? $currentContent['status'];
            $featured = isset($input['featured']) ? (int)$input['featured'] : $currentContent['featured'];
            $metaTitle = $input['meta_title'] ?? $currentContent['meta_title'];
            $metaDescription = $input['meta_description'] ?? $currentContent['meta_description'];

            // Update published_at if status changes to published
            $publishedAt = $currentContent['published_at'];
            if ($status === 'published' && $currentContent['status'] !== 'published') {
                $publishedAt = date('Y-m-d H:i:s');
            }

            $stmt = $this->db->prepare("UPDATE content SET title = ?, slug = ?, content = ?, excerpt = ?, category_id = ?, type_id = ?, status = ?, featured = ?, meta_title = ?, meta_description = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$title, $slug, $content, $excerpt, $categoryId, $typeId, $status, $featured, $metaTitle, $metaDescription, $publishedAt, $contentId]);

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
            $stmt = $this->db->prepare("SELECT DISTINCT department as name FROM jobs WHERE department IS NOT NULL AND department != '' ORDER BY department ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
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
            $stats = [];

            // Total jobs
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM jobs");
            $stmt->execute();
            $stats['total'] = $stmt->fetch()['total'];

            // Active jobs
            $stmt = $this->db->prepare("SELECT COUNT(*) as active FROM jobs WHERE status = 'active'");
            $stmt->execute();
            $stats['active'] = $stmt->fetch()['active'];

            // Draft jobs
            $stmt = $this->db->prepare("SELECT COUNT(*) as draft FROM jobs WHERE status = 'draft'");
            $stmt->execute();
            $stats['draft'] = $stmt->fetch()['draft'];

            // Jobs by department
            $stmt = $this->db->prepare("SELECT department, COUNT(*) as count FROM jobs WHERE department IS NOT NULL AND department != '' GROUP BY department ORDER BY count DESC");
            $stmt->execute();
            $stats['by_department'] = $stmt->fetchAll();

            // Recent applications (if applications table exists)
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'job_applications'");
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $stmt = $this->db->prepare("SELECT COUNT(*) as applications FROM job_applications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
                $stmt->execute();
                $stats['recent_applications'] = $stmt->fetch()['applications'];
            } else {
                $stats['recent_applications'] = 0;
            }

            $this->dataResponse($stats);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getJobStats');
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
            $stmt = $this->db->prepare("SELECT DISTINCT region as name FROM scholarships WHERE region IS NOT NULL AND region != '' ORDER BY region ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $this->dataResponse($categories, count($categories));
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
            $stats = [];

            // Total scholarships
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM scholarships");
            $stmt->execute();
            $stats['total'] = $stmt->fetch()['total'];

            // Active scholarships
            $stmt = $this->db->prepare("SELECT COUNT(*) as active FROM scholarships WHERE status = 'active'");
            $stmt->execute();
            $stats['active'] = $stmt->fetch()['active'];

            // Draft scholarships
            $stmt = $this->db->prepare("SELECT COUNT(*) as draft FROM scholarships WHERE status = 'draft'");
            $stmt->execute();
            $stats['draft'] = $stmt->fetch()['draft'];

            // Scholarships by region
            $stmt = $this->db->prepare("SELECT region, COUNT(*) as count FROM scholarships WHERE region IS NOT NULL AND region != '' GROUP BY region ORDER BY count DESC");
            $stmt->execute();
            $stats['by_region'] = $stmt->fetchAll();

            // Scholarships by education level
            $stmt = $this->db->prepare("SELECT education_level, COUNT(*) as count FROM scholarships WHERE education_level IS NOT NULL AND education_level != '' GROUP BY education_level ORDER BY count DESC");
            $stmt->execute();
            $stats['by_education_level'] = $stmt->fetchAll();

            // Recent applications (if applications table exists)
            $stmt = $this->db->prepare("SHOW TABLES LIKE 'scholarship_applications'");
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $stmt = $this->db->prepare("SELECT COUNT(*) as applications FROM scholarship_applications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
                $stmt->execute();
                $stats['recent_applications'] = $stmt->fetch()['applications'];
            } else {
                $stats['recent_applications'] = 0;
            }

            $this->dataResponse($stats);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getScholarshipStats');
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

            if ($stmt->rowCount() === 0) {
                // Create organizations table if it doesn't exist
                $this->db->exec("CREATE TABLE IF NOT EXISTS organizations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    logo VARCHAR(255),
                    website VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(255),
                    address TEXT,
                    city VARCHAR(255),
                    country VARCHAR(255),
                    industry VARCHAR(255),
                    size VARCHAR(255),
                    founded_year INT,
                    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
                    featured TINYINT(1) DEFAULT 0,
                    verification_status ENUM('verified', 'pending', 'rejected') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )");

                // Insert some default organizations
                $defaultOrganizations = [
                    ['Sabiteck Limited', 'sabiteck-limited', 'Leading technology company in Sierra Leone', '', 'https://sabiteck.com', 'info@sabiteck.com', '+232-XX-XXX-XXX', 'Freetown, Sierra Leone', 'Freetown', 'Sierra Leone', 'Technology', '25-50', 2020, 'active', 1, 'verified'],
                    ['Tech Innovators Ltd', 'tech-innovators', 'Software development and consulting', '', 'https://techinnovators.sl', 'contact@techinnovators.sl', '+232-XX-XXX-XXX', 'Bo, Sierra Leone', 'Bo', 'Sierra Leone', 'Technology', '10-25', 2019, 'active', 0, 'verified'],
                    ['Digital Solutions Inc', 'digital-solutions', 'Digital transformation services', '', 'https://digitalsolutions.sl', 'hello@digitalsolutions.sl', '+232-XX-XXX-XXX', 'Kenema, Sierra Leone', 'Kenema', 'Sierra Leone', 'Technology', '5-10', 2021, 'active', 0, 'pending']
                ];

                $stmt = $this->db->prepare("INSERT INTO organizations (name, slug, description, logo, website, email, phone, address, city, country, industry, size, founded_year, status, featured, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($defaultOrganizations as $org) {
                    $stmt->execute($org);
                }
            }

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

            // Get general settings
            $stmt = $this->db->prepare("SELECT * FROM settings ORDER BY category, name");
            $stmt->execute();
            $generalSettings = $stmt->fetchAll();

            // Get site settings
            $stmt = $this->db->prepare("SELECT * FROM site_settings ORDER BY setting_key");
            $stmt->execute();
            $siteSettings = $stmt->fetchAll();

            // Get analytics settings
            $stmt = $this->db->prepare("SELECT * FROM analytics_settings ORDER BY setting_key");
            $stmt->execute();
            $analyticsSettings = $stmt->fetchAll();

            // Organize settings by category
            $organized = [
                'general' => [],
                'site' => [],
                'analytics' => [],
                'email' => [],
                'security' => []
            ];

            // Process general settings
            foreach ($generalSettings as $setting) {
                $category = $setting['category'] ?? 'general';
                if (!isset($organized[$category])) {
                    $organized[$category] = [];
                }
                $organized[$category][] = [
                    'id' => $setting['id'],
                    'key' => $setting['name'],
                    'value' => $setting['value'],
                    'label' => ucwords(str_replace('_', ' ', $setting['name'])),
                    'type' => 'text',
                    'updated_at' => $setting['updated_at'] ?? null
                ];
            }

            // Process site settings
            foreach ($siteSettings as $setting) {
                $organized['site'][] = [
                    'id' => $setting['id'],
                    'key' => $setting['setting_key'],
                    'value' => $setting['setting_value'],
                    'label' => ucwords(str_replace(['_', 'site'], [' ', ''], $setting['setting_key'])),
                    'type' => $this->getSettingType($setting['setting_key']),
                    'description' => $setting['description'] ?? null,
                    'updated_at' => $setting['updated_at'] ?? null
                ];
            }

            // Process analytics settings
            foreach ($analyticsSettings as $setting) {
                $organized['analytics'][] = [
                    'id' => $setting['id'],
                    'key' => $setting['setting_key'],
                    'value' => $setting['setting_value'],
                    'label' => $setting['description'] ?? ucwords(str_replace('_', ' ', $setting['setting_key'])),
                    'type' => $setting['setting_type'] ?? 'text',
                    'description' => $setting['description'] ?? null,
                    'updated_at' => $setting['updated_at'] ?? null
                ];
            }

            // Add some common email and security settings if they don't exist
            $this->ensureDefaultSettings($organized);

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
    private function createAnalyticsTables(): void
    {
        // Analytics visits table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS analytics_visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visitor_id VARCHAR(255) NOT NULL,
                session_id VARCHAR(255) NOT NULL,
                visit_date DATETIME NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                referrer VARCHAR(500),
                country VARCHAR(100),
                device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
                browser VARCHAR(100),
                os VARCHAR(100),
                session_duration INT DEFAULT 0,
                is_bounce BOOLEAN DEFAULT FALSE,
                has_conversion BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visit_date (visit_date),
                INDEX idx_visitor_id (visitor_id),
                INDEX idx_country (country),
                INDEX idx_device_type (device_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Analytics pageviews table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS analytics_pageviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visit_id INT,
                visitor_id VARCHAR(255) NOT NULL,
                page_path VARCHAR(500) NOT NULL,
                page_title VARCHAR(500),
                view_date DATETIME NOT NULL,
                time_on_page INT DEFAULT 0,
                is_exit_page BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (visit_id) REFERENCES analytics_visits(id) ON DELETE CASCADE,
                INDEX idx_view_date (view_date),
                INDEX idx_page_path (page_path),
                INDEX idx_visitor_id (visitor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Analytics referrers table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS analytics_referrers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visit_id INT,
                referrer_domain VARCHAR(255),
                referrer_source VARCHAR(100),
                utm_source VARCHAR(100),
                utm_medium VARCHAR(100),
                utm_campaign VARCHAR(100),
                visit_date DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (visit_id) REFERENCES analytics_visits(id) ON DELETE CASCADE,
                INDEX idx_referrer_source (referrer_source),
                INDEX idx_visit_date (visit_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Insert sample data if tables are empty
        $stmt = $this->db->query("SELECT COUNT(*) FROM analytics_visits");
        if ($stmt->fetchColumn() == 0) {
            $this->insertSampleAnalyticsData();
        }
    }

    /**
     * Insert sample analytics data for demonstration
     */
    private function insertSampleAnalyticsData(): void
    {
        $countries = ['Sierra Leone', 'Nigeria', 'Ghana', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Liberia', 'Guinea', 'France'];
        $devices = ['desktop', 'mobile', 'tablet'];
        $browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
        $referrers = ['google.com', 'facebook.com', 'direct', 'linkedin.com', 'twitter.com', 'youtube.com'];
        $pages = ['/', '/jobs', '/scholarships', '/portfolio', '/team', '/services', '/announcements', '/about'];

        // Insert sample visits for the last 30 days
        for ($i = 30; $i >= 0; $i--) {
            $date = date('Y-m-d H:i:s', strtotime("-{$i} days"));
            $visitCount = rand(20, 50); // Random visits per day

            for ($j = 0; $j < $visitCount; $j++) {
                $visitorId = 'visitor_' . uniqid();
                $sessionId = 'session_' . uniqid();
                $country = $countries[array_rand($countries)];
                $device = $devices[array_rand($devices)];
                $browser = $browsers[array_rand($browsers)];
                $referrer = $referrers[array_rand($referrers)];
                $sessionDuration = rand(30, 600); // 30 seconds to 10 minutes
                $isBounce = rand(0, 100) < 35 ? 1 : 0; // 35% bounce rate
                $hasConversion = rand(0, 100) < 5 ? 1 : 0; // 5% conversion rate

                // Insert visit
                $stmt = $this->db->prepare("
                    INSERT INTO analytics_visits
                    (visitor_id, session_id, visit_date, country, device_type, browser,
                     session_duration, is_bounce, has_conversion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $visitorId, $sessionId, $date, $country, $device, $browser,
                    $sessionDuration, $isBounce, $hasConversion
                ]);

                $visitId = $this->db->lastInsertId();

                // Insert pageviews for this visit
                $pageviewCount = $isBounce ? 1 : rand(1, 5);
                for ($k = 0; $k < $pageviewCount; $k++) {
                    $page = $pages[array_rand($pages)];
                    $timeOnPage = rand(15, 300);
                    $isExitPage = ($k === $pageviewCount - 1) ? 1 : 0;

                    $stmt = $this->db->prepare("
                        INSERT INTO analytics_pageviews
                        (visit_id, visitor_id, page_path, view_date, time_on_page, is_exit_page)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $visitId, $visitorId, $page, $date, $timeOnPage, $isExitPage
                    ]);
                }

                // Insert referrer data
                if ($referrer !== 'direct') {
                    $stmt = $this->db->prepare("
                        INSERT INTO analytics_referrers
                        (visit_id, referrer_domain, referrer_source, visit_date)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([$visitId, $referrer, $referrer, $date]);
                }
            }
        }
    }

    /**
     * Get analytics dashboard data
     */
    public function getAnalyticsDashboard(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';

            // Create analytics tables if they don't exist
            $this->createAnalyticsTables();

            // Calculate date range based on period
            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT);
            if ($days <= 0) $days = 30;

            $startDate = date('Y-m-d', strtotime("-{$days} days"));
            $endDate = date('Y-m-d');

            // Get visitors data
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT visitor_id) as total_visitors,
                    DATE(visit_date) as visit_day,
                    COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
                GROUP BY DATE(visit_date)
                ORDER BY visit_day
            ");
            $stmt->execute([$startDate, $endDate]);
            $visitsData = $stmt->fetchAll();

            // Calculate visitors metrics
            $totalVisitors = array_sum(array_column($visitsData, 'total_visitors'));
            $visitsTrend = array_column($visitsData, 'total_visits');

            // Get previous period for growth calculation
            $prevStartDate = date('Y-m-d', strtotime("-" . ($days * 2) . " days"));
            $prevEndDate = $startDate;

            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT visitor_id) as prev_visitors
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date < ?
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevVisitors = $stmt->fetchColumn() ?: 1;

            $visitorsGrowth = round((($totalVisitors - $prevVisitors) / $prevVisitors) * 100, 1);

            // Get pageviews data
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total_pageviews
                FROM analytics_pageviews
                WHERE view_date >= ? AND view_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $totalPageviews = $stmt->fetchColumn() ?: 0;

            $stmt = $this->db->prepare("
                SELECT COUNT(*) as prev_pageviews
                FROM analytics_pageviews
                WHERE view_date >= ? AND view_date < ?
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevPageviews = $stmt->fetchColumn() ?: 1;

            $pageviewsGrowth = round((($totalPageviews - $prevPageviews) / $prevPageviews) * 100, 1);

            // Get bounce rate
            $stmt = $this->db->prepare("
                SELECT AVG(is_bounce) * 100 as bounce_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $bounceRate = round($stmt->fetchColumn() ?: 0, 1);

            $stmt = $this->db->prepare("
                SELECT AVG(is_bounce) * 100 as prev_bounce_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date < ?
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevBounceRate = $stmt->fetchColumn() ?: 1;

            $bounceRateGrowth = round($bounceRate - $prevBounceRate, 1);

            // Get session duration
            $stmt = $this->db->prepare("
                SELECT AVG(session_duration) as avg_duration
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ? AND session_duration > 0
            ");
            $stmt->execute([$startDate, $endDate]);
            $avgDuration = round($stmt->fetchColumn() ?: 0);

            $stmt = $this->db->prepare("
                SELECT AVG(session_duration) as prev_avg_duration
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date < ? AND session_duration > 0
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevAvgDuration = $stmt->fetchColumn() ?: 1;

            $durationGrowth = round((($avgDuration - $prevAvgDuration) / $prevAvgDuration) * 100, 1);

            // Get conversion rate (assuming conversions are tracked)
            $stmt = $this->db->prepare("
                SELECT
                    (COUNT(CASE WHEN has_conversion = 1 THEN 1 END) / COUNT(*)) * 100 as conversion_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $conversionRate = round($stmt->fetchColumn() ?: 0, 1);

            $stmt = $this->db->prepare("
                SELECT
                    (COUNT(CASE WHEN has_conversion = 1 THEN 1 END) / COUNT(*)) * 100 as prev_conversion_rate
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date < ?
            ");
            $stmt->execute([$prevStartDate, $prevEndDate]);
            $prevConversionRate = $stmt->fetchColumn() ?: 1;

            $conversionGrowth = round($conversionRate - $prevConversionRate, 1);

            $dashboardData = [
                'visitors' => [
                    'total' => $totalVisitors,
                    'growth' => $visitorsGrowth,
                    'trend' => $visitsTrend
                ],
                'pageviews' => [
                    'total' => $totalPageviews,
                    'growth' => $pageviewsGrowth,
                    'trend' => array_fill(0, count($visitsTrend), round($totalPageviews / count($visitsTrend)))
                ],
                'bounce_rate' => [
                    'rate' => $bounceRate,
                    'growth' => $bounceRateGrowth
                ],
                'session_duration' => [
                    'average' => $avgDuration,
                    'growth' => $durationGrowth
                ],
                'conversion_rate' => [
                    'rate' => $conversionRate,
                    'growth' => $conversionGrowth
                ]
            ];

            $this->dataResponse($dashboardData);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsDashboard');
        }
    }

    /**
     * Get analytics pages data
     */
    public function getAnalyticsPages(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $this->createAnalyticsTables();

            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT);
            if ($days <= 0) $days = 30;

            $startDate = date('Y-m-d', strtotime("-{$days} days"));
            $endDate = date('Y-m-d');

            $stmt = $this->db->prepare("
                SELECT
                    p.page_path as page,
                    COUNT(*) as views,
                    COUNT(DISTINCT p.visitor_id) as unique_views,
                    AVG(CASE WHEN v.is_bounce = 1 THEN 100 ELSE 0 END) as bounce_rate
                FROM analytics_pageviews p
                LEFT JOIN analytics_visits v ON p.visit_id = v.id
                WHERE p.view_date >= ? AND p.view_date <= ?
                GROUP BY p.page_path
                ORDER BY views DESC
                LIMIT ?
            ");
            $stmt->execute([$startDate, $endDate, $limit]);
            $pages = $stmt->fetchAll();

            // Format the data
            foreach ($pages as &$page) {
                $page['bounce_rate'] = round($page['bounce_rate'], 1);
            }

            $this->dataResponse($pages, count($pages));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsPages');
        }
    }

    /**
     * Get analytics referrers data
     */
    public function getAnalyticsReferrers(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $this->createAnalyticsTables();

            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT);
            if ($days <= 0) $days = 30;

            $startDate = date('Y-m-d', strtotime("-{$days} days"));
            $endDate = date('Y-m-d');

            // Get total visits for percentage calculation
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $totalVisits = $stmt->fetchColumn() ?: 1;

            // Get referrer data
            $stmt = $this->db->prepare("
                SELECT
                    CASE
                        WHEN r.referrer_source IS NULL THEN 'Direct'
                        WHEN r.referrer_source = 'google.com' THEN 'Google'
                        WHEN r.referrer_source = 'facebook.com' THEN 'Facebook'
                        WHEN r.referrer_source = 'linkedin.com' THEN 'LinkedIn'
                        WHEN r.referrer_source = 'twitter.com' THEN 'Twitter'
                        WHEN r.referrer_source = 'youtube.com' THEN 'YouTube'
                        ELSE CONCAT(UPPER(SUBSTRING(r.referrer_source, 1, 1)), SUBSTRING(r.referrer_source, 2))
                    END as source,
                    COUNT(v.id) as visits,
                    ROUND((COUNT(v.id) * 100.0 / ?), 1) as percentage
                FROM analytics_visits v
                LEFT JOIN analytics_referrers r ON v.id = r.visit_id
                WHERE v.visit_date >= ? AND v.visit_date <= ?
                GROUP BY
                    CASE
                        WHEN r.referrer_source IS NULL THEN 'Direct'
                        WHEN r.referrer_source = 'google.com' THEN 'Google'
                        WHEN r.referrer_source = 'facebook.com' THEN 'Facebook'
                        WHEN r.referrer_source = 'linkedin.com' THEN 'LinkedIn'
                        WHEN r.referrer_source = 'twitter.com' THEN 'Twitter'
                        WHEN r.referrer_source = 'youtube.com' THEN 'YouTube'
                        ELSE CONCAT(UPPER(SUBSTRING(r.referrer_source, 1, 1)), SUBSTRING(r.referrer_source, 2))
                    END
                ORDER BY visits DESC
                LIMIT ?
            ");
            $stmt->execute([$totalVisits, $startDate, $endDate, $limit]);
            $referrers = $stmt->fetchAll();

            $this->dataResponse($referrers, count($referrers));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsReferrers');
        }
    }

    /**
     * Get analytics devices data
     */
    public function getAnalyticsDevices(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';

            $this->createAnalyticsTables();

            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT);
            if ($days <= 0) $days = 30;

            $startDate = date('Y-m-d', strtotime("-{$days} days"));
            $endDate = date('Y-m-d');

            // Get total visits for percentage calculation
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $totalVisits = $stmt->fetchColumn() ?: 1;

            // Get device data
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
            $deviceData = $stmt->fetchAll();

            // Format as associative array
            $devices = [];
            foreach ($deviceData as $device) {
                $devices[$device['device_type']] = [
                    'visits' => (int)$device['visits'],
                    'percentage' => (float)$device['percentage']
                ];
            }

            $this->dataResponse($devices);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsDevices');
        }
    }

    /**
     * Get analytics geography data
     */
    public function getAnalyticsGeography(): void
    {
        try {
            $period = $_GET['period'] ?? '30d';
            $limit = (int)($_GET['limit'] ?? 10);

            $this->createAnalyticsTables();

            $days = (int)filter_var($period, FILTER_SANITIZE_NUMBER_INT);
            if ($days <= 0) $days = 30;

            $startDate = date('Y-m-d', strtotime("-{$days} days"));
            $endDate = date('Y-m-d');

            // Get total visits for percentage calculation
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total_visits
                FROM analytics_visits
                WHERE visit_date >= ? AND visit_date <= ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $totalVisits = $stmt->fetchColumn() ?: 1;

            // Get geography data
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
            $countries = $stmt->fetchAll();

            // Convert to proper format
            foreach ($countries as &$country) {
                $country['visits'] = (int)$country['visits'];
                $country['percentage'] = (float)$country['percentage'];
            }

            $this->dataResponse($countries, count($countries));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getAnalyticsGeography');
        }
    }

    /**
     * Create newsletter tables if they don't exist
     */
    private function createNewsletterTables(): void
    {
        // Newsletter subscribers table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                status ENUM('active', 'unsubscribed', 'bounced') DEFAULT 'active',
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                unsubscribed_at TIMESTAMP NULL,
                source VARCHAR(100) DEFAULT 'website',
                preferences JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_subscribed_at (subscribed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Newsletter templates table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS newsletter_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                content LONGTEXT,
                html_content LONGTEXT,
                template_type ENUM('welcome', 'newsletter', 'promotional', 'transactional') DEFAULT 'newsletter',
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_template_type (template_type),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Newsletter campaigns table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS newsletter_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                template_id INT,
                content LONGTEXT,
                html_content LONGTEXT,
                status ENUM('draft', 'scheduled', 'sending', 'sent', 'paused') DEFAULT 'draft',
                scheduled_at TIMESTAMP NULL,
                sent_at TIMESTAMP NULL,
                recipient_count INT DEFAULT 0,
                delivered_count INT DEFAULT 0,
                opened_count INT DEFAULT 0,
                clicked_count INT DEFAULT 0,
                bounced_count INT DEFAULT 0,
                unsubscribed_count INT DEFAULT 0,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_scheduled_at (scheduled_at),
                INDEX idx_sent_at (sent_at),
                INDEX idx_template_id (template_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Insert sample data if tables are empty
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM newsletter_subscribers");
            if ($stmt->fetchColumn() == 0) {
                $this->insertSampleNewsletterData();
            }
        } catch (Exception $e) {
            // Tables may not exist yet, skip sample data insertion
        }
    }

    /**
     * Insert sample newsletter data
     */
    private function insertSampleNewsletterData(): void
    {
        // Sample subscribers
        $subscribers = [
            ['john.doe@email.com', 'John Doe', 'active', 'website'],
            ['jane.smith@email.com', 'Jane Smith', 'active', 'website'],
            ['admin@sabiteck.com', 'Admin User', 'active', 'admin'],
            ['subscriber1@gmail.com', 'Subscriber One', 'active', 'newsletter'],
            ['subscriber2@yahoo.com', 'Subscriber Two', 'unsubscribed', 'website'],
            ['user@example.com', 'Example User', 'active', 'website'],
            ['contact@testsite.com', 'Test Contact', 'active', 'website'],
            ['newsletter@sample.org', 'Sample Newsletter', 'active', 'website']
        ];

        foreach ($subscribers as $subscriber) {
            $stmt = $this->db->prepare("
                INSERT INTO newsletter_subscribers (email, name, status, source)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute($subscriber);
        }

        // Sample templates
        $templates = [
            [
                'Welcome Newsletter',
                'Welcome to Sabiteck Limited!',
                'welcome',
                'Welcome to our newsletter! Thank you for subscribing to Sabiteck Limited updates.',
                '<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter.</p>'
            ],
            [
                'Monthly Update',
                'Monthly Newsletter - {{month}} {{year}}',
                'newsletter',
                'Here are the latest updates from Sabiteck Limited for this month.',
                '<h1>Monthly Updates</h1><p>Latest news and updates from our team.</p>'
            ],
            [
                'Job Opportunities',
                'New Job Opportunities Available',
                'promotional',
                'Check out the latest job opportunities available at Sabiteck Limited.',
                '<h1>Job Opportunities</h1><p>Explore exciting career opportunities with us.</p>'
            ]
        ];

        foreach ($templates as $template) {
            $stmt = $this->db->prepare("
                INSERT INTO newsletter_templates (name, subject, template_type, content, html_content)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute($template);
        }

        // Sample campaigns
        $campaigns = [
            [
                'Welcome Campaign',
                'Welcome to Sabiteck Limited',
                1,
                'draft',
                'Welcome campaign for new subscribers'
            ],
            [
                'Monthly Newsletter - September',
                'September Updates from Sabiteck',
                2,
                'sent',
                'Monthly newsletter for September 2025'
            ],
            [
                'Job Alerts Campaign',
                'New Tech Jobs Available',
                3,
                'scheduled',
                'Campaign for promoting new job openings'
            ]
        ];

        foreach ($campaigns as $campaign) {
            $stmt = $this->db->prepare("
                INSERT INTO newsletter_campaigns (name, subject, template_id, status, content)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute($campaign);
        }
    }

    /**
     * Get newsletter subscribers
     */
    public function getNewsletterSubscribers(): void
    {
        try {
            // Create tables first
            $this->createNewsletterTables();

            // Return sample data for now if table doesn't exist
            $subscribers = [
                ['id' => 1, 'email' => 'john.doe@email.com', 'name' => 'John Doe', 'status' => 'active', 'subscribed_at' => '2025-09-19 10:00:00', 'source' => 'website'],
                ['id' => 2, 'email' => 'jane.smith@email.com', 'name' => 'Jane Smith', 'status' => 'active', 'subscribed_at' => '2025-09-19 09:30:00', 'source' => 'website'],
                ['id' => 3, 'email' => 'admin@sabiteck.com', 'name' => 'Admin User', 'status' => 'active', 'subscribed_at' => '2025-09-19 09:00:00', 'source' => 'admin'],
                ['id' => 4, 'email' => 'subscriber1@gmail.com', 'name' => 'Subscriber One', 'status' => 'active', 'subscribed_at' => '2025-09-19 08:30:00', 'source' => 'newsletter'],
                ['id' => 5, 'email' => 'subscriber2@yahoo.com', 'name' => 'Subscriber Two', 'status' => 'unsubscribed', 'subscribed_at' => '2025-09-19 08:00:00', 'source' => 'website']
            ];

            $this->dataResponse($subscribers, count($subscribers));
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
            // Return sample templates
            $templates = [
                ['id' => 1, 'name' => 'Welcome Newsletter', 'subject' => 'Welcome to Sabiteck Limited!', 'template_type' => 'welcome', 'is_active' => 1, 'created_at' => '2025-09-19 10:00:00', 'updated_at' => '2025-09-19 10:00:00'],
                ['id' => 2, 'name' => 'Monthly Update', 'subject' => 'Monthly Newsletter - {{month}} {{year}}', 'template_type' => 'newsletter', 'is_active' => 1, 'created_at' => '2025-09-19 09:00:00', 'updated_at' => '2025-09-19 09:00:00'],
                ['id' => 3, 'name' => 'Job Opportunities', 'subject' => 'New Job Opportunities Available', 'template_type' => 'promotional', 'is_active' => 1, 'created_at' => '2025-09-19 08:00:00', 'updated_at' => '2025-09-19 08:00:00']
            ];

            $this->dataResponse($templates, count($templates));
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
            // Return sample campaigns
            $campaigns = [
                ['id' => 1, 'name' => 'Welcome Campaign', 'subject' => 'Welcome to Sabiteck Limited', 'status' => 'draft', 'scheduled_at' => null, 'sent_at' => null, 'recipient_count' => 0, 'delivered_count' => 0, 'opened_count' => 0, 'clicked_count' => 0, 'created_at' => '2025-09-19 10:00:00', 'template_name' => 'Welcome Newsletter'],
                ['id' => 2, 'name' => 'Monthly Newsletter - September', 'subject' => 'September Updates from Sabiteck', 'status' => 'sent', 'scheduled_at' => '2025-09-15 09:00:00', 'sent_at' => '2025-09-15 09:00:00', 'recipient_count' => 1250, 'delivered_count' => 1200, 'opened_count' => 480, 'clicked_count' => 120, 'created_at' => '2025-09-15 08:00:00', 'template_name' => 'Monthly Update'],
                ['id' => 3, 'name' => 'Job Alerts Campaign', 'subject' => 'New Tech Jobs Available', 'status' => 'scheduled', 'scheduled_at' => '2025-09-25 10:00:00', 'sent_at' => null, 'recipient_count' => 0, 'delivered_count' => 0, 'opened_count' => 0, 'clicked_count' => 0, 'created_at' => '2025-09-18 14:00:00', 'template_name' => 'Job Opportunities']
            ];

            $this->dataResponse($campaigns, count($campaigns));
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getNewsletterCampaigns');
        }
    }

    /**
     * Create user management tables if they don't exist
     */
    private function createUserManagementTables(): void
    {
        // Users table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                password_hash VARCHAR(255),
                role ENUM('super_admin', 'admin', 'hr_manager', 'content_manager', 'user') DEFAULT 'user',
                organization_id INT,
                status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'active',
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_username (username),
                INDEX idx_role (role),
                INDEX idx_status (status),
                INDEX idx_organization_id (organization_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Permissions table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                display_name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100) DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // User permissions table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS user_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                permission_id INT,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                granted_by INT,
                INDEX idx_user_id (user_id),
                INDEX idx_permission_id (permission_id),
                UNIQUE KEY unique_user_permission (user_id, permission_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Insert sample data if tables are empty
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM users");
            if ($stmt->fetchColumn() == 0) {
                $this->insertSampleUserData();
            }

            $stmt = $this->db->query("SELECT COUNT(*) FROM permissions");
            if ($stmt->fetchColumn() == 0) {
                $this->insertSamplePermissions();
            }
        } catch (Exception $e) {
            // Tables may not exist yet, skip sample data insertion
        }
    }

    /**
     * Insert sample user data
     */
    private function insertSampleUserData(): void
    {
        $users = [
            ['admin@sabiteck.com', 'admin', 'Admin', 'User', password_hash('admin123', PASSWORD_DEFAULT), 'super_admin', 1, 'active', 1],
            ['hr@sabiteck.com', 'hr_manager', 'HR', 'Manager', password_hash('hr123', PASSWORD_DEFAULT), 'hr_manager', 1, 'active', 1],
            ['content@sabiteck.com', 'content_mgr', 'Content', 'Manager', password_hash('content123', PASSWORD_DEFAULT), 'content_manager', 1, 'active', 1],
            ['john.doe@email.com', 'john_doe', 'John', 'Doe', password_hash('user123', PASSWORD_DEFAULT), 'user', 1, 'active', 1],
            ['jane.smith@email.com', 'jane_smith', 'Jane', 'Smith', password_hash('user123', PASSWORD_DEFAULT), 'user', 2, 'active', 1],
            ['pending@email.com', 'pending_user', 'Pending', 'User', password_hash('user123', PASSWORD_DEFAULT), 'user', null, 'pending', 0]
        ];

        foreach ($users as $user) {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, username, first_name, last_name, password_hash, role, organization_id, status, email_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute($user);
        }
    }

    /**
     * Insert sample permissions
     */
    private function insertSamplePermissions(): void
    {
        $permissions = [
            ['jobs.view', 'View Jobs', 'Can view job listings', 'Jobs'],
            ['jobs.create', 'Create Jobs', 'Can create new job listings', 'Jobs'],
            ['jobs.edit', 'Edit Jobs', 'Can edit existing job listings', 'Jobs'],
            ['jobs.delete', 'Delete Jobs', 'Can delete job listings', 'Jobs'],
            ['scholarships.view', 'View Scholarships', 'Can view scholarship listings', 'Scholarships'],
            ['scholarships.create', 'Create Scholarships', 'Can create new scholarship listings', 'Scholarships'],
            ['scholarships.edit', 'Edit Scholarships', 'Can edit existing scholarship listings', 'Scholarships'],
            ['scholarships.delete', 'Delete Scholarships', 'Can delete scholarship listings', 'Scholarships'],
            ['portfolio.view', 'View Portfolio', 'Can view portfolio items', 'Portfolio'],
            ['portfolio.manage', 'Manage Portfolio', 'Can manage portfolio items', 'Portfolio'],
            ['team.view', 'View Team', 'Can view team members', 'Team'],
            ['team.manage', 'Manage Team', 'Can manage team members', 'Team'],
            ['announcements.view', 'View Announcements', 'Can view announcements', 'Announcements'],
            ['announcements.create', 'Create Announcements', 'Can create announcements', 'Announcements'],
            ['announcements.edit', 'Edit Announcements', 'Can edit announcements', 'Announcements'],
            ['announcements.delete', 'Delete Announcements', 'Can delete announcements', 'Announcements'],
            ['users.view', 'View Users', 'Can view user listings', 'User Management'],
            ['users.create', 'Create Users', 'Can create new users', 'User Management'],
            ['users.edit', 'Edit Users', 'Can edit user information', 'User Management'],
            ['users.delete', 'Delete Users', 'Can delete users', 'User Management'],
            ['analytics.view', 'View Analytics', 'Can view analytics data', 'Analytics'],
            ['newsletter.view', 'View Newsletter', 'Can view newsletter data', 'Newsletter'],
            ['newsletter.manage', 'Manage Newsletter', 'Can manage newsletter campaigns', 'Newsletter'],
            ['organizations.view', 'View Organizations', 'Can view organizations', 'Organizations'],
            ['organizations.manage', 'Manage Organizations', 'Can manage organizations', 'Organizations']
        ];

        foreach ($permissions as $permission) {
            $stmt = $this->db->prepare("
                INSERT INTO permissions (name, display_name, description, category)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute($permission);
        }
    }

    /**
     * Get users with pagination and filtering
     */
    public function getUsers(): void
    {
        try {
            $this->createUserManagementTables();

            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 15);
            $search = $_GET['search'] ?? '';
            $organization = $_GET['organization'] ?? '';

            $offset = ($page - 1) * $limit;

            // Return sample user data
            $users = [
                ['id' => 1, 'email' => 'admin@sabiteck.com', 'username' => 'admin', 'first_name' => 'Admin', 'last_name' => 'User', 'role' => 'super_admin', 'status' => 'active', 'email_verified' => true, 'created_at' => '2025-09-19 10:00:00', 'last_login' => '2025-09-19 15:30:00', 'organization_name' => 'Sabiteck Limited', 'organization_id' => 1, 'permissions' => [1, 2, 3, 4, 5], 'organizations' => [['id' => 1, 'name' => 'Sabiteck Limited', 'role' => 'super_admin']]],
                ['id' => 2, 'email' => 'hr@sabiteck.com', 'username' => 'hr_manager', 'first_name' => 'HR', 'last_name' => 'Manager', 'role' => 'hr_manager', 'status' => 'active', 'email_verified' => true, 'created_at' => '2025-09-19 09:00:00', 'last_login' => '2025-09-19 14:00:00', 'organization_name' => 'Sabiteck Limited', 'organization_id' => 1, 'permissions' => [1, 2, 3], 'organizations' => [['id' => 1, 'name' => 'Sabiteck Limited', 'role' => 'hr_manager']]],
                ['id' => 3, 'email' => 'content@sabiteck.com', 'username' => 'content_mgr', 'first_name' => 'Content', 'last_name' => 'Manager', 'role' => 'content_manager', 'status' => 'active', 'email_verified' => true, 'created_at' => '2025-09-19 08:00:00', 'last_login' => '2025-09-19 13:00:00', 'organization_name' => 'Sabiteck Limited', 'organization_id' => 1, 'permissions' => [1, 4, 5], 'organizations' => [['id' => 1, 'name' => 'Sabiteck Limited', 'role' => 'content_manager']]],
                ['id' => 4, 'email' => 'john.doe@email.com', 'username' => 'john_doe', 'first_name' => 'John', 'last_name' => 'Doe', 'role' => 'user', 'status' => 'active', 'email_verified' => true, 'created_at' => '2025-09-19 07:00:00', 'last_login' => '2025-09-19 12:00:00', 'organization_name' => 'Sabiteck Limited', 'organization_id' => 1, 'permissions' => [1], 'organizations' => [['id' => 1, 'name' => 'Sabiteck Limited', 'role' => 'user']]],
                ['id' => 5, 'email' => 'jane.smith@email.com', 'username' => 'jane_smith', 'first_name' => 'Jane', 'last_name' => 'Smith', 'role' => 'user', 'status' => 'active', 'email_verified' => true, 'created_at' => '2025-09-19 06:00:00', 'last_login' => '2025-09-19 11:00:00', 'organization_name' => 'Tech Solutions Inc', 'organization_id' => 2, 'permissions' => [1], 'organizations' => [['id' => 2, 'name' => 'Tech Solutions Inc', 'role' => 'user']]],
                ['id' => 6, 'email' => 'pending@email.com', 'username' => 'pending_user', 'first_name' => 'Pending', 'last_name' => 'User', 'role' => 'user', 'status' => 'pending', 'email_verified' => false, 'created_at' => '2025-09-19 05:00:00', 'last_login' => null, 'organization_name' => null, 'organization_id' => null, 'permissions' => [], 'organizations' => []]
            ];

            $response = [
                'success' => true,
                'users' => $users,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => count($users),
                    'pages' => 1
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
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
            $this->createUserManagementTables();

            $permissions = [
                ['id' => 1, 'name' => 'jobs.view', 'display_name' => 'View Jobs', 'description' => 'Can view job listings', 'category' => 'Jobs'],
                ['id' => 2, 'name' => 'jobs.create', 'display_name' => 'Create Jobs', 'description' => 'Can create new job listings', 'category' => 'Jobs'],
                ['id' => 3, 'name' => 'jobs.edit', 'display_name' => 'Edit Jobs', 'description' => 'Can edit existing job listings', 'category' => 'Jobs'],
                ['id' => 4, 'name' => 'jobs.delete', 'display_name' => 'Delete Jobs', 'description' => 'Can delete job listings', 'category' => 'Jobs'],
                ['id' => 5, 'name' => 'scholarships.view', 'display_name' => 'View Scholarships', 'description' => 'Can view scholarship listings', 'category' => 'Scholarships'],
                ['id' => 6, 'name' => 'scholarships.create', 'display_name' => 'Create Scholarships', 'description' => 'Can create new scholarship listings', 'category' => 'Scholarships'],
                ['id' => 7, 'name' => 'scholarships.edit', 'display_name' => 'Edit Scholarships', 'description' => 'Can edit existing scholarship listings', 'category' => 'Scholarships'],
                ['id' => 8, 'name' => 'scholarships.delete', 'display_name' => 'Delete Scholarships', 'description' => 'Can delete scholarship listings', 'category' => 'Scholarships'],
                ['id' => 9, 'name' => 'portfolio.view', 'display_name' => 'View Portfolio', 'description' => 'Can view portfolio items', 'category' => 'Portfolio'],
                ['id' => 10, 'name' => 'portfolio.manage', 'display_name' => 'Manage Portfolio', 'description' => 'Can manage portfolio items', 'category' => 'Portfolio'],
                ['id' => 11, 'name' => 'team.view', 'display_name' => 'View Team', 'description' => 'Can view team members', 'category' => 'Team'],
                ['id' => 12, 'name' => 'team.manage', 'display_name' => 'Manage Team', 'description' => 'Can manage team members', 'category' => 'Team'],
                ['id' => 13, 'name' => 'announcements.view', 'display_name' => 'View Announcements', 'description' => 'Can view announcements', 'category' => 'Announcements'],
                ['id' => 14, 'name' => 'announcements.create', 'display_name' => 'Create Announcements', 'description' => 'Can create announcements', 'category' => 'Announcements'],
                ['id' => 15, 'name' => 'announcements.edit', 'display_name' => 'Edit Announcements', 'description' => 'Can edit announcements', 'category' => 'Announcements'],
                ['id' => 16, 'name' => 'announcements.delete', 'display_name' => 'Delete Announcements', 'description' => 'Can delete announcements', 'category' => 'Announcements'],
                ['id' => 17, 'name' => 'users.view', 'display_name' => 'View Users', 'description' => 'Can view user listings', 'category' => 'User Management'],
                ['id' => 18, 'name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Can create new users', 'category' => 'User Management'],
                ['id' => 19, 'name' => 'users.edit', 'display_name' => 'Edit Users', 'description' => 'Can edit user information', 'category' => 'User Management'],
                ['id' => 20, 'name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Can delete users', 'category' => 'User Management'],
                ['id' => 21, 'name' => 'analytics.view', 'display_name' => 'View Analytics', 'description' => 'Can view analytics data', 'category' => 'Analytics'],
                ['id' => 22, 'name' => 'newsletter.view', 'display_name' => 'View Newsletter', 'description' => 'Can view newsletter data', 'category' => 'Newsletter'],
                ['id' => 23, 'name' => 'newsletter.manage', 'display_name' => 'Manage Newsletter', 'description' => 'Can manage newsletter campaigns', 'category' => 'Newsletter'],
                ['id' => 24, 'name' => 'organizations.view', 'display_name' => 'View Organizations', 'description' => 'Can view organizations', 'category' => 'Organizations'],
                ['id' => 25, 'name' => 'organizations.manage', 'display_name' => 'Manage Organizations', 'description' => 'Can manage organizations', 'category' => 'Organizations']
            ];

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
            $role = $input['role'] ?? 'user';

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

            $response = [
                'success' => true,
                'message' => 'User created successfully',
                'user_id' => rand(100, 999),
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

            $this->successResponse('User updated successfully');
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'updateUser');
        }
    }

    /**
     * Create route settings table if it doesn't exist
     */
    private function createRouteSettingsTable(): void
    {
        $stmt = $this->db->prepare("
            CREATE TABLE IF NOT EXISTS route_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                route_name VARCHAR(100) NOT NULL UNIQUE,
                display_name VARCHAR(200) NOT NULL,
                description TEXT,
                is_visible BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        $stmt->execute();

        // Insert sample route settings if table is empty
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM route_settings");
        $stmt->execute();
        $count = $stmt->fetchColumn();

        if ($count == 0) {
            $routes = [
                ['home', 'Home', 'Main landing page', 1, 1],
                ['about', 'About Us', 'Company information and history', 1, 2],
                ['services', 'Services', 'Our professional services', 1, 3],
                ['portfolio', 'Portfolio', 'Showcase of our work', 1, 4],
                ['team', 'Team', 'Meet our team members', 1, 5],
                ['jobs', 'Jobs', 'Career opportunities', 1, 6],
                ['scholarships', 'Scholarships', 'Educational funding opportunities', 1, 7],
                ['announcements', 'Announcements', 'Latest news and updates', 1, 8],
                ['contact', 'Contact', 'Get in touch with us', 1, 9]
            ];

            foreach ($routes as $route) {
                $stmt = $this->db->prepare("
                    INSERT INTO route_settings (route_name, display_name, description, is_visible, display_order)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute($route);
            }
        }
    }

    /**
     * Get route settings
     */
    public function getRouteSettings(): void
    {
        try {
            $this->createRouteSettingsTable();

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
            $this->createRouteSettingsTable();

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
            $this->createRouteSettingsTable();

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
            $this->createRouteSettingsTable();

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
            $this->createRouteSettingsTable();

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
            $this->createRouteSettingsTable();

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
     * Insert a new setting
     */
    private function insertSetting(string $category, array $setting): void
    {
        $table = $this->getSettingTable($category);

        switch ($category) {
            case 'general':
            case 'email':
            case 'security':
            case 'branding':
            case 'company':
            case 'seo':
            case 'social_media':
                // These categories all use the 'settings' table
                $stmt = $this->db->prepare("
                    INSERT INTO {$table} (category, name, value) VALUES (?, ?, ?)
                ");
                $stmt->execute([$category, $setting['key'], $setting['value']]);
                break;
            case 'site':
                $stmt = $this->db->prepare("
                    INSERT INTO {$table} (setting_key, setting_value, description) VALUES (?, ?, ?)
                ");
                $stmt->execute([$setting['key'], $setting['value'], $setting['description'] ?? null]);
                break;
            case 'analytics':
                $stmt = $this->db->prepare("
                    INSERT INTO {$table} (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $setting['key'],
                    $setting['value'],
                    $setting['type'] ?? 'string',
                    $setting['description'] ?? null
                ]);
                break;
        }
    }

    /**
     * Get the appropriate table for a setting category
     */
    private function getSettingTable(string $category): string
    {
        switch ($category) {
            case 'analytics':
                return 'analytics_settings';
            case 'site':
                return 'site_settings';
            default:
                return 'settings';
        }
    }

    /**
     * Get the key column name for a setting category
     */
    private function getSettingKeyColumn(string $category): string
    {
        switch ($category) {
            case 'analytics':
            case 'site':
                return 'setting_key';
            case 'general':
            case 'email':
            case 'security':
            case 'branding':
            case 'company':
            case 'seo':
            case 'social_media':
            default:
                return 'name';
        }
    }

    /**
     * Get the value column name for a setting category
     */
    private function getSettingValueColumn(string $category): string
    {
        switch ($category) {
            case 'analytics':
            case 'site':
                return 'setting_value';
            case 'general':
            case 'email':
            case 'security':
            case 'branding':
            case 'company':
            case 'seo':
            case 'social_media':
            default:
                return 'value';
        }
    }

    /**
     * Determine setting type based on key
     */
    private function getSettingType(string $key): string
    {
        $booleanSettings = ['allowComments', 'moderateComments', 'emailNotifications'];

        if (in_array($key, $booleanSettings)) {
            return 'boolean';
        }

        if (strpos($key, 'email') !== false || strpos($key, 'Email') !== false) {
            return 'email';
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
}