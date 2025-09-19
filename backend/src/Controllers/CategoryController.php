<?php

namespace App\Controllers;

class CategoryController extends BaseController {

    public function getContentCategories() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, active FROM content_categories WHERE active = 1 ORDER BY name");
            $categories = $stmt->fetchAll();
            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Content categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch content categories', 500);
        }
    }

    public function getPortfolioCategories() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, active FROM portfolio_categories WHERE active = 1 ORDER BY name");
            $categories = $stmt->fetchAll();
            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Portfolio categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch portfolio categories', 500);
        }
    }

    public function getServiceCategories() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, active FROM service_categories WHERE active = 1 ORDER BY name");
            $categories = $stmt->fetchAll();
            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Service categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch service categories', 500);
        }
    }

    public function getJobCategories() {
        try {
            // First check if job_categories table exists and has data
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM job_categories WHERE active = 1");
            $result = $stmt->fetch();

            if ($result['count'] > 0) {
                $stmt = $this->db->query("SELECT id, name, slug, description, active FROM job_categories WHERE active = 1 ORDER BY name");
                $categories = $stmt->fetchAll();
            } else {
                // Fallback to departments for backward compatibility
                $stmt = $this->db->query("SELECT DISTINCT department as name FROM jobs WHERE status = 'active' AND department IS NOT NULL ORDER BY department");
                $departments = $stmt->fetchAll();
                $categories = [];
                foreach ($departments as $index => $dept) {
                    $categories[] = [
                        'id' => $index + 1,
                        'name' => $dept['name'],
                        'slug' => $this->sanitizeSlug($dept['name'])
                    ];
                }
            }

            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Job categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch job categories', 500);
        }
    }

    public function getScholarshipCategories() {
        try {
            // First check if scholarship_categories table exists and has data
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM scholarship_categories WHERE active = 1");
            $result = $stmt->fetch();

            if ($result['count'] > 0) {
                $stmt = $this->db->query("SELECT id, name, description, active FROM scholarship_categories WHERE active = 1 ORDER BY name");
                $categories = $stmt->fetchAll();
            } else {
                // Fallback to existing categories for backward compatibility
                $stmt = $this->db->query("SELECT DISTINCT category as name FROM scholarships WHERE status = 'active' AND category IS NOT NULL ORDER BY category");
                $categoryNames = $stmt->fetchAll();
                $categories = [];
                foreach ($categoryNames as $index => $cat) {
                    $categories[] = [
                        'id' => $index + 1,
                        'name' => $cat['name'],
                        'slug' => $this->sanitizeSlug($cat['name'])
                    ];
                }
            }

            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Scholarship categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch scholarship categories', 500);
        }
    }

    public function getOrganizationCategories() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, active FROM organization_categories WHERE active = 1 ORDER BY name");
            $categories = $stmt->fetchAll();
            $this->successResponse(['categories' => $categories]);
        } catch (Exception $e) {
            error_log('Organization categories fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch organization categories', 500);
        }
    }

    public function getContentTypes() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, active FROM content_types WHERE active = 1 ORDER BY name");
            $types = $stmt->fetchAll();
            $this->successResponse(['content_types' => $types]);
        } catch (Exception $e) {
            error_log('Content types fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch content types', 500);
        }
    }

    public function getAnnouncementTypes() {
        try {
            $stmt = $this->db->query("SELECT id, name, slug, description, icon, color, active FROM announcement_types WHERE active = 1 ORDER BY name");
            $types = $stmt->fetchAll();
            $this->successResponse(['announcement_types' => $types]);
        } catch (Exception $e) {
            error_log('Announcement types fetch error: ' . $e->getMessage());
            $this->errorResponse('Failed to fetch announcement types', 500);
        }
    }
}
?>