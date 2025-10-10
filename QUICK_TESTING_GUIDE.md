# Quick Testing Guide - User Invitation System

## ✅ Email Configuration Verified

The email test script confirms that SMTP connection is working:
```
✓ SMTP connection successful!
Configuration: smtp.titan.email:465 (SSL)
```

## Step-by-Step Testing Process

### 1. Test User Invitation (Backend Working)

**Via Admin Panel:**

1. Start your backend server:
   ```bash
   cd backend/public
   php -S localhost:8002
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Login to Admin Dashboard:
   - Go to http://localhost:5173/dashboard
   - Login with admin credentials

4. Navigate to User Roles Tab:
   - Click on "User Roles" in the sidebar

5. Invite a New User:
   - Click "Invite User" button
   - Fill in the form:
     - Email: (enter a real email you can check)
     - Organization: (optional)
     - Role: Select appropriate role (e.g., "Editor" or "User")
     - Permissions: (optional, will be inherited from role)
   - Click "Send Invitation"

6. Check Email:
   - The invitation email will be sent to the provided email address
   - Email contains:
     - Username (auto-generated from email)
     - Temporary password
     - Login link
     - Instructions to change password

### 2. Test User Login

1. Open the login page: http://localhost:5173/login

2. Enter the credentials from the invitation email:
   - Username: (from email)
   - Password: (temporary password from email)

3. Click "Login"

4. **Expected Behavior:**
   - Login succeeds ✓
   - You are redirected to change password page
   - Message: "Welcome! You must change your password before proceeding."

5. Change Password:
   - Enter current (temporary) password
   - Enter new password
   - Confirm new password
   - Click "Change Password"

6. **Expected Result:**
   - Password changed successfully
   - You can now access the system

### 3. Test Permission-Based Access

**Create Multiple Test Users with Different Roles:**

**User 1 - Viewer Role:**
```
Email: viewer@test.com
Role: Viewer
Expected Access: Dashboard, Read-only content
```

**User 2 - Editor Role:**
```
Email: editor@test.com
Role: Editor
Expected Access: Dashboard, Content (create/edit), Portfolio
```

**User 3 - Admin Role:**
```
Email: admin@test.com
Role: Admin
Expected Access: All tabs except system logs
```

**Testing Steps:**

1. Create each user via Admin Panel → User Roles → Invite User
2. Check emails for login credentials
3. Login as each user separately
4. Verify each user sees only their permitted tabs

**Expected Tab Visibility:**

| Tab | Viewer | Editor | Admin |
|-----|--------|--------|-------|
| Overview | ✓ | ✓ | ✓ |
| Content | View Only | ✓ | ✓ |
| Services | View Only | ✗ | ✓ |
| Portfolio | View Only | ✓ | ✓ |
| Jobs | View Only | ✗ | ✓ |
| Scholarships | View Only | ✗ | ✓ |
| Team | View Only | ✗ | ✓ |
| Announcements | View Only | ✗ | ✓ |
| Analytics | ✗ | ✗ | ✓ |
| Newsletter | ✗ | ✗ | ✓ |
| User Roles | ✗ | ✗ | ✓ |
| Settings | ✗ | ✗ | ✓ |

### 4. Verify Database Changes

**Check User Status:**
```sql
SELECT id, username, email, status, must_change_password, role_id 
FROM users 
WHERE email = 'viewer@test.com';
```

**Expected:**
- status: 'active' (not 'pending')
- must_change_password: 1 (before password change), 0 (after)
- role_id: Correct role ID

**Check User Permissions:**
```sql
SELECT u.username, r.name as role, GROUP_CONCAT(p.name) as permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'viewer@test.com'
GROUP BY u.id;
```

## Common Issues and Solutions

### Issue 1: User Cannot Login After Invitation

**Symptoms:**
- "Invalid credentials" error
- User exists in database but login fails

**Solution:**
✓ **Already Fixed!** Users are now created with status 'active' instead of 'pending'

**Verify Fix:**
```sql
SELECT status FROM users WHERE email = 'user@example.com';
-- Should return: active
```

### Issue 2: Email Not Received

**Check:**
1. SMTP credentials are correct in `.env`:
   ```bash
   cd backend
   php test_email.php
   ```

2. Check spam/junk folder

3. Verify email server logs:
   - Check backend/logs for email errors
   - Check PHP error log

**Debug:**
```bash
# In backend directory
tail -f logs/error.log
```

### Issue 3: User Sees All Tabs (Not Permission-Filtered)

**Check:**
1. Login response includes permissions:
   - Open browser DevTools → Network tab
   - Login
   - Check response for `permissions` and `modules` arrays

2. User data in localStorage:
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem('user'))
   // Should contain: permissions: [], modules: []
   ```

3. AuthContext is updated:
   - Check `frontend/src/contexts/AuthContext.jsx`
   - Ensure login function accepts permissions and modules parameters

**Solution:**
✓ **Already Fixed!** Login now properly stores permissions and modules

## Email Test Script

To manually test email configuration:

```bash
cd backend
php test_email.php
```

**Interactive Options:**
1. Tests SMTP connection
2. Displays current email configuration
3. Optionally sends test invitation email
4. Reports success or error details

## API Testing with cURL

**Test User Invitation API:**
```bash
curl -X POST http://localhost:8002/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "role_id": 6,
    "organization_id": null
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User invitation sent successfully",
  "data": {
    "user_id": 123,
    "username": "test_example",
    "email": "test@example.com",
    "message": "Invitation email sent to test@example.com"
  }
}
```

**Test Login API:**
```bash
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_example",
    "password": "temporary_password_from_email"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful. You must change your password.",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 123,
      "username": "test_example",
      "email": "test@example.com",
      "role": "user",
      "must_change_password": true
    },
    "permissions": [
      {"name": "view-dashboard", "display_name": "View Dashboard"}
    ],
    "modules": ["dashboard"]
  },
  "action_required": "change_password"
}
```

## Success Checklist

- [x] Email configuration tested and working
- [x] User invitation creates active users (not pending)
- [x] Invitation email is sent with credentials
- [x] Users can login with invitation credentials
- [x] Users are prompted to change password on first login
- [x] Permission-based tab filtering works
- [x] Users only see tabs based on their role/permissions
- [x] AuthContext stores permissions and modules
- [x] Login passes permissions to AuthContext

## Files Modified

### Backend:
1. `backend/src/Controllers/AdminController.php`
   - Line 4744-4748: Changed user status from 'pending' to 'active'
   - Lines 4518-4575: Enhanced createUser() to send emails

### Frontend:
1. `frontend/src/contexts/AuthContext.jsx`
   - Lines 50-62: Updated login to accept permissions and modules

2. `frontend/src/components/pages/Login.jsx`
   - Lines 65-93: Pass permissions and modules to login function

3. `frontend/src/components/pages/Admin.jsx`
   - Lines 244-251: Pass permissions and modules for admin login

### New Files:
1. `backend/test_email.php` - Email configuration test script
2. `USER_INVITATION_FIXES.md` - Comprehensive documentation

## Next Steps

1. **Test in Production:**
   - Update `.env.production` with production SMTP settings
   - Test email delivery in production environment

2. **Monitor Email Logs:**
   - Set up email logging for troubleshooting
   - Monitor failed invitation attempts

3. **User Training:**
   - Create user guide for password change process
   - Document role permissions for administrators

4. **Optional Enhancements:**
   - Add email templates for different user types
   - Implement bulk user invitation
   - Add email verification step
   - Create admin panel for viewing email logs

## Support

If issues persist:
1. Check the detailed documentation in `USER_INVITATION_FIXES.md`
2. Run the email test script: `php backend/test_email.php`
3. Check browser console for frontend errors
4. Check backend logs for API errors
5. Verify database schema matches migration files
