<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;
use Firebase\JWT\JWT;

class AuthController
{
    public function register(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        // Validate required fields
        $required = ['first_name', 'last_name', 'email', 'username', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Please provide a valid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Validate password length
        if (strlen($data['password']) < 6) {
            $response->getBody()->write(json_encode([
                'error' => 'Password must be at least 6 characters long'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Check if email already exists
            $emailStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $emailStmt->execute([$data['email']]);
            if ($emailStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'error' => 'Email address is already registered'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Check if username already exists
            $usernameStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $usernameStmt->execute([$data['username']]);
            if ($usernameStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'error' => 'Username is already taken'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Create user
            $stmt = $db->prepare("
                INSERT INTO users (
                    first_name, last_name, email, username, password_hash,
                    phone, organization, role, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 'active', NOW())
            ");
            
            $stmt->execute([
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $data['username'],
                $passwordHash,
                $data['phone'] ?? null,
                $data['organization'] ?? null
            ]);
            
            $userId = $db->lastInsertId();
            
            // Get the created user
            $userStmt = $db->prepare("
                SELECT id, first_name, last_name, email, username, role, status 
                FROM users WHERE id = ?
            ");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            
            $response->getBody()->write(json_encode([
                'message' => 'Account created successfully',
                'user' => $user
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Registration failed. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function login(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        // Validate required fields
        if (empty($data['username']) || empty($data['password'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Username and password are required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Find user by username or email
            $stmt = $db->prepare("
                SELECT id, username, password_hash, role, first_name, last_name, email, status
                FROM users 
                WHERE (username = ? OR email = ?) AND status = 'active'
            ");
            $stmt->execute([$data['username'], $data['username']]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid username or password'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }
            
            // Update last login
            $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'first_name' => $user['first_name'],
                        'last_name' => $user['last_name'],
                        'email' => $user['email'],
                        'role' => $user['role']
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Login error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Login failed. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function googleAuth(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['google_token'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Google token is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            // Verify Google token with Google's API
            $googleUserInfo = $this->verifyGoogleToken($data['google_token']);
            
            if (!$googleUserInfo) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid Google token'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            
            // Check if user already exists by email
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$googleUserInfo['email']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // Create new user from Google data
                $insertStmt = $db->prepare("
                    INSERT INTO users (
                        first_name, last_name, email, username, google_id,
                        profile_image, role, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'user', 'active', NOW())
                ");
                
                $username = strtolower($googleUserInfo['given_name'] . '_' . $googleUserInfo['family_name']);
                // Ensure username is unique
                $baseUsername = $username;
                $counter = 1;
                while (true) {
                    $checkStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
                    $checkStmt->execute([$username]);
                    if (!$checkStmt->fetch()) {
                        break;
                    }
                    $username = $baseUsername . '_' . $counter;
                    $counter++;
                }
                
                $insertStmt->execute([
                    $googleUserInfo['given_name'],
                    $googleUserInfo['family_name'],
                    $googleUserInfo['email'],
                    $username,
                    $googleUserInfo['sub'],
                    $googleUserInfo['picture'] ?? null
                ]);
                
                $userId = $db->lastInsertId();
                
                // Get the created user
                $userStmt = $db->prepare("
                    SELECT id, first_name, last_name, email, username, role, status 
                    FROM users WHERE id = ?
                ");
                $userStmt->execute([$userId]);
                $user = $userStmt->fetch();
            }
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
            
            $response->getBody()->write(json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Google auth error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Authentication failed'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getProfile(Request $request, Response $response, $args)
    {
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT id, username, email, first_name, last_name, phone, 
                       organization, role, status, created_at, last_login
                FROM users WHERE id = ?
            ");
            $stmt->execute([$currentUser->user_id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'error' => 'User not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $user
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Get profile error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch profile'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function updateProfile(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            $fields = [];
            $values = [];
            
            // Validate and prepare fields for update
            if (isset($data['first_name']) && !empty($data['first_name'])) {
                $fields[] = 'first_name = ?';
                $values[] = $data['first_name'];
            }
            
            if (isset($data['last_name']) && !empty($data['last_name'])) {
                $fields[] = 'last_name = ?';
                $values[] = $data['last_name'];
            }
            
            if (isset($data['phone'])) {
                $fields[] = 'phone = ?';
                $values[] = $data['phone'];
            }
            
            if (isset($data['organization'])) {
                $fields[] = 'organization = ?';
                $values[] = $data['organization'];
            }
            
            if (isset($data['email']) && !empty($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    $response->getBody()->write(json_encode([
                        'error' => 'Invalid email address'
                    ]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
                
                // Check if email is already taken by another user
                $emailStmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $emailStmt->execute([$data['email'], $currentUser->user_id]);
                if ($emailStmt->fetch()) {
                    $response->getBody()->write(json_encode([
                        'error' => 'Email address is already in use'
                    ]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
                
                $fields[] = 'email = ?';
                $values[] = $data['email'];
            }
            
            if (empty($fields)) {
                $response->getBody()->write(json_encode([
                    'error' => 'No valid fields to update'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $fields[] = 'updated_at = NOW()';
            $values[] = $currentUser->user_id;
            
            $stmt = $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);
            
            // Get updated user data
            $userStmt = $db->prepare("
                SELECT id, username, email, first_name, last_name, phone, 
                       organization, role, status, created_at, last_login
                FROM users WHERE id = ?
            ");
            $userStmt->execute([$currentUser->user_id]);
            $user = $userStmt->fetch();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $user
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Update profile error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update profile'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function changePassword(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $currentUser = $request->getAttribute('user');
        
        if (!$currentUser) {
            $response->getBody()->write(json_encode([
                'error' => 'Authentication required'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        // Validate required fields
        if (empty($data['current_password']) || empty($data['new_password'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Current password and new password are required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Validate new password length
        if (strlen($data['new_password']) < 6) {
            $response->getBody()->write(json_encode([
                'error' => 'New password must be at least 6 characters long'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Get current user's password hash
            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$currentUser->user_id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'error' => 'User not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Verify current password
            if (!password_verify($data['current_password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Current password is incorrect'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Update password
            $newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $updateStmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$newPasswordHash, $currentUser->user_id]);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Password changed successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            error_log("Change password error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to change password'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function googleCallback(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        
        if (isset($params['error'])) {
            // Handle OAuth error
            $response->getBody()->write(json_encode([
                'error' => 'OAuth authorization failed: ' . $params['error']
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        if (!isset($params['code'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Authorization code not provided'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            // Exchange authorization code for access token
            $tokenData = $this->exchangeCodeForToken($params['code']);
            
            if (!$tokenData) {
                $response->getBody()->write(json_encode([
                    'error' => 'Failed to exchange authorization code for token'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Get user info from Google
            $userInfo = $this->getGoogleUserInfo($tokenData['access_token']);
            
            if (!$userInfo) {
                $response->getBody()->write(json_encode([
                    'error' => 'Failed to get user information from Google'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $db = Database::getInstance();
            
            // Check if user already exists by email
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$userInfo['email']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // Create new user from Google data
                $insertStmt = $db->prepare("
                    INSERT INTO users (
                        first_name, last_name, email, username, google_id,
                        profile_image, role, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'user', 'active', NOW())
                ");
                
                $username = strtolower($userInfo['given_name'] . '_' . $userInfo['family_name']);
                // Ensure username is unique
                $baseUsername = $username;
                $counter = 1;
                while (true) {
                    $checkStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
                    $checkStmt->execute([$username]);
                    if (!$checkStmt->fetch()) {
                        break;
                    }
                    $username = $baseUsername . '_' . $counter;
                    $counter++;
                }
                
                $insertStmt->execute([
                    $userInfo['given_name'],
                    $userInfo['family_name'],
                    $userInfo['email'],
                    $username,
                    $userInfo['id'],
                    $userInfo['picture'] ?? null
                ]);
                
                $userId = $db->lastInsertId();
                
                // Get the created user
                $userStmt = $db->prepare("
                    SELECT id, first_name, last_name, email, username, role, status 
                    FROM users WHERE id = ?
                ");
                $userStmt->execute([$userId]);
                $user = $userStmt->fetch();
            }
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
            
            // Redirect to frontend with token
            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://yourdomain.com';
            $redirectUrl = $frontendUrl . '/auth/callback?token=' . urlencode($token) . '&user=' . urlencode(json_encode([
                'id' => $user['id'],
                'username' => $user['username'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]));
            
            return $response->withStatus(302)->withHeader('Location', $redirectUrl);
            
        } catch (\Exception $e) {
            error_log("Google OAuth callback error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Authentication failed'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function exchangeCodeForToken($code)
    {
        $data = [
            'client_id' => $_ENV['GOOGLE_CLIENT_ID'],
            'client_secret' => $_ENV['GOOGLE_CLIENT_SECRET'],
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI']
        ];
        
        $options = [
            'http' => [
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                'method'  => 'POST',
                'content' => http_build_query($data)
            ]
        ];
        
        $context = stream_context_create($options);
        $response = file_get_contents('https://oauth2.googleapis.com/token', false, $context);
        
        if ($response === false) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    private function getGoogleUserInfo($accessToken)
    {
        $options = [
            'http' => [
                'header' => "Authorization: Bearer $accessToken\r\n"
            ]
        ];
        
        $context = stream_context_create($options);
        $response = file_get_contents('https://www.googleapis.com/oauth2/v2/userinfo', false, $context);
        
        if ($response === false) {
            return false;
        }
        
        return json_decode($response, true);
    }

    private function verifyGoogleToken($token)
    {
        try {
            $url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' . $token;
            $response = file_get_contents($url);
            
            if ($response === false) {
                return false;
            }
            
            $userInfo = json_decode($response, true);
            
            // Verify the token is valid and for our app
            if (isset($userInfo['error']) || !isset($userInfo['email'])) {
                return false;
            }
            
            return $userInfo;
        } catch (\Exception $e) {
            error_log("Google token verification error: " . $e->getMessage());
            return false;
        }
    }
}