<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class TeamController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $queryParams = $request->getQueryParams();
            $department = $queryParams['department'] ?? null;
            
            $sql = "SELECT 
                id, name, position, department, bio, email, phone, location,
                photo_url, avatar, linkedin_url, twitter_url, website_url,
                skills, years_experience, education, certifications,
                active, featured, order_position, created_at, updated_at
                FROM team WHERE active = 1";
            $params = [];
            
            if ($department) {
                $sql .= " AND department = ?";
                $params[] = $department;
            }
            
            $sql .= " ORDER BY order_position ASC, featured DESC, id ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $members = $stmt->fetchAll();
            
            // Process members to ensure proper data format
            $processedMembers = array_map(function($member) {
                // Ensure photo_url is set (fallback to avatar)
                if (empty($member['photo_url']) && !empty($member['avatar'])) {
                    $member['photo_url'] = $member['avatar'];
                }
                
                // Parse social links if stored as JSON
                if (!empty($member['linkedin_url']) || !empty($member['twitter_url']) || !empty($member['website_url'])) {
                    $member['social_links'] = [
                        'linkedin' => $member['linkedin_url'] ?? '',
                        'twitter' => $member['twitter_url'] ?? '',
                        'website' => $member['website_url'] ?? ''
                    ];
                }
                
                // Parse skills if stored as JSON string
                if (!empty($member['skills']) && is_string($member['skills'])) {
                    $decoded = json_decode($member['skills'], true);
                    $member['skills'] = is_array($decoded) ? $decoded : explode(',', $member['skills']);
                }
                
                // Parse certifications if stored as JSON string
                if (!empty($member['certifications']) && is_string($member['certifications'])) {
                    $decoded = json_decode($member['certifications'], true);
                    $member['certifications'] = is_array($decoded) ? $decoded : explode("\n", $member['certifications']);
                }
                
                // Convert boolean fields
                $member['active'] = (bool)$member['active'];
                $member['featured'] = (bool)$member['featured'];
                
                return $member;
            }, $members);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $processedMembers
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch team members',
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getFeatured(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM team WHERE active = 1 AND featured = 1 ORDER BY sort_order ASC");
            $stmt->execute();
            $members = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($members));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch featured team members'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getDepartments(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT DISTINCT department FROM team WHERE active = 1 AND department IS NOT NULL");
            $departments = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            
            $response->getBody()->write(json_encode($departments));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch departments'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (empty($data['name']) || empty($data['position'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Name and position are required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Validate skills format if provided
            if (isset($data['skills'])) {
                $validatedSkills = $this->validateSkills($data['skills']);
                if ($validatedSkills === false) {
                    $response->getBody()->write(json_encode([
                        'error' => 'Invalid skills format. Skills must be an array of strings like ["Leadership", "Mentorship", "Strategy"]'
                    ]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
                $data['skills'] = json_encode($validatedSkills);
            }
            
            $db = Database::getInstance();
            $slug = strtolower(str_replace(' ', '-', $data['name']));
            
            $stmt = $db->prepare("INSERT INTO team (name, slug, position, department, bio, avatar, email, phone, location, linkedin_url, github_url, twitter_url, skills, experience_years, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['name'],
                $slug,
                $data['position'],
                $data['department'] ?? null,
                $data['bio'] ?? null,
                $data['avatar'] ?? null,
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['location'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['github_url'] ?? null,
                $data['twitter_url'] ?? null,
                $data['skills'] ?? null,
                $data['experience_years'] ?? 0,
                $data['featured'] ?? 0,
                $data['active'] ?? 1
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member created successfully',
                'id' => $db->lastInsertId()
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create team member: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function validateSkills($skills)
    {
        // If skills is null or empty, return empty array
        if (empty($skills)) {
            return [];
        }

        // If it's a string, try to parse as comma-separated or JSON
        if (is_string($skills)) {
            // First, check if it's already a JSON string that was double-encoded
            // This happens when frontend sends JSON that gets stringified again
            $trimmed = trim($skills);
            
            // Remove any extra quotes or brackets that might have been added
            $trimmed = preg_replace('/^[\["]*(.*?)[\]"]*$/', '$1', $trimmed);
            
            // Try to decode as JSON first
            $decoded = json_decode($skills, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $skills = $decoded;
            } else {
                // Try decoding the trimmed version
                $decoded = json_decode($trimmed, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $skills = $decoded;
                } else {
                    // Parse as comma-separated string
                    $skills = array_map('trim', explode(',', $trimmed));
                }
            }
        }

        // If it's an array, validate it
        if (is_array($skills)) {
            // Clean up any double-encoded values in the array
            $cleanedSkills = [];
            
            foreach ($skills as $skill) {
                if (is_string($skill)) {
                    // Remove extra quotes and brackets that might wrap individual skills
                    $cleaned = trim($skill);
                    $cleaned = trim($cleaned, '"\'[]');
                    
                    // Skip empty values
                    if (!empty($cleaned)) {
                        $cleanedSkills[] = $cleaned;
                    }
                } else if (is_array($skill)) {
                    // If somehow we have nested arrays, flatten them
                    foreach ($skill as $nestedSkill) {
                        if (is_string($nestedSkill) && !empty(trim($nestedSkill))) {
                            $cleanedSkills[] = trim($nestedSkill);
                        }
                    }
                }
            }
            
            // Return the cleaned array
            return array_values(array_unique($cleanedSkills));
        }

        // Invalid format
        return false;
    }
    
    public function update(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $db = Database::getInstance();
            
            // Validate skills format if provided
            if (isset($data['skills'])) {
                $validatedSkills = $this->validateSkills($data['skills']);
                if ($validatedSkills === false) {
                    $response->getBody()->write(json_encode([
                        'error' => 'Invalid skills format. Skills must be an array of strings like ["Leadership", "Mentorship", "Strategy"]'
                    ]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
                $data['skills'] = json_encode($validatedSkills);
            }
            
            $fields = [];
            $params = [];
            
            foreach (['name', 'position', 'department', 'bio', 'avatar', 'email', 'phone', 'location', 'linkedin_url', 'github_url', 'twitter_url', 'skills', 'experience_years', 'featured', 'active'] as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                $response->getBody()->write(json_encode([
                    'error' => 'No fields to update'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $params[] = $id;
            $sql = "UPDATE team SET " . implode(', ', $fields) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update team member: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM team WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Team member deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete team member: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
