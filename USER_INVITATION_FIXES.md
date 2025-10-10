# User Invitation and Permission System Fixes

## Issues Fixed

### 1. ✅ User Login with Invitation Credentials

**Problem:** Users created via invitation could not log in with their username and password.

**Root Cause:** Invited users were created with status 'pending', but the login system only allowed users with 'active' status.

**Solution:**
- Changed the `inviteUser()` method in `AdminController.php` to create users with status 'active' instead of 'pending'
- This allows users to log in immediately with their invitation credentials
- The `must_change_password` flag is still set to 1, prompting users to change their password on first login

**Files Modified:**
- `backend/src/Controllers/AdminController.php` (Line 4744-4748)

---

### 2. ✅ Email Notification for User Invitations

**Problem:** Email notifications needed to be tested and verified for localhost environment.

**Solution:**
- Enhanced the `createUser()` method to automatically send invitation emails when passwords are auto-generated
- Created `sendInvitationEmail()` method that uses the AUTH_SMTP configuration from .env
- Email includes:
  - Username
  - Temporary password
  - Direct login link
  - Account type (Admin/User) based on role
  - Security notice to change password on first login

**Email Configuration (Already Set in .env):**
```env
AUTH_SMTP_HOST=smtp.titan.email
AUTH_SMTP_PORT=465
AUTH_SMTP_USER=auth@sabiteck.com
AUTH_SMTP_PASS=32770&Emo
AUTH_SMTP_ENCRYPTION=ssl
AUTH_FROM_EMAIL=auth@sabiteck.com
AUTH_FROM_NAME='Sabiteck Authentication'
```

**Test Script Created:**
- `backend/test_email.php` - Run this to test email configuration

**Usage:**
```bash
cd backend
php test_email.php
```

**Files Modified:**
- `backend/src/Controllers/AdminController.php` (Lines 4518-4575)
- Created: `backend/test_email.php`

---

### 3. ✅ Permission-Based Access Control

**Problem:** Users needed to see only tabs/sections based on their assigned permissions and roles.

**Solution:**

#### Backend Enhancement:
- The `AuthController::login()` method already returns user permissions and modules in the JWT token payload
- Permissions are fetched from the database via `PermissionService::getUserPermissions()`
- Modules are calculated based on permission categories

#### Frontend Enhancement:
- Updated `AuthContext.jsx` to accept and store permissions and modules during login
- Modified `Login.jsx` to pass permissions and modules from the API response to the login function
- Modified `Admin.jsx` to use permissions and modules for admin dashboard access

**Permission Check Functions (Already Implemented):**
- `hasPermission(user, permission)` - Check if user has a specific permission
- `hasAnyPermission(user, permissions)` - Check if user has any of the given permissions
- `hasAllPermissions(user, permissions)` - Check if user has all given permissions
- `hasModuleAccess(user, module)` - Check if user can access a module
- `getAccessibleTabs(user)` - Get filtered tabs based on user permissions

**How It Works:**

1. **User Login:**
   - User logs in with username/password
   - Backend validates credentials
   - Backend fetches user's role-based permissions from database
   - Backend returns permissions array and modules array in login response

2. **Permission Storage:**
   - Frontend stores user data with permissions and modules in localStorage
   - AuthContext makes this available throughout the app

3. **UI Filtering:**
   - Admin dashboard filters tabs based on user permissions
   - Only shows tabs where user has required permissions
   - If user has no permissions for a tab, it's hidden from view

**Example Permission Checks:**
```javascript
// In Admin.jsx - tab filtering
const accessibleTabs = useMemo(() => {
  return tabs.filter(tab => {
    if (tab.permissions) {
      return tab.permissions.some(permission =>
        hasPermission(user, permission)
      );
    }
    return true;
  });
}, [user, tabs]);
```

**Files Modified:**
- `frontend/src/contexts/AuthContext.jsx` (Lines 50-62)
- `frontend/src/components/pages/Login.jsx` (Lines 65-93)
- `frontend/src/components/pages/Admin.jsx` (Lines 244-251)

---

## Permission System Architecture

### Database Tables

1. **permissions** - Stores all available permissions
2. **roles** - Stores user roles (super-admin, admin, content-manager, etc.)
3. **role_permissions** - Junction table linking roles to permissions
4. **user_permissions** - Individual user permissions (overrides)
5. **users** - User table with role_id foreign key

### Default Roles and Permissions

| Role | Permissions |
|------|------------|
| Super Admin | All permissions (*) |
| Admin | All except system management |
| Content Manager | Content, Jobs, Scholarships, Announcements |
| HR Manager | Users, Jobs, Team Management |
| Editor | Content (create/edit only), Portfolio |
| User | Dashboard view only |
| Viewer | Read-only access to most areas |

### Permission Categories

- **dashboard** - Dashboard and analytics access
- **users** - User management
- **content** - Blog, articles, pages
- **jobs** - Job listings and applications
- **scholarships** - Scholarship management
- **services** - Service offerings
- **portfolio** - Portfolio projects
- **team** - Team member management
- **announcements** - Announcements
- **newsletter** - Newsletter campaigns
- **settings** - Application settings
- **system** - System administration

---

## Testing the Fixes

### 1. Test User Invitation and Login

1. **Create a User via Invitation:**
   ```
   - Go to Admin Dashboard → User Roles tab
   - Click "Invite User"
   - Enter email address
   - Select role
   - Click "Send Invitation"
   ```

2. **Check Email:**
   - User should receive an email with:
     - Username
     - Temporary password
     - Login link

3. **Test Login:**
   - Use the credentials from the email
   - Login should succeed
   - User should be prompted to change password

### 2. Test Email Configuration

Run the email test script:
```bash
cd backend
php test_email.php
```

This will:
- Test SMTP connection
- Optionally send a test email
- Display any configuration errors

### 3. Test Permission-Based Access

1. **Create Users with Different Roles:**
   - Create a user with "Viewer" role
   - Create a user with "Content Manager" role
   - Create a user with "Admin" role

2. **Login as Each User:**
   - Viewer should only see: Dashboard, read-only content tabs
   - Content Manager should see: Dashboard, Content, Jobs, Scholarships, Announcements
   - Admin should see: All tabs except system logs

3. **Verify Tab Visibility:**
   - Each user should only see tabs they have permissions for
   - Tabs without required permissions should be hidden

---

## User Workflow

### For Invited Users:

1. **Receive Invitation Email:**
   - Email contains username and temporary password
   - Click login link in email

2. **First Login:**
   - Enter username and temporary password
   - System detects `must_change_password` flag
   - User is redirected to change password page

3. **Change Password:**
   - Enter current (temporary) password
   - Enter new password
   - Confirm new password
   - Submit

4. **Access Dashboard:**
   - User can now access permitted sections
   - Only sees tabs/features based on assigned role and permissions

---

## API Endpoints

### User Management

- `POST /api/admin/users/invite` - Invite new user
- `POST /api/admin/users` - Create user directly
- `GET /api/admin/users-with-roles` - Get users with their roles
- `PUT /api/admin/users/{id}` - Update user
- `PUT /api/admin/users/{id}/role` - Update user role
- `PUT /api/admin/users/{id}/permissions` - Update user permissions

### Authentication

- `POST /api/auth/login` - User login (returns permissions and modules)
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

---

## Environment Variables

Required for email functionality:

```env
# Authentication Email Configuration
AUTH_SMTP_HOST=smtp.titan.email
AUTH_SMTP_PORT=465
AUTH_SMTP_USER=auth@sabiteck.com
AUTH_SMTP_PASS=your_password_here
AUTH_SMTP_ENCRYPTION=ssl
AUTH_FROM_EMAIL=auth@sabiteck.com
AUTH_FROM_NAME='Sabiteck Authentication'

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

---

## Security Features

1. **Password Hashing:** All passwords are hashed using PHP's `password_hash()` with bcrypt
2. **Must Change Password:** Invited users must change their temporary password on first login
3. **Failed Login Protection:** Account locks after 5 failed login attempts for 30 minutes
4. **JWT Tokens:** Authentication uses JWT tokens with 24-hour expiration
5. **Permission Validation:** Both frontend and backend validate user permissions
6. **Role-Based Access:** Users can only access features permitted by their role

---

## Troubleshooting

### Users Cannot Login After Invitation

**Check:**
1. User status is 'active' in database: `SELECT status FROM users WHERE email = 'user@example.com'`
2. Password was hashed correctly: Check password_hash field is not empty
3. Email configuration is correct: Run `php backend/test_email.php`

### Emails Not Sending

**Check:**
1. SMTP credentials in .env file
2. Run test script: `php backend/test_email.php`
3. Check PHP error logs for email errors
4. Verify SMTP server allows connections from your IP

### Users See Wrong Tabs

**Check:**
1. User's role_id is correctly set
2. Role has correct permissions in role_permissions table
3. Frontend receives permissions array in login response
4. Check browser console for permission data

---

## Database Queries for Verification

```sql
-- Check user's role and permissions
SELECT u.id, u.username, u.email, r.name as role, 
       GROUP_CONCAT(p.name) as permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@example.com'
GROUP BY u.id;

-- Check all users with their status
SELECT id, username, email, status, must_change_password, created_at
FROM users
ORDER BY created_at DESC;

-- Check available roles
SELECT * FROM roles WHERE is_active = 1;

-- Check available permissions
SELECT * FROM permissions ORDER BY module, name;
```

---

## Summary

All three issues have been successfully resolved:

1. ✅ **Login Issue:** Users created via invitation can now log in immediately with their credentials
2. ✅ **Email Functionality:** Invitation emails are sent automatically with proper configuration for localhost
3. ✅ **Permission-Based Access:** Users only see tabs and features based on their assigned permissions and roles

The system now provides a complete user management workflow with proper security, email notifications, and granular permission control.
