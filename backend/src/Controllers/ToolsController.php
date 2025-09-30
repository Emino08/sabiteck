<?php

namespace App\Controllers;

use App\Models\Database;
use PDO;
use Exception;

class ToolsController extends BaseController
{
    protected $db;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
    }

    // Tool Management Methods
    public function getToolsConfig()
    {
        try {
            $query = "SELECT * FROM tools_config ORDER BY display_order ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                'success' => true,
                'data' => $tools
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to fetch tools configuration: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateToolVisibility()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['tool_id']) || !isset($data['visible'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Tool ID and visibility status are required'
                ], 400);
                return;
            }

            $query = "UPDATE tools_config SET visible = ? WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['visible'], $data['tool_id']]);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Tool visibility updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update tool visibility: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addToolTab()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['name']) || !isset($data['description'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Tool name and description are required'
                ], 400);
                return;
            }

            // Get next display order
            $orderQuery = "SELECT MAX(display_order) as max_order FROM tools_config";
            $orderStmt = $this->db->prepare($orderQuery);
            $orderStmt->execute();
            $maxOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;

            $query = "INSERT INTO tools_config (name, description, icon, component, visible, display_order, gradient, color, featured, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'],
                $data['icon'] ?? 'Wrench',
                $data['component'] ?? null,
                $data['visible'] ?? true,
                $maxOrder + 1,
                $data['gradient'] ?? 'from-gray-500 via-gray-400 to-gray-300',
                $data['color'] ?? 'gray',
                $data['featured'] ?? false
            ]);

            $toolId = $this->db->lastInsertId();

            $this->jsonResponse([
                'success' => true,
                'message' => 'Tool tab added successfully',
                'tool_id' => $toolId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to add tool tab: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateToolTab()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Tool ID is required'
                ], 400);
                return;
            }

            $fields = [];
            $values = [];

            if (isset($data['name'])) {
                $fields[] = 'name = ?';
                $values[] = $data['name'];
            }
            if (isset($data['description'])) {
                $fields[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['icon'])) {
                $fields[] = 'icon = ?';
                $values[] = $data['icon'];
            }
            if (isset($data['component'])) {
                $fields[] = 'component = ?';
                $values[] = $data['component'];
            }
            if (isset($data['visible'])) {
                $fields[] = 'visible = ?';
                $values[] = $data['visible'];
            }
            if (isset($data['display_order'])) {
                $fields[] = 'display_order = ?';
                $values[] = $data['display_order'];
            }
            if (isset($data['gradient'])) {
                $fields[] = 'gradient = ?';
                $values[] = $data['gradient'];
            }
            if (isset($data['color'])) {
                $fields[] = 'color = ?';
                $values[] = $data['color'];
            }
            if (isset($data['featured'])) {
                $fields[] = 'featured = ?';
                $values[] = $data['featured'];
            }

            if (empty($fields)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No fields to update'
                ], 400);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $values[] = $data['id'];

            $query = "UPDATE tools_config SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute($values);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Tool tab updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update tool tab: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteToolTab()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Tool ID is required'
                ], 400);
                return;
            }

            $query = "DELETE FROM tools_config WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['id']]);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Tool tab deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to delete tool tab: ' . $e->getMessage()
            ], 500);
        }
    }

    // Curriculum Category Methods
    public function getCurriculumCategories()
    {
        try {
            $query = "SELECT c.*, COUNT(s.id) as subject_count
                     FROM curriculum_categories c
                     LEFT JOIN curriculum_subjects s ON c.id = s.category_id
                     GROUP BY c.id
                     ORDER BY c.display_order ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                'success' => true,
                'data' => $categories
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to fetch curriculum categories: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addCurriculumCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['name']) || !isset($data['description'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category name and description are required'
                ], 400);
                return;
            }

            // Get next display order
            $orderQuery = "SELECT MAX(display_order) as max_order FROM curriculum_categories";
            $orderStmt = $this->db->prepare($orderQuery);
            $orderStmt->execute();
            $maxOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;

            $query = "INSERT INTO curriculum_categories (name, description, icon, color, display_order, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'],
                $data['icon'] ?? 'BookOpen',
                $data['color'] ?? 'blue',
                $maxOrder + 1
            ]);

            $categoryId = $this->db->lastInsertId();

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum category added successfully',
                'category_id' => $categoryId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to add curriculum category: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateCurriculumCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category ID is required'
                ], 400);
                return;
            }

            $fields = [];
            $values = [];

            if (isset($data['name'])) {
                $fields[] = 'name = ?';
                $values[] = $data['name'];
            }
            if (isset($data['description'])) {
                $fields[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['icon'])) {
                $fields[] = 'icon = ?';
                $values[] = $data['icon'];
            }
            if (isset($data['color'])) {
                $fields[] = 'color = ?';
                $values[] = $data['color'];
            }
            if (isset($data['display_order'])) {
                $fields[] = 'display_order = ?';
                $values[] = $data['display_order'];
            }

            if (empty($fields)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No fields to update'
                ], 400);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $values[] = $data['id'];

            $query = "UPDATE curriculum_categories SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute($values);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum category updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update curriculum category: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteCurriculumCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category ID is required'
                ], 400);
                return;
            }

            // Check if category has subjects
            $checkQuery = "SELECT COUNT(*) as count FROM curriculum_subjects WHERE category_id = ?";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->execute([$data['id']]);
            $subjectCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];

            if ($subjectCount > 0) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Cannot delete category with existing subjects. Please delete subjects first.'
                ], 400);
                return;
            }

            $query = "DELETE FROM curriculum_categories WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['id']]);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum category deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to delete curriculum category: ' . $e->getMessage()
            ], 500);
        }
    }

    // Curriculum Subject Methods
    public function getCurriculumSubjects()
    {
        try {
            $categoryId = $_GET['category_id'] ?? null;

            $query = "SELECT s.*, c.name as category_name, c.color as category_color
                     FROM curriculum_subjects s
                     JOIN curriculum_categories c ON s.category_id = c.id";

            if ($categoryId) {
                $query .= " WHERE s.category_id = ?";
            }

            $query .= " ORDER BY s.display_order ASC";

            $stmt = $this->db->prepare($query);
            if ($categoryId) {
                $stmt->execute([$categoryId]);
            } else {
                $stmt->execute();
            }

            $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to fetch curriculum subjects: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addCurriculumSubject()
    {
        try {
            // Check if this is a file upload (FormData) or JSON request
            $isFileUpload = !empty($_FILES['file']);

            if ($isFileUpload) {
                // Handle FormData request
                $data = $_POST;
            } else {
                // Handle JSON request
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
            }

            if (!isset($data['name']) || !isset($data['category_id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject name and category ID are required'
                ], 400);
                return;
            }

            // Handle file upload if present
            $filePath = null;
            if ($isFileUpload && isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                $filePath = $this->handleFileUpload($_FILES['file']);
                if (!$filePath) {
                    $this->jsonResponse([
                        'success' => false,
                        'error' => 'Failed to upload file'
                    ], 400);
                    return;
                }
            } elseif (isset($data['link_url']) && !empty($data['link_url'])) {
                // Use link URL instead of file
                $filePath = $data['link_url'];
            }

            // Get next display order for the category
            $orderQuery = "SELECT MAX(display_order) as max_order FROM curriculum_subjects WHERE category_id = ?";
            $orderStmt = $this->db->prepare($orderQuery);
            $orderStmt->execute([$data['category_id']]);
            $maxOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;

            $query = "INSERT INTO curriculum_subjects (category_id, name, code, description, credit_hours,
                     prerequisites, learning_outcomes, assessment_methods, file_path, display_order, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

            $stmt = $this->db->prepare($query);
            $stmt->execute([
                $data['category_id'],
                $data['name'],
                $data['code'] ?? null,
                $data['description'] ?? null,
                $data['credit_hours'] ?? null,
                $data['prerequisites'] ?? null,
                $data['learning_outcomes'] ?? null,
                $data['assessment_methods'] ?? null,
                $filePath,
                $maxOrder + 1
            ]);

            $subjectId = $this->db->lastInsertId();

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum subject added successfully',
                'subject_id' => $subjectId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to add curriculum subject: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateCurriculumSubject()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject ID is required'
                ], 400);
                return;
            }

            $fields = [];
            $values = [];

            $allowedFields = [
                'category_id', 'name', 'code', 'description', 'credit_hours',
                'prerequisites', 'learning_outcomes', 'assessment_methods',
                'file_path', 'display_order'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = $field . ' = ?';
                    $values[] = $data[$field];
                }
            }

            if (empty($fields)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No fields to update'
                ], 400);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $values[] = $data['id'];

            $query = "UPDATE curriculum_subjects SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute($values);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum subject updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update curriculum subject: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteCurriculumSubject()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject ID is required'
                ], 400);
                return;
            }

            // Get file path before deletion for cleanup
            $fileQuery = "SELECT file_path FROM curriculum_subjects WHERE id = ?";
            $fileStmt = $this->db->prepare($fileQuery);
            $fileStmt->execute([$data['id']]);
            $subject = $fileStmt->fetch(PDO::FETCH_ASSOC);

            $query = "DELETE FROM curriculum_subjects WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['id']]);

            // Clean up file if exists
            if ($subject && $subject['file_path'] && file_exists($subject['file_path'])) {
                unlink($subject['file_path']);
            }

            $this->jsonResponse([
                'success' => true,
                'message' => 'Curriculum subject deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to delete curriculum subject: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadCurriculum()
    {
        try {
            $subjectId = $_GET['subject_id'] ?? null;

            if (!$subjectId) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject ID is required'
                ], 400);
                return;
            }

            $query = "SELECT s.*, c.name as category_name
                     FROM curriculum_subjects s
                     JOIN curriculum_categories c ON s.category_id = c.id
                     WHERE s.id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$subjectId]);
            $subject = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$subject) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject not found'
                ], 404);
                return;
            }

            if (!$subject['file_path'] || !file_exists($subject['file_path'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Curriculum file not found'
                ], 404);
                return;
            }

            // Set headers for file download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $subject['name'] . '_curriculum.pdf"');
            header('Content-Length: ' . filesize($subject['file_path']));

            readfile($subject['file_path']);
            exit;

        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to download curriculum: ' . $e->getMessage()
            ], 500);
        }
    }

    public function viewCurriculum()
    {
        try {
            $subjectId = $_GET['subject_id'] ?? null;

            if (!$subjectId) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject ID is required'
                ], 400);
                return;
            }

            $query = "SELECT s.*, c.name as category_name
                     FROM curriculum_subjects s
                     JOIN curriculum_categories c ON s.category_id = c.id
                     WHERE s.id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$subjectId]);
            $subject = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$subject) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject not found'
                ], 404);
                return;
            }

            // Check if it's a URL link
            if ($subject['file_path'] && (strpos($subject['file_path'], 'http://') === 0 || strpos($subject['file_path'], 'https://') === 0)) {
                // Redirect to external link
                header('Location: ' . $subject['file_path']);
                exit;
            }

            if (!$subject['file_path'] || !file_exists($subject['file_path'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Curriculum file not found'
                ], 404);
                return;
            }

            // Determine content type based on file extension
            $extension = pathinfo($subject['file_path'], PATHINFO_EXTENSION);
            $contentType = 'application/octet-stream'; // Default

            switch (strtolower($extension)) {
                case 'pdf':
                    $contentType = 'application/pdf';
                    break;
                case 'doc':
                    $contentType = 'application/msword';
                    break;
                case 'docx':
                    $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    break;
            }

            // Set headers for inline viewing (not download)
            header('Content-Type: ' . $contentType);
            header('Content-Disposition: inline; filename="' . basename($subject['file_path']) . '"');
            header('Content-Length: ' . filesize($subject['file_path']));

            // Security headers
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');

            readfile($subject['file_path']);
            exit;

        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to view curriculum: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadCurriculumFile()
    {
        try {
            $subjectId = $_POST['subject_id'] ?? null;

            if (!$subjectId) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Subject ID is required'
                ], 400);
                return;
            }

            if (!isset($_FILES['curriculum_file'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No file uploaded'
                ], 400);
                return;
            }

            $file = $_FILES['curriculum_file'];

            // Validate file type
            $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!in_array($file['type'], $allowedTypes)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Only PDF and Word documents are allowed'
                ], 400);
                return;
            }

            // Create upload directory
            $uploadDir = __DIR__ . '/../../uploads/curriculum/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'curriculum_' . $subjectId . '_' . time() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                // Update subject with file path
                $query = "UPDATE curriculum_subjects SET file_path = ?, updated_at = NOW() WHERE id = ?";
                $stmt = $this->db->prepare($query);
                $stmt->execute([$filepath, $subjectId]);

                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Curriculum file uploaded successfully',
                    'file_path' => $filepath
                ]);
            } else {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Failed to upload file'
                ], 500);
            }

        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to upload curriculum file: ' . $e->getMessage()
            ], 500);
        }
    }

    // Important Links Category Methods
    public function getImportantLinksCategories()
    {
        try {
            $query = "SELECT c.*, COUNT(l.id) as links_count
                     FROM important_links_categories c
                     LEFT JOIN important_links l ON c.id = l.category_id AND l.is_active = 1
                     GROUP BY c.id
                     ORDER BY c.display_order ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                'success' => true,
                'data' => $categories
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to fetch important links categories: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addImportantLinksCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['name']) || !isset($data['description'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category name and description are required'
                ], 400);
                return;
            }

            // Get next display order
            $orderQuery = "SELECT MAX(display_order) as max_order FROM important_links_categories";
            $orderStmt = $this->db->prepare($orderQuery);
            $orderStmt->execute();
            $maxOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;

            $query = "INSERT INTO important_links_categories (name, description, icon, color, display_order, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'],
                $data['icon'] ?? 'Link',
                $data['color'] ?? 'blue',
                $maxOrder + 1
            ]);

            $categoryId = $this->db->lastInsertId();

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important links category added successfully',
                'category_id' => $categoryId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to add important links category: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateImportantLinksCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category ID is required'
                ], 400);
                return;
            }

            $fields = [];
            $values = [];

            if (isset($data['name'])) {
                $fields[] = 'name = ?';
                $values[] = $data['name'];
            }
            if (isset($data['description'])) {
                $fields[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['icon'])) {
                $fields[] = 'icon = ?';
                $values[] = $data['icon'];
            }
            if (isset($data['color'])) {
                $fields[] = 'color = ?';
                $values[] = $data['color'];
            }
            if (isset($data['display_order'])) {
                $fields[] = 'display_order = ?';
                $values[] = $data['display_order'];
            }

            if (empty($fields)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No fields to update'
                ], 400);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $values[] = $data['id'];

            $query = "UPDATE important_links_categories SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute($values);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important links category updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update important links category: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteImportantLinksCategory()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Category ID is required'
                ], 400);
                return;
            }

            // Check if category has links
            $checkQuery = "SELECT COUNT(*) as count FROM important_links WHERE category_id = ?";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->execute([$data['id']]);
            $linksCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];

            if ($linksCount > 0) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Cannot delete category with existing links. Please delete links first.'
                ], 400);
                return;
            }

            $query = "DELETE FROM important_links_categories WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['id']]);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important links category deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to delete important links category: ' . $e->getMessage()
            ], 500);
        }
    }

    // Important Links Methods
    public function getImportantLinks()
    {
        try {
            $categoryId = $_GET['category_id'] ?? null;

            $query = "SELECT l.*, c.name as category_name, c.color as category_color
                     FROM important_links l
                     JOIN important_links_categories c ON l.category_id = c.id
                     WHERE l.is_active = 1";

            if ($categoryId) {
                $query .= " AND l.category_id = ?";
            }

            $query .= " ORDER BY l.display_order ASC";

            $stmt = $this->db->prepare($query);
            if ($categoryId) {
                $stmt->execute([$categoryId]);
            } else {
                $stmt->execute();
            }

            $links = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                'success' => true,
                'data' => $links
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to fetch important links: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addImportantLink()
    {
        try {
            // Check if this is a file upload (FormData) or JSON request
            $isFileUpload = !empty($_FILES['file']);

            if ($isFileUpload) {
                // Handle FormData request
                $data = $_POST;
            } else {
                // Handle JSON request
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
            }

            if (!isset($data['title']) || !isset($data['category_id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Link title and category ID are required'
                ], 400);
                return;
            }

            // Handle file upload if present
            $filePath = null;
            $fileSize = null;
            $fileType = null;
            $linkType = $data['link_type'] ?? 'website';
            $isDownloadable = isset($data['is_downloadable']) ? (bool)$data['is_downloadable'] : false;

            if ($isFileUpload && isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                $filePath = $this->handleLinkFileUpload($_FILES['file']);
                if (!$filePath) {
                    $this->jsonResponse([
                        'success' => false,
                        'error' => 'Failed to upload file'
                    ], 400);
                    return;
                }
                $linkType = 'download';
                $isDownloadable = true;
                $fileSize = $this->formatFileSize($_FILES['file']['size']);
                $fileType = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            } elseif (isset($data['url']) && !empty($data['url'])) {
                // Use URL instead of file
                $filePath = $data['url'];
                $linkType = 'website';
            }

            // Get next display order for the category
            $orderQuery = "SELECT MAX(display_order) as max_order FROM important_links WHERE category_id = ?";
            $orderStmt = $this->db->prepare($orderQuery);
            $orderStmt->execute([$data['category_id']]);
            $maxOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;

            $query = "INSERT INTO important_links (category_id, title, description, url, file_path,
                     link_type, is_downloadable, file_size, file_type, target_blank, icon,
                     display_order, is_active, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

            $stmt = $this->db->prepare($query);
            $stmt->execute([
                $data['category_id'],
                $data['title'],
                $data['description'] ?? null,
                $linkType === 'website' ? $filePath : null,
                $linkType === 'download' ? $filePath : null,
                $linkType,
                $isDownloadable,
                $fileSize,
                $fileType,
                isset($data['target_blank']) ? (bool)$data['target_blank'] : true,
                $data['icon'] ?? 'ExternalLink',
                $maxOrder + 1,
                isset($data['is_active']) ? (bool)$data['is_active'] : true
            ]);

            $linkId = $this->db->lastInsertId();

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important link added successfully',
                'link_id' => $linkId
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to add important link: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateImportantLink()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Link ID is required'
                ], 400);
                return;
            }

            $fields = [];
            $values = [];

            $allowedFields = [
                'category_id', 'title', 'description', 'url', 'file_path',
                'link_type', 'is_downloadable', 'target_blank', 'icon',
                'display_order', 'is_active'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = $field . ' = ?';
                    $values[] = $data[$field];
                }
            }

            if (empty($fields)) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'No fields to update'
                ], 400);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $values[] = $data['id'];

            $query = "UPDATE important_links SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute($values);

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important link updated successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to update important link: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteImportantLink()
    {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['id'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Link ID is required'
                ], 400);
                return;
            }

            // Get file path before deletion for cleanup
            $fileQuery = "SELECT file_path, link_type FROM important_links WHERE id = ?";
            $fileStmt = $this->db->prepare($fileQuery);
            $fileStmt->execute([$data['id']]);
            $link = $fileStmt->fetch(PDO::FETCH_ASSOC);

            $query = "DELETE FROM important_links WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$data['id']]);

            // Clean up file if exists and is a download link
            if ($link && $link['link_type'] === 'download' && $link['file_path'] && file_exists($link['file_path'])) {
                unlink($link['file_path']);
            }

            $this->jsonResponse([
                'success' => true,
                'message' => 'Important link deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to delete important link: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadImportantLink()
    {
        try {
            $linkId = $_GET['link_id'] ?? null;

            if (!$linkId) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Link ID is required'
                ], 400);
                return;
            }

            $query = "SELECT l.*, c.name as category_name
                     FROM important_links l
                     JOIN important_links_categories c ON l.category_id = c.id
                     WHERE l.id = ? AND l.is_active = 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$linkId]);
            $link = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$link) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'Link not found'
                ], 404);
                return;
            }

            // Update click count
            $updateQuery = "UPDATE important_links SET click_count = click_count + 1 WHERE id = ?";
            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->execute([$linkId]);

            if ($link['link_type'] === 'website') {
                // Redirect to external URL
                header('Location: ' . $link['url']);
                exit;
            }

            if (!$link['file_path'] || !file_exists($link['file_path'])) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'File not found'
                ], 404);
                return;
            }

            // Set headers for file download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($link['file_path']) . '"');
            header('Content-Length: ' . filesize($link['file_path']));

            readfile($link['file_path']);
            exit;

        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'Failed to access link: ' . $e->getMessage()
            ], 500);
        }
    }

    private function handleFileUpload($file)
    {
        try {
            // Validate file type
            $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!in_array($file['type'], $allowedTypes)) {
                return false;
            }

            // Validate file size (10MB max)
            $maxSize = 10 * 1024 * 1024; // 10MB
            if ($file['size'] > $maxSize) {
                return false;
            }

            // Create upload directory
            $uploadDir = __DIR__ . '/../../uploads/curriculum/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'curriculum_' . time() . '_' . uniqid() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                return $filepath;
            }

            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    private function handleLinkFileUpload($file)
    {
        try {
            // Create upload directory
            $uploadDir = __DIR__ . '/../../uploads/important_links/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'link_' . time() . '_' . uniqid() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                return $filepath;
            }

            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    private function formatFileSize($bytes)
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }
}