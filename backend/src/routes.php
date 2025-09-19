<?php

require_once __DIR__ . '/controllers/BaseController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/AdminController.php';

use App\Controllers\CategoryController;
use App\Controllers\AdminController;

function handleRoutes($method, $path, $db) {
    $categoryController = new CategoryController($db);
    $adminController = new AdminController($db);

    // Category routes - replace hardcoded data with database calls
    switch (true) {
        case ($path === '/api/portfolio/categories' && $method === 'GET'):
            return $categoryController->getPortfolioCategories();

        case ($path === '/api/services/categories' && $method === 'GET'):
            return $categoryController->getServiceCategories();

        case ($path === '/api/team/departments' && $method === 'GET'):
            // Keep existing team departments logic but can be enhanced
            $departments = [];
            if ($db) {
                try {
                    $stmt = $db->query("SELECT DISTINCT department FROM team WHERE active = 1 AND department IS NOT NULL ORDER BY department");
                    $departments = array_column($stmt->fetchAll(), 'department');
                } catch (Exception $e) {
                    error_log('Team departments fetch error: ' . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'departments' => $departments]);
            return true;

        case ($path === '/api/blog/categories' && $method === 'GET'):
            return $categoryController->getContentCategories();

        case ($path === '/api/jobs/categories' && $method === 'GET'):
            return $categoryController->getJobCategories();

        case ($path === '/api/jobs/locations' && $method === 'GET'):
            $locations = [];
            if ($db) {
                try {
                    $stmt = $db->query("SELECT DISTINCT location FROM jobs WHERE status = 'active' AND location IS NOT NULL ORDER BY location");
                    $locations = array_column($stmt->fetchAll(), 'location');
                } catch (Exception $e) {
                    error_log('Job locations fetch error: ' . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'locations' => $locations]);
            return true;

        case ($path === '/api/scholarships/categories' && $method === 'GET'):
            return $categoryController->getScholarshipCategories();

        case ($path === '/api/scholarships/regions' && $method === 'GET'):
            $regions = [];
            if ($db) {
                try {
                    $stmt = $db->query("SELECT DISTINCT region FROM scholarships WHERE status = 'active' AND region IS NOT NULL ORDER BY region");
                    $regions = array_column($stmt->fetchAll(), 'region');
                } catch (Exception $e) {
                    error_log('Scholarship regions fetch error: ' . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'regions' => $regions]);
            return true;

        case ($path === '/api/scholarships/education-levels' && $method === 'GET'):
            $levels = [];
            if ($db) {
                try {
                    $stmt = $db->query("SELECT DISTINCT education_level FROM scholarships WHERE status = 'active' AND education_level IS NOT NULL ORDER BY education_level");
                    $levels = array_column($stmt->fetchAll(), 'education_level');
                } catch (Exception $e) {
                    error_log('Scholarship education levels fetch error: ' . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'levels' => $levels]);
            return true;

        case ($path === '/api/organizations/categories' && $method === 'GET'):
            return $categoryController->getOrganizationCategories();

        case ($path === '/api/content/types' && $method === 'GET'):
            return $categoryController->getContentTypes();

        case ($path === '/api/announcements/types' && $method === 'GET'):
            return $categoryController->getAnnouncementTypes();

        // Admin stats routes - replace hardcoded arrays with database calls
        case ($path === '/api/admin/services' && $method === 'GET'):
            return $adminController->getServicesStats();

        case ($path === '/api/admin/portfolio' && $method === 'GET'):
            return $adminController->getPortfolioStats();

        case ($path === '/api/admin/announcements' && $method === 'GET'):
            return $adminController->getAnnouncementStats();

        case ($path === '/api/admin/content' && $method === 'GET'):
            return $adminController->getContentStats();

        default:
            return false; // Route not handled by this system
    }
}
?>