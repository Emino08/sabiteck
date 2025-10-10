<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;
use App\Services\EmailService;
use App\Services\PermissionService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

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
            
            // Generate a secure password if not provided or create flag is set
            $generatedPassword = null;
            $isAdminCreated = isset($data['admin_created']) && $data['admin_created'];

            if ($isAdminCreated || empty($data['password'])) {
                $generatedPassword = $this->generateSecurePassword();
                $passwordToHash = $generatedPassword;
            } else {
                $passwordToHash = $data['password'];
            }

            // Hash password
            $passwordHash = password_hash($passwordToHash, PASSWORD_DEFAULT);

            // Determine role
            $requestedRole = $data['role'] ?? 'user';
            $roleId = $this->getRoleId($db, $requestedRole);

            // Create user (without role columns - we'll use user_roles table)
            $stmt = $db->prepare("
                INSERT INTO users (
                    first_name, last_name, email, username, password_hash,
                    phone, organization, status, must_change_password, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
            ");

            $stmt->execute([
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $data['username'],
                $passwordHash,
                $data['phone'] ?? null,
                $data['organization'] ?? null,
                $isAdminCreated ? 1 : 0  // Must change password if admin created
            ]);

            $userId = $db->lastInsertId();

            // Assign role via user_roles table
            if ($roleId) {
                $roleStmt = $db->prepare("
                    INSERT INTO user_roles (user_id, role_id, created_at)
                    VALUES (?, ?, NOW())
                ");
                $roleStmt->execute([$userId, $roleId]);
            }

            // Send password email if it was generated
            if ($generatedPassword) {
                $this->sendPasswordEmail($data['email'], $data['first_name'] . ' ' . $data['last_name'], $generatedPassword, $isAdminCreated);
            }

            // Get the created user with role info
            $userStmt = $db->prepare("
                SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.status,
                       r.name as role_name, r.display_name as role_display_name
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            ");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();

            $message = $generatedPassword ? 'Account created successfully. Password sent to email.' : 'Account created successfully';

            $response->getBody()->write(json_encode([
                'message' => $message,
                'user' => $user,
                'password_sent' => $generatedPassword ? true : false
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
                SELECT u.id, u.username, u.password_hash, u.first_name, u.last_name,
                       u.email, u.status, u.failed_login_attempts, u.locked_until, u.must_change_password,
                       r.name as role_name, r.display_name as role_display_name
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE (u.username = ? OR u.email = ?) AND u.status IN ('active', 'pending')
            ");
            $stmt->execute([$data['username'], $data['username']]);
            $user = $stmt->fetch();

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid username or password'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Check if account is locked
            if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
                $response->getBody()->write(json_encode([
                    'error' => 'Account is temporarily locked due to too many failed login attempts'
                ]));
                return $response->withStatus(423)->withHeader('Content-Type', 'application/json');
            }

            // Verify password
            if (!password_verify($data['password'], $user['password_hash'])) {
                // Increment failed login attempts
                $this->handleFailedLogin($db, $user['id'], $user['failed_login_attempts']);

                $response->getBody()->write(json_encode([
                    'error' => 'Invalid username or password'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Reset failed login attempts and activate pending users on successful login
            $updateStmt = $db->prepare("UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL, status = CASE WHEN status = 'pending' THEN 'active' ELSE status END WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            // Get user permissions
            $permissionService = new PermissionService($db);
            $userPermissions = $permissionService->getUserPermissions($user['id']);
            $userModules = $permissionService->getUserModules($user['id']);

            // Generate JWT token with permissions
            $permissionNames = array_column($userPermissions, 'name');
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role_name' => $user['role_name'],
                'permissions' => $permissionNames,
                'modules' => $userModules,
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];

            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

            $responseData = [
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
                        'role_name' => $user['role_name'],
                        'role_display_name' => $user['role_display_name'],
                        'must_change_password' => (bool)$user['must_change_password']
                    ],
                    'permissions' => $permissionNames,
                    'modules' => $userModules
                ]
            ];

            // Check if password must be changed
            if ($user['must_change_password']) {
                $responseData['message'] = 'Login successful. You must change your password.';
                $responseData['action_required'] = 'change_password';
            }

            $response->getBody()->write(json_encode($responseData));
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
                        first_name, last_name, email, username, password_hash, google_id,
                        profile_image, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
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
                    'GOOGLE_OAUTH_USER', // Placeholder password_hash for Google OAuth users
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
            error_log("Stack trace: " . $e->getTraceAsString());
            $response->getBody()->write(json_encode([
                'error' => 'Authentication failed',
                'details' => $e->getMessage(),
                'debug' => [
                    'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI'] ?? 'NOT_SET',
                    'client_id' => $_ENV['GOOGLE_CLIENT_ID'] ?? 'NOT_SET',
                    'has_secret' => isset($_ENV['GOOGLE_CLIENT_SECRET']) ? 'YES' : 'NO'
                ]
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

    public function googleRedirect(Request $request, Response $response, $args)
    {
        try {
            $googleClientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
            $redirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? '';

            if (empty($googleClientId) || empty($redirectUri)) {
                $response->getBody()->write(json_encode([
                    'error' => 'Google OAuth is not properly configured'
                ]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $scopes = 'openid email profile';

            $googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'client_id' => $googleClientId,
                'redirect_uri' => $redirectUri,
                'scope' => $scopes,
                'response_type' => 'code',
                'access_type' => 'offline',
                'prompt' => 'select_account'
            ]);

            return $response->withStatus(302)->withHeader('Location', $googleAuthUrl);

        } catch (\Exception $e) {
            error_log("Google OAuth redirect error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Failed to initialize Google OAuth'
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
                        first_name, last_name, email, username, password_hash, google_id,
                        profile_image, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
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
                    'GOOGLE_OAUTH_USER', // Placeholder password_hash for Google OAuth users
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
            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5182';
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
            error_log("Stack trace: " . $e->getTraceAsString());

            // Redirect to frontend with error
            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5182';
            $errorUrl = $frontendUrl . '/auth/callback?error=' . urlencode('Authentication failed: ' . $e->getMessage());

            return $response->withStatus(302)->withHeader('Location', $errorUrl);
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
            error_log("Google token exchange failed for code: $code");
            error_log("Request data: " . json_encode($data));
            $error = error_get_last();
            error_log("Last error: " . json_encode($error));
            return false;
        }

        $tokenData = json_decode($response, true);
        if (isset($tokenData['error'])) {
            error_log("Google token exchange error: " . json_encode($tokenData));
        }

        return $tokenData;
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

    public function adminRegister(Request $request, Response $response, $args)
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

            // Create admin user
            $stmt = $db->prepare("
                INSERT INTO users (
                    first_name, last_name, email, username, password_hash,
                    phone, organization, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
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

            // Assign admin role via user_roles table
            $adminRoleStmt = $db->prepare("
                INSERT INTO user_roles (user_id, role_id, created_at)
                SELECT ?, id, NOW() FROM roles WHERE name = 'admin'
            ");
            $adminRoleStmt->execute([$userId]);

            // Get the created admin user
            $userStmt = $db->prepare("
                SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.status,
                       r.name as role_name, r.display_name as role_display_name
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            ");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();

            $response->getBody()->write(json_encode([
                'message' => 'Admin account created successfully',
                'user' => $user
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Admin registration error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Admin registration failed. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
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

    /**
     * Forgot password functionality
     */
    public function forgotPassword(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);

        if (empty($data['email'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Email address is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $db = Database::getInstance();

            // Check if user exists
            $stmt = $db->prepare("SELECT id, first_name, last_name, email FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch();

            // Always return success message to prevent email enumeration
            $successMessage = 'If an account with that email exists, a password reset link has been sent.';

            if ($user) {
                // Generate reset token
                $token = bin2hex(random_bytes(32));
                $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

                // Store reset token
                $stmt = $db->prepare("
                    INSERT INTO password_resets (email, token, expires_at)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$data['email'], $token, $expiresAt]);

                // Send password reset email
                $this->sendPasswordResetEmail(
                    $user['email'],
                    $user['first_name'] . ' ' . $user['last_name'],
                    $token
                );
            }

            $response->getBody()->write(json_encode([
                'message' => $successMessage
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Forgot password error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Unable to process request. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);

        $required = ['token', 'password', 'password_confirmation'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }

        if ($data['password'] !== $data['password_confirmation']) {
            $response->getBody()->write(json_encode([
                'error' => 'Passwords do not match'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        if (strlen($data['password']) < 6) {
            $response->getBody()->write(json_encode([
                'error' => 'Password must be at least 6 characters long'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $db = Database::getInstance();

            // Verify reset token
            $stmt = $db->prepare("
                SELECT email FROM password_resets
                WHERE token = ? AND expires_at > NOW() AND used = 0
            ");
            $stmt->execute([$data['token']]);
            $reset = $stmt->fetch();

            if (!$reset) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid or expired reset token'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Update user password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("
                UPDATE users SET
                    password_hash = ?,
                    must_change_password = 0,
                    last_password_change = NOW(),
                    failed_login_attempts = 0,
                    locked_until = NULL
                WHERE email = ?
            ");
            $stmt->execute([$passwordHash, $reset['email']]);

            // Mark token as used
            $stmt = $db->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
            $stmt->execute([$data['token']]);

            $response->getBody()->write(json_encode([
                'message' => 'Password reset successfully'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Reset password error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Unable to reset password. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Invite a new user (Admin only) with automatic password generation and email
     */
    public function inviteUser(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);

        // Validate required fields
        $required = ['first_name', 'last_name', 'email', 'username', 'role'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Please provide a valid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $db = Database::getInstance();
            
            // Get the current user (admin who is inviting)
            $currentUserId = $this->getUserIdFromToken($request);
            if (!$currentUserId) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Authentication required'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Check if email already exists
            $emailStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $emailStmt->execute([$data['email']]);
            if ($emailStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Email address is already registered'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Check if username already exists
            $usernameStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $usernameStmt->execute([$data['username']]);
            if ($usernameStmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Username is already taken'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Generate a secure random password
            $generatedPassword = $this->generateSecurePassword();
            $passwordHash = password_hash($generatedPassword, PASSWORD_DEFAULT);

            // Get role ID from role name
            $roleStmt = $db->prepare("SELECT id, name FROM roles WHERE name = ? OR display_name = ?");
            $roleStmt->execute([$data['role'], $data['role']]);
            $role = $roleStmt->fetch();

            if (!$role) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid role specified'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $roleId = $role['id'];
            $roleName = $role['name'];

            // Start transaction
            $db->beginTransaction();

            try {
                // Create user (without role columns - we'll use user_roles table)
                $stmt = $db->prepare("
                    INSERT INTO users (
                        first_name, last_name, email, username, password_hash,
                        phone, organization, status, must_change_password, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, NOW())
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

                // Assign role to user in user_roles table
                $stmt = $db->prepare("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, NOW())");
                $stmt->execute([$userId, $roleId]);

                // Get role permissions and assign them to user
                $permissionService = new PermissionService($db);
                $userPermissions = $permissionService->getUserPermissions($userId);
                $userModules = $permissionService->getUserModules($userId);

                // Commit transaction
                $db->commit();

                // Send invitation email with credentials and permissions
                $this->sendInvitationEmail(
                    $data['email'],
                    $data['first_name'] . ' ' . $data['last_name'],
                    $generatedPassword,
                    $data['username'],
                    $role['name'],
                    $userPermissions
                );

                // Get the created user
                $userStmt = $db->prepare("
                    SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.status,
                           r.name as role_name, r.display_name as role_display_name
                    FROM users u
                    LEFT JOIN user_roles ur ON u.id = ur.user_id
                    LEFT JOIN roles r ON ur.role_id = r.id
                    WHERE u.id = ?
                ");
                $userStmt->execute([$userId]);
                $user = $userStmt->fetch();

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'User invited successfully. Login credentials sent to their email.',
                    'user' => $user
                ]));
                return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

            } catch (\Exception $e) {
                $db->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log("User invitation error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to invite user. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);

        $required = ['current_password', 'new_password', 'password_confirmation'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }

        if ($data['new_password'] !== $data['password_confirmation']) {
            $response->getBody()->write(json_encode([
                'error' => 'New passwords do not match'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Get user ID from JWT token (implement JWT middleware)
            $userId = $this->getUserIdFromToken($request);
            if (!$userId) {
                $response->getBody()->write(json_encode([
                    'error' => 'Authentication required'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance();

            // Get current user
            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($data['current_password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Current password is incorrect'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Update password
            $passwordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("
                UPDATE users SET
                    password_hash = ?,
                    must_change_password = 0,
                    last_password_change = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$passwordHash, $userId]);

            $response->getBody()->write(json_encode([
                'message' => 'Password changed successfully'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            error_log("Change password error: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Unable to change password. Please try again.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Generate a secure password
     */
    private function generateSecurePassword($length = 12): string
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $password;
    }

    /**
     * Get role ID from role name
     */
    private function getRoleId($db, string $roleName): ?int
    {
        try {
            $stmt = $db->prepare("SELECT id FROM roles WHERE name = ? OR display_name = ?");
            $stmt->execute([$roleName, $roleName]);
            $role = $stmt->fetch();
            return $role ? $role['id'] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Handle failed login attempt
     */
    private function handleFailedLogin($db, int $userId, int $currentAttempts): void
    {
        $newAttempts = $currentAttempts + 1;
        $lockUntil = null;

        // Lock account after 5 failed attempts for 30 minutes
        if ($newAttempts >= 5) {
            $lockUntil = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        }

        $stmt = $db->prepare("
            UPDATE users SET
                failed_login_attempts = ?,
                locked_until = ?
            WHERE id = ?
        ");
        $stmt->execute([$newAttempts, $lockUntil, $userId]);
    }

    /**
     * Send password email for new accounts
     */
    private function sendPasswordEmail(string $email, string $name, string $password, bool $isAdminCreated): void
    {
        try {
            // Get email configuration from .env
            // Use authentication email configuration for user account emails
            $emailConfig = [
                'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
                'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
                'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
                'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
                'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
                'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabitech Authentication'
            ];

            $emailService = new EmailService($emailConfig);

            $subject = 'Your Account Access Details - Sabiteck Limited';

            $body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: #007bff; color: white; padding: 20px; text-align: center;'>
                    <h1>Welcome to Sabiteck Limited</h1>
                </div>
                <div style='padding: 30px; background: #f8f9fa;'>
                    <h2>Hello $name,</h2>
                    <p>Your account has been " . ($isAdminCreated ? "created by an administrator" : "successfully registered") . ".</p>
                    <div style='background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin: 20px 0;'>
                        <h3>Your Login Details:</h3>
                        <p><strong>Email:</strong> $email</p>
                        <p><strong>Password:</strong> $password</p>
                    </div>
                    " . ($isAdminCreated ? "<p><strong>Important:</strong> You will be required to change this password when you first log in.</p>" : "") . "
                    <p>Please keep these credentials secure and do not share them with anyone.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='" . ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/login' style='background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Login to Your Account</a>
                    </div>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
                <div style='background: #343a40; color: white; padding: 20px; text-align: center; font-size: 12px;'>
                    <p>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
                </div>
            </div>";

            $emailService->sendEmail($email, $subject, $body, true, $name);

        } catch (\Exception $e) {
            error_log("Failed to send password email: " . $e->getMessage());
        }
    }

    /**
     * Send password reset email
     */
    private function sendPasswordResetEmail(string $email, string $name, string $token): void
    {
        try {
            // Use authentication email configuration for user account emails
            $emailConfig = [
                'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
                'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
                'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
                'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
                'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
                'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabitech Authentication'
            ];

            $emailService = new EmailService($emailConfig);

            $resetUrl = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/reset-password?token=$token";

            $subject = 'Password Reset Request - Sabiteck Limited';

            $body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: #dc3545; color: white; padding: 20px; text-align: center;'>
                    <h1>Password Reset Request</h1>
                </div>
                <div style='padding: 30px; background: #f8f9fa;'>
                    <h2>Hello $name,</h2>
                    <p>We received a request to reset your password for your Sabiteck Limited account.</p>
                    <p>If you requested this password reset, click the button below to reset your password:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='$resetUrl' style='background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Your Password</a>
                    </div>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
                    <p>For security reasons, this password reset link can only be used once.</p>
                </div>
                <div style='background: #343a40; color: white; padding: 20px; text-align: center; font-size: 12px;'>
                    <p>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
                </div>
            </div>";

            $emailService->sendEmail($email, $subject, $body, true, $name);

        } catch (\Exception $e) {
            error_log("Failed to send password reset email: " . $e->getMessage());
        }
    }

    /**
     * Send invitation email with credentials and role/permissions details
     */
    private function sendInvitationEmail(string $email, string $name, string $password, string $username, string $roleName, array $permissions): void
    {
        try {
            // Use authentication email configuration for user account emails
            $emailConfig = [
                'smtp_host' => $_ENV['AUTH_SMTP_HOST'] ?? 'smtp.gmail.com',
                'smtp_port' => $_ENV['AUTH_SMTP_PORT'] ?? 587,
                'smtp_user' => $_ENV['AUTH_SMTP_USER'] ?? 'auth@sabiteck.com',
                'smtp_password' => $_ENV['AUTH_SMTP_PASS'] ?? '',
                'smtp_encryption' => $_ENV['AUTH_SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $_ENV['AUTH_FROM_EMAIL'] ?? 'auth@sabiteck.com',
                'from_name' => $_ENV['AUTH_FROM_NAME'] ?? 'Sabitech Authentication'
            ];

            $emailService = new EmailService($emailConfig);

            // Group permissions by category for better presentation
            $groupedPermissions = [];
            foreach ($permissions as $permission) {
                $category = $permission['category'] ?? 'General';
                if (!isset($groupedPermissions[$category])) {
                    $groupedPermissions[$category] = [];
                }
                $groupedPermissions[$category][] = $permission['display_name'] ?? $permission['name'];
            }

            // Build permissions HTML
            $permissionsHtml = '';
            foreach ($groupedPermissions as $category => $perms) {
                $permissionsHtml .= "<h4 style='margin: 15px 0 5px; color: #007bff;'>" . ucfirst($category) . "</h4>";
                $permissionsHtml .= "<ul style='margin: 5px 0; padding-left: 20px;'>";
                foreach ($perms as $perm) {
                    $permissionsHtml .= "<li style='margin: 3px 0;'>$perm</li>";
                }
                $permissionsHtml .= "</ul>";
            }

            $subject = 'Welcome to Sabiteck Limited - Your Account Details';

            $body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;'>
                    <h1 style='margin: 0;'>Welcome to Sabiteck Limited</h1>
                </div>
                <div style='padding: 30px; background: #f8f9fa;'>
                    <h2>Hello $name,</h2>
                    <p>An account has been created for you in the Sabiteck Limited Admin System. Below are your login credentials and assigned permissions.</p>
                    
                    <div style='background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin: 20px 0;'>
                        <h3 style='margin-top: 0;'>Your Login Details:</h3>
                        <p><strong>Username:</strong> $username</p>
                        <p><strong>Email:</strong> $email</p>
                        <p><strong>Temporary Password:</strong> <code style='background: #f4f4f4; padding: 5px 10px; border-radius: 4px; color: #d63384;'>$password</code></p>
                        <p><strong>Role:</strong> <span style='background: #28a745; color: white; padding: 3px 10px; border-radius: 4px;'>" . ucwords(str_replace('_', ' ', $roleName)) . "</span></p>
                    </div>
                    
                    <div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                        <p style='margin: 0;'><strong>⚠️ Important Security Notice:</strong></p>
                        <p style='margin: 5px 0 0;'>You will be required to change this temporary password when you first log in for security purposes.</p>
                    </div>
                    
                    <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0;'>Your Permissions & Access:</h3>
                        <p>Based on your role, you have been granted access to the following modules:</p>
                        $permissionsHtml
                    </div>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='" . ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/admin/login' style='background: #007bff; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>Login to Your Account</a>
                    </div>
                    
                    <div style='background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                        <p style='margin: 0;'><strong>📋 Next Steps:</strong></p>
                        <ol style='margin: 10px 0 0; padding-left: 20px;'>
                            <li>Click the login button above to access the admin panel</li>
                            <li>Enter your username and temporary password</li>
                            <li>Create a new secure password when prompted</li>
                            <li>Start managing your assigned modules</li>
                        </ol>
                    </div>
                    
                    <p style='margin-top: 30px;'>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
                    <p style='color: #6c757d; font-size: 14px; margin-top: 20px;'>Please keep your login credentials secure and do not share them with anyone.</p>
                </div>
                <div style='background: #343a40; color: white; padding: 20px; text-align: center; font-size: 12px;'>
                    <p style='margin: 0;'>&copy; " . date('Y') . " Sabiteck Limited. All rights reserved.</p>
                    <p style='margin: 10px 0 0;'>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>";

            $emailService->sendEmail($email, $subject, $body, true, $name);

        } catch (\Exception $e) {
            error_log("Failed to send invitation email: " . $e->getMessage());
        }
    }

    /**
     * Get user ID from JWT token
     */
    private function getUserIdFromToken(Request $request): ?int
    {
        try {
            $authHeader = $request->getHeader('Authorization');
            if (empty($authHeader)) {
                return null;
            }

            $token = str_replace('Bearer ', '', $authHeader[0]);
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));

            return $decoded->user_id ?? null;

        } catch (\Exception $e) {
            return null;
        }
    }
}