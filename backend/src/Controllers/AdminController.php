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
            $stmt = $this->db->prepare("SELECT * FROM api_configurations WHERE is_active = 1 ORDER BY config_key");
            $stmt->execute();
            $settings = $stmt->fetchAll();

            $this->dataResponse($settings, count($settings));
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
}