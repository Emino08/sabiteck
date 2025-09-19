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
     * Get all active jobs
     */
    public function getJobs(): void
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC");
            $stmt->execute();
            $jobs = $stmt->fetchAll();

            $this->dataResponse($jobs, count($jobs));
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
            // Return a simplified routes structure
            $routes = [
                'api_version' => $this->getConfig('api_version', '1.0.0'),
                'endpoints' => [
                    'services' => '/api/services',
                    'jobs' => '/api/jobs',
                    'scholarships' => '/api/scholarships',
                    'portfolio' => '/api/portfolio',
                    'team' => '/api/team',
                    'announcements' => '/api/announcements'
                ]
            ];

            $this->dataResponse($routes);
        } catch (Exception $e) {
            $this->handleDatabaseException($e, 'getRoutes');
        }
    }
}