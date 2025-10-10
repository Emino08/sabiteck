<?php
/**
 * Password Reset Handler Functions
 * Handles forgot password functionality for both admin and general users
 */

/**
 * Generate a secure random token
 */
function generateResetToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Generate a 6-digit passcode
 */
function generatePasscode() {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Send password reset email with link and passcode
 */
function sendPasswordResetEmail($email, $username, $resetLink, $passcode) {
    $to = $email;
    $subject = "Password Reset Request - SABITECK";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .passcode { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .passcode-value { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class='content'>
                <p>Hello <strong>{$username}</strong>,</p>
                
                <p>We received a request to reset your password. You can reset your password using either of the following methods:</p>
                
                <h3>Method 1: Reset Link</h3>
                <p>Click the button below to reset your password:</p>
                <a href='{$resetLink}' class='button'>Reset Password</a>
                <p style='font-size: 12px; color: #6b7280;'>Or copy this link: {$resetLink}</p>
                
                <h3>Method 2: Passcode</h3>
                <p>Enter this 6-digit passcode on the password reset page:</p>
                <div class='passcode'>
                    <div class='passcode-value'>{$passcode}</div>
                    <p style='margin: 10px 0 0 0; color: #6b7280; font-size: 14px;'>Valid for 1 hour</p>
                </div>
                
                <div class='warning'>
                    <strong>⚠️ Security Notice:</strong>
                    <ul style='margin: 10px 0 0 0; padding-left: 20px;'>
                        <li>This link and passcode expire in 1 hour</li>
                        <li>If you didn't request this, please ignore this email</li>
                        <li>Never share your passcode with anyone</li>
                    </ul>
                </div>
                
                <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <div class='footer'>
                    <p>© 2024 SABITECK. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: SABITECK Admin <noreply@sabiteck.com>" . "\r\n";
    
    return mail($to, $subject, $message, $headers);
}

/**
 * Handle forgot password request
 */
function handleForgotPassword($db) {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['email'])) {
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        return;
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'Invalid email format']);
        return;
    }
    
    try {
        // Check if user exists
        $stmt = $db->prepare("SELECT id, username, email FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // For security, don't reveal if email exists or not
            echo json_encode([
                'success' => true, 
                'message' => 'If your email is registered, you will receive a password reset link and passcode shortly.'
            ]);
            return;
        }
        
        // Generate token and passcode
        $token = generateResetToken();
        $passcode = generatePasscode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Delete any existing reset tokens for this user
        $stmt = $db->prepare("DELETE FROM password_resets WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        
        // Store reset token and passcode
        $stmt = $db->prepare("
            INSERT INTO password_resets (user_id, token, passcode, expires_at, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$user['id'], $token, $passcode, $expiresAt]);
        
        // Generate reset link
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        $resetLink = "{$frontendUrl}/reset-password?token={$token}";
        
        // Send email
        $emailSent = sendPasswordResetEmail($user['email'], $user['username'], $resetLink, $passcode);
        
        if ($emailSent) {
            echo json_encode([
                'success' => true, 
                'message' => 'Password reset instructions have been sent to your email.'
            ]);
        } else {
            echo json_encode([
                'success' => false, 
                'error' => 'Failed to send reset email. Please try again later.'
            ]);
        }
        
    } catch (PDOException $e) {
        error_log('Forgot password error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'An error occurred. Please try again.']);
    }
}

/**
 * Verify reset token or passcode
 */
function handleVerifyResetToken($db) {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if token or passcode is provided
    $token = $input['token'] ?? '';
    $passcode = $input['passcode'] ?? '';
    
    if (empty($token) && empty($passcode)) {
        echo json_encode(['success' => false, 'error' => 'Token or passcode is required']);
        return;
    }
    
    try {
        if (!empty($token)) {
            // Verify by token
            $stmt = $db->prepare("
                SELECT pr.*, u.email, u.username 
                FROM password_resets pr 
                JOIN users u ON pr.user_id = u.id 
                WHERE pr.token = ? AND pr.expires_at > NOW() AND pr.used = 0
            ");
            $stmt->execute([$token]);
        } else {
            // Verify by passcode
            $stmt = $db->prepare("
                SELECT pr.*, u.email, u.username 
                FROM password_resets pr 
                JOIN users u ON pr.user_id = u.id 
                WHERE pr.passcode = ? AND pr.expires_at > NOW() AND pr.used = 0
            ");
            $stmt->execute([$passcode]);
        }
        
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reset) {
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid or expired reset token/passcode'
            ]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'email' => $reset['email'],
                'username' => $reset['username'],
                'token' => $reset['token']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log('Verify reset token error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'An error occurred. Please try again.']);
    }
}

/**
 * Reset password with token or passcode
 */
function handleResetPassword($db) {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $token = $input['token'] ?? '';
    $passcode = $input['passcode'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['password_confirmation'] ?? '';
    
    if (empty($token) && empty($passcode)) {
        echo json_encode(['success' => false, 'error' => 'Token or passcode is required']);
        return;
    }
    
    if (empty($newPassword)) {
        echo json_encode(['success' => false, 'error' => 'New password is required']);
        return;
    }
    
    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'error' => 'Passwords do not match']);
        return;
    }
    
    if (strlen($newPassword) < 8) {
        echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long']);
        return;
    }
    
    try {
        // Find reset request
        if (!empty($token)) {
            $stmt = $db->prepare("
                SELECT * FROM password_resets 
                WHERE token = ? AND expires_at > NOW() AND used = 0
            ");
            $stmt->execute([$token]);
        } else {
            $stmt = $db->prepare("
                SELECT * FROM password_resets 
                WHERE passcode = ? AND expires_at > NOW() AND used = 0
            ");
            $stmt->execute([$passcode]);
        }
        
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reset) {
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid or expired reset token/passcode'
            ]);
            return;
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update user password
        $stmt = $db->prepare("
            UPDATE users 
            SET password_hash = ?, 
                last_password_change = NOW(), 
                updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$hashedPassword, $reset['user_id']]);
        
        // Mark reset token as used
        $stmt = $db->prepare("
            UPDATE password_resets 
            SET used = 1, used_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$reset['id']]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Password has been reset successfully. You can now login with your new password.'
        ]);
        
    } catch (PDOException $e) {
        error_log('Reset password error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'An error occurred. Please try again.']);
    }
}
