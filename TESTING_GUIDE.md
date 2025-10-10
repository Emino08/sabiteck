# 🧪 RBAC Testing Guide - What You Need to Test

## ✅ What's Already Done (Verified)

- ✅ **Database Migration**: Successfully created 6 roles, 53 permissions
- ✅ **Blogger Role**: Verified 19 correct permissions, no admin access
- ✅ **Backend Routes**: All password management endpoints confirmed
- ✅ **Frontend Components**: Navigation filtering, password management ready
- ✅ **Email Service**: SMTP configured for notifications

---

## 🔄 What You Need to Test Now

### Test 1: Create Blogger User & Email Notification
**Steps:**
1. Go to http://localhost:5174/admin
2. Login as admin (use your existing admin credentials)
3. Click "User Roles" tab
4. Click "Invite User" button
5. Fill in:
   - Email: testblogger@test.com (use real email for testing)
   - First Name: Test
   - Last Name: Blogger
   - Username: testblogger
   - Role: Select "Blogger" from dropdown
6. Click "Send Invitation"

**Expected Results:**
- ✅ User created successfully message
- ✅ Email sent to testblogger@test.com with:
  - Temporary password
  - Role assigned (Blogger)
  - Permissions list
  - Instructions to change password on first login

**If It Fails:**
- Check SMTP configuration in backend/.env
- Verify EmailService.php has correct settings
- Check backend error logs

---

### Test 2: Login as Blogger & Navigation Filtering
**Steps:**
1. Logout from admin account
2. Go to http://localhost:5174/admin
3. Login with:
   - Username: testblogger
   - Password: (from email received in Test 1)

**Expected Results on First Login:**
- ✅ Shows "Force Password Change" screen
- ✅ Prompts to enter:
  - Current password (from email)
  - New password
  - Confirm new password
- ✅ After changing password, redirected to dashboard

**Expected Navigation Tabs (SHOULD SEE):**
- ✅ Dashboard (Overview)
- ✅ Content (Blog/News)
- ✅ Jobs
- ✅ Scholarships
- ✅ Newsletter

**Should NOT See These Tabs:**
- ❌ Services
- ❌ Portfolio
- ❌ About
- ❌ Team
- ❌ Announcements
- ❌ Organizations
- ❌ Analytics
- ❌ User Roles
- ❌ Navigation (Routes)
- ❌ Settings
- ❌ Tools & Curriculum

**If Navigation is Wrong:**
- Check user's role_id in database matches blogger role
- Inspect JWT token in browser DevTools → Application → Local Storage
- Verify permissions array in token
- Clear browser cache and re-login

---

### Test 3: API Route Security
**Steps:**
1. While logged in as blogger, open browser DevTools (F12)
2. Go to Network tab
3. Try to access different admin features in the UI
4. Look for API calls and their responses

**Test Authorized Access (SHOULD WORK):**
```javascript
// These should return 200 OK
- GET /api/admin/content
- POST /api/admin/content (create blog post)
- GET /api/admin/jobs
- POST /api/admin/jobs (create job)
- GET /api/admin/scholarships
- POST /api/admin/scholarships (create scholarship)
- GET /api/admin/newsletter
```

**Test Unauthorized Access (SHOULD FAIL with 403):**
```javascript
// These should return 403 Forbidden
- GET /api/admin/users
- POST /api/admin/users
- GET /api/admin/settings
- PUT /api/admin/settings
- GET /api/admin/services
- POST /api/admin/services
```

**How to Test:**
1. Open browser console
2. Run these commands:

```javascript
// Get your token
const token = localStorage.getItem('token');

// Test authorized (should work)
fetch('http://localhost:8002/api/admin/content', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => console.log('Content:', r.status));

// Test unauthorized (should fail)
fetch('http://localhost:8002/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => console.log('Users:', r.status));
```

**Expected:**
- Content: 200
- Users: 403

---

### Test 4: Forgot Password (Admin)
**Steps:**
1. Logout from admin
2. Go to http://localhost:5174/admin
3. Click "Forgot Password?" link
4. Enter admin email
5. Click "Send Reset Instructions"

**Expected Results:**
- ✅ Success message shown
- ✅ Email received with:
  - Reset link: http://localhost:5174/admin/reset-password?token=...
  - 6-digit passcode
  - Expiry notice (1 hour)

**Test Both Reset Methods:**

**Method 1: Reset Link**
1. Click link in email
2. Should open reset password page
3. Enter new password
4. Click "Reset Password"
5. Should redirect to login
6. Login with new password

**Method 2: Passcode**
1. Go to reset password page manually
2. Enter email
3. Enter 6-digit passcode from email
4. Enter new password
5. Click "Reset Password"
6. Should redirect to login
7. Login with new password

---

### Test 5: Forgot Password (Regular User)
**Steps:**
1. Logout
2. Go to http://localhost:5174/login (regular user login, not admin)
3. Click "Forgot Password?" link
4. Enter user email
5. Follow same process as Test 4

**Expected:**
- Same email functionality
- Reset link goes to: http://localhost:5174/reset-password?token=...
- Passcode works the same way

---

### Test 6: Create Users for All Roles
**Create one user for each role and verify:**

**Content Editor:**
- Should see: Dashboard, Content, Services, Portfolio, About, Team, Announcements
- Should NOT see: Jobs, Scholarships, Organizations, Analytics, User Roles, Routes, Settings

**Program Manager:**
- Should see: Dashboard, Jobs, Scholarships, Organizations
- Should NOT see: Content, Services, Portfolio, Analytics, User Roles, Routes, Settings

**Marketing Officer:**
- Should see: Dashboard, Analytics, Newsletter
- Should NOT see: Content, Jobs, Scholarships, Services, User Roles, Routes, Settings

**Analyst:**
- Should see: Dashboard, Analytics
- Should NOT see: Everything else

---

## 📋 Testing Checklist

### Database & Backend
- [x] Migration completed successfully
- [x] Blogger permissions verified (19, no admin)
- [x] Routes exist for password management
- [x] Email service configured

### User Creation & Email
- [ ] Create blogger user → Email sent
- [ ] Email contains password and role
- [ ] Email has login instructions

### Authentication & Password
- [ ] First login → Force password change
- [ ] Password change successful
- [ ] must_change_password flag cleared
- [ ] Admin forgot password → Email sent
- [ ] Reset link works
- [ ] Passcode works
- [ ] User forgot password → Email sent

### Navigation Filtering
- [ ] Blogger sees correct tabs only
- [ ] Content Editor sees correct tabs
- [ ] Program Manager sees correct tabs
- [ ] Marketing Officer sees correct tabs
- [ ] Analyst sees correct tabs

### API Security
- [ ] Blogger blocked from /api/admin/users (403)
- [ ] Blogger can access /api/admin/content (200)
- [ ] Other roles properly restricted

---

## 🐛 If Something Doesn't Work

### Navigation tabs are wrong
1. Check database: `SELECT role_id FROM users WHERE username = 'testblogger'`
2. Check it matches: `SELECT id FROM roles WHERE name = 'blogger'`
3. Clear browser cache and local storage
4. Re-login and check JWT token in DevTools

### Email not sending
1. Check backend/.env for SMTP settings
2. Test SMTP connection: `telnet smtp.gmail.com 587`
3. Check backend error logs
4. Verify email service initialized with config

### Force password change not showing
1. Check database: `SELECT must_change_password FROM users WHERE username = 'testblogger'`
2. Should be 1 for new users
3. Check login response includes `action_required: 'change_password'`
4. Verify ForcePasswordChange component renders

### API returns 403 when it shouldn't
1. Check JWT token contains permissions array
2. Verify permission name matches backend check
3. Check user's role_id has the permission in role_permissions table
4. Test permission SQL query directly

---

## 📞 Support Queries

### Check User Permissions:
```sql
SELECT 
  u.username,
  r.display_name as role,
  GROUP_CONCAT(p.name) as permissions
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username = 'testblogger'
GROUP BY u.id;
```

### Verify Email was Sent:
```sql
-- Check password_resets table
SELECT * FROM password_resets 
WHERE email = 'testblogger@test.com'
ORDER BY created_at DESC
LIMIT 1;
```

### Check Must Change Password:
```sql
SELECT 
  username,
  email,
  must_change_password,
  last_password_change
FROM users 
WHERE username = 'testblogger';
```

---

## ✅ All Tests Pass Criteria

When all tests pass, you should have:
- ✅ Email notifications working for user creation
- ✅ Email notifications working for password reset
- ✅ Navigation filtered correctly for all roles
- ✅ API security blocking unauthorized access
- ✅ Force password change on first login
- ✅ Forgot password flow working (link + passcode)
- ✅ All 6 roles functioning as designed

**Then the system is ready for production! 🎉**

---

**Testing Priority:**
1. Test 2 (Navigation) - Most critical for user experience
2. Test 1 (Email) - Required for user management
3. Test 3 (API Security) - Critical for security
4. Test 4 & 5 (Forgot Password) - Important for user support
5. Test 6 (All Roles) - Comprehensive validation

Start with Test 1 and work through in order. Good luck! 🚀
