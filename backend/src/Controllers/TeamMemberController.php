<?php
namespace DevCo\Controllers;

use PDO;
use Exception;

class TeamMemberController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Get all team members (admin)
     */
    public function getAllAdmin()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM team ORDER BY sort_order ASC, featured DESC, created_at DESC");
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse JSON fields
            foreach ($members as &$member) {
                $member['skills'] = json_decode($member['skills'] ?? '[]', true);
                $member['social_links'] = json_decode($member['social_links'] ?? '{}', true);
            }

            echo json_encode([
                'success' => true,
                'data' => $members
            ]);
        } catch (Exception $e) {
            error_log("Get all team members error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to fetch team members']);
        }
    }

    /**
     * Get public team members (for frontend display)
     */
    public function getPublicTeam()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM team WHERE active = 1 ORDER BY sort_order ASC, featured DESC, created_at DESC");
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse JSON fields and ensure avatar field is returned
            foreach ($members as &$member) {
                $member['skills'] = json_decode($member['skills'] ?? '[]', true);
                $member['social_links'] = json_decode($member['social_links'] ?? '{}', true);
                // Ensure photo_url is set from avatar field
                if (!isset($member['photo_url']) && isset($member['avatar'])) {
                    $member['photo_url'] = $member['avatar'];
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $members
            ]);
        } catch (Exception $e) {
            error_log("Get public team members error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to fetch team members']);
        }
    }

    /**
     * Get single team member
     */
    public function getOne($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM team WHERE id = ?");
            $stmt->execute([$id]);
            $member = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$member) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Team member not found']);
                return;
            }

            // Parse JSON fields
            $member['skills'] = json_decode($member['skills'] ?? '[]', true);
            $member['social_links'] = json_decode($member['social_links'] ?? '{}', true);

            echo json_encode([
                'success' => true,
                'data' => $member
            ]);
        } catch (Exception $e) {
            error_log("Get team member error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to fetch team member']);
        }
    }

    /**
     * Validate skills format
     * Skills must be an array of strings: ["Leadership", "Mentorship", "Strategy"]
     */
    private function validateSkills($skills)
    {
        // If skills is null or empty, return empty array
        if (empty($skills)) {
            return [];
        }

        // If it's a string, try to decode as JSON first
        if (is_string($skills)) {
            // Try to decode as JSON
            $decoded = json_decode($skills, true);
            
            // If successfully decoded and it's an array, use it
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $skills = $decoded;
            } else {
                // Not valid JSON, treat as comma-separated string
                $skillsArray = array_map('trim', explode(',', $skills));
                $skillsArray = array_filter($skillsArray); // Remove empty values
                return array_values($skillsArray); // Re-index array
            }
        }

        // If it's already an array, validate it
        if (is_array($skills)) {
            // Check if it's a simple array of strings (not associative)
            if (array_keys($skills) === range(0, count($skills) - 1)) {
                // Ensure all elements are strings
                foreach ($skills as $skill) {
                    if (!is_string($skill)) {
                        throw new Exception('Invalid skills format. Skills must be an array of strings like ["Leadership", "Mentorship", "Strategy"]');
                    }
                }
                
                // Filter out empty values and trim
                $skillsArray = array_map('trim', $skills);
                $skillsArray = array_filter($skillsArray);
                return array_values($skillsArray);
            }
        }

        // Invalid format
        throw new Exception('Invalid skills format. Skills must be an array of strings like ["Leadership", "Mentorship", "Strategy"]');
    }

    /**
     * Create team member
     */
    public function create()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (empty($input['name']) || empty($input['position'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name and position are required']);
                return;
            }

            // Generate slug
            $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $input['name']));

            // Prepare social links
            $socialLinks = json_encode([
                'linkedin' => $input['linkedin_url'] ?? '',
                'twitter' => $input['twitter_url'] ?? '',
                'website' => $input['website_url'] ?? ''
            ]);

            // Validate and prepare skills
            try {
                $validatedSkills = $this->validateSkills($input['skills'] ?? []);
                $skills = json_encode($validatedSkills);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }

            // Insert team member
            $stmt = $this->db->prepare("
                INSERT INTO team (
                    name, slug, position, department, bio, email, phone, location,
                    avatar, social_links, skills, active, featured, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $input['name'],
                $slug,
                $input['position'],
                $input['department'] ?? null,
                $input['bio'] ?? null,
                $input['email'] ?? null,
                $input['phone'] ?? null,
                $input['location'] ?? null,
                $input['photo_url'] ?? null,
                $socialLinks,
                $skills,
                isset($input['active']) ? (int)$input['active'] : 1,
                isset($input['featured']) ? (int)$input['featured'] : 0,
                $input['order_position'] ?? 0
            ]);

            $memberId = $this->db->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Team member created successfully',
                'data' => ['id' => $memberId]
            ]);
        } catch (Exception $e) {
            error_log("Create team member error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create team member: ' . $e->getMessage()]);
        }
    }

    /**
     * Update team member
     */
    public function update($id)
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Check if member exists
            $stmt = $this->db->prepare("SELECT id FROM team WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Team member not found']);
                return;
            }

            // Prepare social links
            $socialLinks = json_encode([
                'linkedin' => $input['linkedin_url'] ?? '',
                'twitter' => $input['twitter_url'] ?? '',
                'website' => $input['website_url'] ?? ''
            ]);

            // Validate and prepare skills
            try {
                $validatedSkills = $this->validateSkills($input['skills'] ?? []);
                $skills = json_encode($validatedSkills);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }

            // Update team member
            $stmt = $this->db->prepare("
                UPDATE team SET
                    name = ?, position = ?, department = ?, bio = ?, email = ?, phone = ?, location = ?,
                    avatar = ?, social_links = ?, skills = ?, active = ?, featured = ?, sort_order = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $input['name'] ?? '',
                $input['position'] ?? '',
                $input['department'] ?? null,
                $input['bio'] ?? null,
                $input['email'] ?? null,
                $input['phone'] ?? null,
                $input['location'] ?? null,
                $input['photo_url'] ?? null,
                $socialLinks,
                $skills,
                isset($input['active']) ? (int)$input['active'] : 1,
                isset($input['featured']) ? (int)$input['featured'] : 0,
                $input['order_position'] ?? 0,
                $id
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Team member updated successfully'
            ]);
        } catch (Exception $e) {
            error_log("Update team member error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update team member: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete team member
     */
    public function delete($id)
    {
        try {
            // Check if member exists
            $stmt = $this->db->prepare("SELECT avatar FROM team WHERE id = ?");
            $stmt->execute([$id]);
            $member = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$member) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Team member not found']);
                return;
            }

            // Delete the member
            $stmt = $this->db->prepare("DELETE FROM team WHERE id = ?");
            $stmt->execute([$id]);

            // Delete avatar file if exists
            if (!empty($member['avatar']) && file_exists(__DIR__ . '/../../public' . $member['avatar'])) {
                @unlink(__DIR__ . '/../../public' . $member['avatar']);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Team member deleted successfully'
            ]);
        } catch (Exception $e) {
            error_log("Delete team member error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to delete team member']);
        }
    }

    /**
     * Upload team member photo
     */
    public function uploadPhoto()
    {
        try {
            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
                return;
            }

            $file = $_FILES['photo'];

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPG, PNG, and WebP images are allowed']);
                return;
            }

            // Validate file size (max 5MB)
            $maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if ($file['size'] > $maxSize) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'File size exceeds 5MB limit. Please upload a smaller image']);
                return;
            }

            // Validate image dimensions (recommended: 800x800px, max 2000x2000px)
            list($width, $height) = getimagesize($file['tmp_name']);
            if ($width > 2000 || $height > 2000) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Image dimensions too large. Maximum size is 2000x2000px. Recommended: 800x800px']);
                return;
            }

            // Create uploads directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../public/uploads/team/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'team_' . uniqid() . '_' . time() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file']);
                return;
            }

            // Return the URL
            $photoUrl = '/uploads/team/' . $filename;

            echo json_encode([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'url' => $photoUrl,
                    'size' => $file['size'],
                    'dimensions' => ['width' => $width, 'height' => $height]
                ]
            ]);
        } catch (Exception $e) {
            error_log("Upload photo error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to upload photo: ' . $e->getMessage()]);
        }
    }
}

