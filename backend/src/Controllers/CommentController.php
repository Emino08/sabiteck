<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class CommentController
{
    public function getComments(Request $request, Response $response, $args)
    {
        $contentId = $args['content_id'];

        try {
            $db = Database::getInstance();

            // Ensure comment table exists
            $this->ensureCommentTablesExist($db);
            $stmt = $db->prepare("
                SELECT id, parent_id, author_name, author_email, comment, created_at
                FROM content_comments
                WHERE content_id = ? AND approved = 1
                ORDER BY created_at ASC
            ");
            $stmt->execute([$contentId]);
            $allComments = $stmt->fetchAll();

            // Organize comments into hierarchical structure
            $comments = $this->organizeComments($allComments);
            
            $response->getBody()->write(json_encode([
                'comments' => $comments
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch comments'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function addComment(Request $request, Response $response, $args)
    {
        $contentId = $args['content_id'];
        $data = json_decode($request->getBody()->getContents(), true);

        $required = ['author_name', 'author_email', 'comment'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        if (!filter_var($data['author_email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();

            // Ensure comment table exists
            $this->ensureCommentTablesExist($db);

            // Add comment (with optional parent_id for replies)
            $parentId = !empty($data['parent_id']) ? $data['parent_id'] : null;

            $stmt = $db->prepare("
                INSERT INTO content_comments (content_id, parent_id, author_name, author_email, comment, approved)
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([
                $contentId,
                $parentId,
                $data['author_name'],
                $data['author_email'],
                $data['comment']
            ]);
            
            // Update comment count
            $stmt = $db->prepare("
                UPDATE content 
                SET comment_count = (
                    SELECT COUNT(*) FROM content_comments 
                    WHERE content_id = ? AND approved = 1
                ) 
                WHERE id = ?
            ");
            $stmt->execute([$contentId, $contentId]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Comment added successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to add comment'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getLikeStatus(Request $request, Response $response, $args)
    {
        $contentId = $args['content_id'];
        $data = json_decode($request->getBody()->getContents(), true);

        if (empty($data['user_identifier'])) {
            $response->getBody()->write(json_encode([
                'error' => 'User identifier is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $db = Database::getInstance();
            $this->ensureCommentTablesExist($db);

            // Check if like exists
            $stmt = $db->prepare("
                SELECT id FROM content_likes
                WHERE content_id = ? AND user_identifier = ?
            ");
            $stmt->execute([$contentId, $data['user_identifier']]);
            $existingLike = $stmt->fetch();

            // Get like count
            $stmt = $db->prepare("SELECT like_count FROM content WHERE id = ?");
            $stmt->execute([$contentId]);
            $likeCount = $stmt->fetchColumn() ?: 0;

            $response->getBody()->write(json_encode([
                'liked' => (bool)$existingLike,
                'like_count' => (int)$likeCount
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to get like status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function toggleLike(Request $request, Response $response, $args)
    {
        $contentId = $args['content_id'];
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['user_identifier'])) {
            $response->getBody()->write(json_encode([
                'error' => 'User identifier is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();

            // Ensure comment table exists
            $this->ensureCommentTablesExist($db);

            // Check if like already exists
            $stmt = $db->prepare("
                SELECT id FROM content_likes 
                WHERE content_id = ? AND user_identifier = ?
            ");
            $stmt->execute([$contentId, $data['user_identifier']]);
            $existingLike = $stmt->fetch();
            
            if ($existingLike) {
                // Remove like
                $stmt = $db->prepare("
                    DELETE FROM content_likes 
                    WHERE content_id = ? AND user_identifier = ?
                ");
                $stmt->execute([$contentId, $data['user_identifier']]);
                $liked = false;
            } else {
                // Add like
                $stmt = $db->prepare("
                    INSERT INTO content_likes (content_id, user_identifier) 
                    VALUES (?, ?)
                ");
                $stmt->execute([$contentId, $data['user_identifier']]);
                $liked = true;
            }
            
            // Update like count
            $stmt = $db->prepare("
                UPDATE content 
                SET like_count = (
                    SELECT COUNT(*) FROM content_likes 
                    WHERE content_id = ?
                ) 
                WHERE id = ?
            ");
            $stmt->execute([$contentId, $contentId]);
            
            // Get updated like count
            $stmt = $db->prepare("SELECT like_count FROM content WHERE id = ?");
            $stmt->execute([$contentId]);
            $likeCount = $stmt->fetchColumn();
            
            $response->getBody()->write(json_encode([
                'liked' => $liked,
                'like_count' => $likeCount
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to toggle like'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    private function organizeComments($comments)
    {
        $commentMap = [];
        $rootComments = [];

        // First pass: create comment map and identify root comments
        foreach ($comments as $comment) {
            $comment['replies'] = [];
            $commentMap[$comment['id']] = $comment;

            if ($comment['parent_id'] === null) {
                $rootComments[] = &$commentMap[$comment['id']];
            }
        }

        // Second pass: organize replies under their parents
        foreach ($comments as $comment) {
            if ($comment['parent_id'] !== null && isset($commentMap[$comment['parent_id']])) {
                $commentMap[$comment['parent_id']]['replies'][] = &$commentMap[$comment['id']];
            }
        }

        return $rootComments;
    }

    private function ensureCommentTablesExist($db)
    {
        try {
            // Create content_comments table if it doesn't exist
            $db->exec("
                CREATE TABLE IF NOT EXISTS content_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    content_id INT NOT NULL,
                    parent_id INT NULL,
                    author_name VARCHAR(255) NOT NULL,
                    author_email VARCHAR(255) NOT NULL,
                    comment TEXT NOT NULL,
                    approved TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES content_comments(id) ON DELETE CASCADE
                )
            ");

            // Check if parent_id column exists, if not add it
            try {
                $stmt = $db->query("SHOW COLUMNS FROM content_comments LIKE 'parent_id'");
                if ($stmt->rowCount() == 0) {
                    $db->exec("ALTER TABLE content_comments ADD COLUMN parent_id INT NULL AFTER content_id");
                    $db->exec("ALTER TABLE content_comments ADD FOREIGN KEY (parent_id) REFERENCES content_comments(id) ON DELETE CASCADE");
                }
            } catch (\Exception $columnError) {
                error_log("Column addition warning: " . $columnError->getMessage());
            }

            // Create content_likes table if it doesn't exist
            $db->exec("
                CREATE TABLE IF NOT EXISTS content_likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    content_id INT NOT NULL,
                    user_identifier VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_like (content_id, user_identifier),
                    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
                )
            ");
        } catch (\Exception $e) {
            // Log but don't fail - tables might already exist
            error_log("Comment tables creation warning: " . $e->getMessage());
        }
    }

    // Admin methods
    public function getAllComments(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $this->ensureCommentTablesExist($db);

            $stmt = $db->query("
                SELECT cc.*, c.title as content_title, c.content_type
                FROM content_comments cc
                JOIN content c ON cc.content_id = c.id
                ORDER BY cc.created_at DESC
            ");
            $comments = $stmt->fetchAll();

            $response->getBody()->write(json_encode([
                'success' => true,
                'comments' => $comments,
                'total' => count($comments)
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to fetch comments'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateCommentStatus(Request $request, Response $response, $args)
    {
        $commentId = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);

        try {
            $db = Database::getInstance();
            $this->ensureCommentTablesExist($db);

            $stmt = $db->prepare("UPDATE content_comments SET approved = ? WHERE id = ?");
            $stmt->execute([$data['approved'] ? 1 : 0, $commentId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Comment status updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to update comment status'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function deleteComment(Request $request, Response $response, $args)
    {
        $commentId = $args['id'];

        try {
            $db = Database::getInstance();
            $this->ensureCommentTablesExist($db);

            $stmt = $db->prepare("DELETE FROM content_comments WHERE id = ?");
            $stmt->execute([$commentId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to delete comment'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}