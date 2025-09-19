<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class JobApplicationController
{
    // Apply for a job
    public function apply(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $jobId = $args['jobId'];
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Check if job exists and is active
            $jobStmt = $db->prepare("SELECT id, title, company_name, application_deadline, deadline FROM jobs WHERE id = ? AND status = 'active'");
            $jobStmt->execute([$jobId]);
            $job = $jobStmt->fetch();

            if (!$job) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Job not found or no longer active'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Check if application deadline has passed (check both fields)
            $deadline = $job['application_deadline'] ?: $job['deadline'];
            if ($deadline && $deadline < date('Y-m-d')) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Application deadline has passed'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Check if user has already applied
            $existingStmt = $db->prepare("SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?");
            $existingStmt->execute([$jobId, $currentUser->user_id]);
            if ($existingStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'You have already applied for this job'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Create application
            $stmt = $db->prepare("
                INSERT INTO job_applications (
                    job_id, user_id, cover_letter, additional_info,
                    portfolio_url, linkedin_url, expected_salary, available_from,
                    resume_url, applied_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ");
            
            $stmt->execute([
                $jobId,
                $currentUser->user_id,
                $data['cover_letter'] ?? null,
                $data['additional_info'] ?? null,
                $data['portfolio_url'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['expected_salary'] ?? null,
                $data['available_from'] ?? null,
                $data['resume_url'] ?? null
            ]);
            
            $applicationId = $db->lastInsertId();
            
            // Update job application count
            $updateStmt = $db->prepare("UPDATE jobs SET application_count = application_count + 1 WHERE id = ?");
            $updateStmt->execute([$jobId]);
            
            // Create application history entry
            $historyStmt = $db->prepare("
                INSERT INTO job_application_history (application_id, new_status, changed_by)
                VALUES (?, 'pending', ?)
            ");
            $historyStmt->execute([$applicationId, $currentUser->user_id]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Application submitted successfully',
                'application_id' => $applicationId
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to submit application',
                'message' => 'An error occurred while processing your application'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Get user's job applications
    public function getUserApplications(Request $request, Response $response, $args)
    {
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $queryParams = $request->getQueryParams();
            $page = (int) ($queryParams['page'] ?? 1);
            $limit = (int) ($queryParams['limit'] ?? 10);
            $offset = ($page - 1) * $limit;
            
            $db = Database::getInstance();
            
            // Get total count
            $countStmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM job_applications ja 
                WHERE ja.user_id = ?
            ");
            $countStmt->execute([$currentUser->user_id]);
            $total = $countStmt->fetch()['total'];
            
            // Get applications
            $stmt = $db->prepare("
                SELECT ja.*, 
                       j.title as job_title, j.slug as job_slug, 
                       j.company_name, j.location, j.status as job_status,
                       jc.name as category_name
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.id
                LEFT JOIN job_categories jc ON j.category_id = jc.id
                WHERE ja.user_id = ?
                ORDER BY ja.applied_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$currentUser->user_id, $limit, $offset]);
            $applications = $stmt->fetchAll();
            
            // Process applications
            foreach ($applications as &$application) {
                foreach ($application as $key => $value) {
                    if (is_string($value)) {
                        $application[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                }
                
                // Calculate days since application
                if ($application['applied_at']) {
                    $appliedDate = new \DateTime($application['applied_at']);
                    $now = new \DateTime();
                    $diff = $now->diff($appliedDate);
                    $application['days_since_applied'] = (int)$diff->days;
                }
            }
            
            $jsonData = json_encode([
                'applications' => $applications,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ], JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            
            $response->getBody()->write($jsonData);
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch applications'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Check if user has applied for a specific job
    public function checkApplication(Request $request, Response $response, $args)
    {
        $jobId = $args['jobId'];
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'has_applied' => false,
                'requires_auth' => true
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT id, status, applied_at 
                FROM job_applications 
                WHERE job_id = ? AND user_id = ?
            ");
            $stmt->execute([$jobId, $currentUser->user_id]);
            $application = $stmt->fetch();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'has_applied' => !empty($application),
                'application' => $application ?: null,
                'requires_auth' => false
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to check application status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Withdraw application
    public function withdraw(Request $request, Response $response, $args)
    {
        $applicationId = $args['applicationId'];
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Check if application exists and belongs to user
            $checkStmt = $db->prepare("
                SELECT ja.*, j.title, j.company_name 
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.id
                WHERE ja.id = ? AND ja.user_id = ?
            ");
            $checkStmt->execute([$applicationId, $currentUser->user_id]);
            $application = $checkStmt->fetch();
            
            if (!$application) {
                $response->getBody()->write(json_encode([
                    'error' => 'Application not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Check if application can be withdrawn (not hired or in final stages)
            if (in_array($application['status'], ['hired', 'rejected'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Application cannot be withdrawn at this stage'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Delete application
            $deleteStmt = $db->prepare("DELETE FROM job_applications WHERE id = ?");
            $deleteStmt->execute([$applicationId]);
            
            // Update job application count
            $updateStmt = $db->prepare("UPDATE jobs SET application_count = application_count - 1 WHERE id = ?");
            $updateStmt->execute([$application['job_id']]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Application withdrawn successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to withdraw application'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Get applications for a specific job
    public function getJobApplications(Request $request, Response $response, $args)
    {
        $jobId = $args['id'];
        $queryParams = $request->getQueryParams();
        
        try {
            $db = Database::getInstance();
            
            // Check if job exists
            $jobStmt = $db->prepare("SELECT id, title, company_name FROM jobs WHERE id = ?");
            $jobStmt->execute([$jobId]);
            $job = $jobStmt->fetch();
            
            if (!$job) {
                $response->getBody()->write(json_encode([
                    'error' => 'Job not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Pagination
            $page = (int) ($queryParams['page'] ?? 1);
            $limit = (int) ($queryParams['limit'] ?? 10);
            $offset = ($page - 1) * $limit;
            
            // Filters
            $whereConditions = ['ja.job_id = ?'];
            $params = [$jobId];
            
            if (!empty($queryParams['status'])) {
                $whereConditions[] = "ja.status = ?";
                $params[] = $queryParams['status'];
            }
            
            if (!empty($queryParams['search'])) {
                $whereConditions[] = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
                $searchTerm = '%' . $queryParams['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $whereClause = ' WHERE ' . implode(' AND ', $whereConditions);
            
            // Get total count
            $countStmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM job_applications ja 
                JOIN users u ON ja.user_id = u.id 
                $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            // Get applications
            $stmt = $db->prepare("
                SELECT ja.*, 
                       u.first_name, u.last_name, u.email, u.phone,
                       j.title as job_title
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                JOIN jobs j ON ja.job_id = j.id
                $whereClause
                ORDER BY ja.applied_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $applications = $stmt->fetchAll();
            
            // Process applications
            foreach ($applications as &$application) {
                foreach ($application as $key => $value) {
                    if (is_string($value)) {
                        $application[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                }
                
                // Get application history
                $historyStmt = $db->prepare("
                    SELECT ah.*, u.first_name || ' ' || u.last_name as changed_by_name
                    FROM job_application_history ah
                    LEFT JOIN users u ON ah.changed_by = u.id
                    WHERE ah.application_id = ?
                    ORDER BY ah.changed_at DESC
                ");
                $historyStmt->execute([$application['id']]);
                $application['history'] = $historyStmt->fetchAll();
                
                // Calculate days since application
                if ($application['applied_at']) {
                    $appliedDate = new \DateTime($application['applied_at']);
                    $now = new \DateTime();
                    $diff = $now->diff($appliedDate);
                    $application['days_since_applied'] = (int)$diff->days;
                }
            }
            
            $jsonData = json_encode([
                'job' => $job,
                'applications' => $applications,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ], JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);
            
            $response->getBody()->write($jsonData);
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch applications'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    // Admin: Update application status
    public function updateStatus(Request $request, Response $response, $args)
    {
        $applicationId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        $currentUser = $request->getAttribute('user');
        
        if (!isset($data['status'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Status is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $validStatuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'];
        if (!in_array($data['status'], $validStatuses)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid status'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Check if application exists
            $checkStmt = $db->prepare("
                SELECT ja.*, j.title as job_title, u.first_name, u.last_name, u.email
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.id
                JOIN users u ON ja.user_id = u.id
                WHERE ja.id = ?
            ");
            $checkStmt->execute([$applicationId]);
            $application = $checkStmt->fetch();
            
            if (!$application) {
                $response->getBody()->write(json_encode([
                    'error' => 'Application not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Update application status
            $updateStmt = $db->prepare("
                UPDATE job_applications 
                SET status = ?, updated_at = datetime('now')
                WHERE id = ?
            ");
            $updateStmt->execute([$data['status'], $applicationId]);
            
            // Add to history
            $historyStmt = $db->prepare("
                INSERT INTO job_application_history (
                    application_id, old_status, new_status, notes, changed_by, changed_at
                ) VALUES (?, ?, ?, ?, ?, datetime('now'))
            ");
            $historyStmt->execute([
                $applicationId,
                $application['status'],
                $data['status'],
                $data['notes'] ?? null,
                $currentUser->user_id
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Application status updated successfully',
                'application' => [
                    'id' => $applicationId,
                    'status' => $data['status'],
                    'applicant_name' => $application['first_name'] . ' ' . $application['last_name'],
                    'job_title' => $application['job_title']
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update application status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}