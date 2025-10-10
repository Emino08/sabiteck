# 🚀 Quick Start Guide - RBAC System

## ✅ Implementation Complete - Ready to Use!

---

## Test the System (5 minutes)

### 1. Test Login

Open the test page:
```bash
start test-login-complete.html
```

Try these accounts:
- **admin** / your-password (sees all 16 routes)
- **test_editor** / password (sees 8 routes)
- **test_blogger** / password (sees 5 routes)

### 2. Verify Backend

```bash
cd backend
php test_complete_rbac_system.php
```

Expected output: ✅ All tests passing

---

## Login & See Filtered Navigation

1. Go to `http://localhost:5173/admin`
2. Login with any test account
3. Notice: You only see authorized navigation items!

**Example: Login as `test_editor`**
- ✅ Can see: Dashboard, Content, Services, Portfolio, About, Team, Announcements, Tools
- ❌ Cannot see: Jobs, Scholarships, Organizations, Analytics, Newsletter, User Roles, Settings

---

## Create New User (Email Notification)

1. Login as admin
2. Go to "User Roles" tab
3. Click "Invite User"
4. Fill in details, select role
5. User receives email with:
   - Login credentials
   - Role information
   - Full list of permissions
   - Login link

---

## How Permissions Work

### Each Role Has Specific Access:

**Administrator (admin)**
- **Routes:** ALL (16/16)
- **Permissions:** 61 total
- **Access:** Everything

**Content Editor (content_editor)**
- **Routes:** 8/16
- **Permissions:** 32
- **Access:** Dashboard, Content Management (all), Tools & Curriculum

**Program Manager (program_manager)**
- **Routes:** 5/16
- **Permissions:** 23
- **Access:** Dashboard, Program Management (all), Tools & Curriculum

**Marketing Officer (marketing_officer)**
- **Routes:** 3/16
- **Permissions:** 6
- **Access:** Dashboard, Analytics, Newsletter

**Analyst (analyst)**
- **Routes:** 2/16
- **Permissions:** 3
- **Access:** Dashboard, Analytics only

**Blogger (blogger)**
- **Routes:** 5/16
- **Permissions:** 19
- **Access:** Dashboard, Content, Jobs, Scholarships, Newsletter

---

## Manage User Roles

### Assign Role to User

```sql
DELETE FROM user_roles WHERE user_id = {userId};

INSERT INTO user_roles (user_id, role_id, created_at)
SELECT {userId}, id, NOW() FROM roles
WHERE name = 'content_editor';
```

### View User Permissions

```bash
cd backend
php -r "
require 'vendor/autoload.php';
\$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
\$dotenv->load();
\$pdo = new PDO('mysql:host='.\$_ENV['DB_HOST'].';port='.(\$_ENV['DB_PORT']??3306).';dbname='.\$_ENV['DB_NAME'], \$_ENV['DB_USER'], \$_ENV['DB_PASS']);
\$service = new App\Services\PermissionService(\$pdo);
\$role = \$service->getUserRole(1);
\$perms = \$service->getUserPermissionNames(1);
echo 'Role: ' . \$role['display_name'] . '\n';
echo 'Permissions: ' . count(\$perms) . '\n';
echo implode(', ', \$perms);
"
```

---

## File Locations

### Key Backend Files
- `backend/src/Services/PermissionService.php` - Permission management
- `backend/src/Controllers/AuthController.php` - Login & user creation
- `backend/src/Config/RoutePermissions.php` - Route mapping
- `backend/src/Services/AuditLogService.php` - Audit logging
- `backend/src/Services/EmailService.php` - Email notifications

### Key Frontend Files
- `frontend/src/contexts/AuthContext.jsx` - Auth & permissions
- `frontend/src/components/pages/Admin.jsx` - Admin panel with filtered tabs
- `frontend/src/utils/routePermissions.js` - Route utilities

### Documentation
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete summary
- `RBAC_COMPLETE_IMPLEMENTATION.md` - Detailed docs
- `RBAC_QUICK_REFERENCE.md` - Quick reference
- `QUICK_START_GUIDE.md` - This file

---

## Common Tasks

### Check Current Permissions
```sql
SELECT r.display_name as role, COUNT(p.id) as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id;
```

### View All Users & Roles
```sql
SELECT u.username, u.email, r.name as role, r.display_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.created_at DESC;
```

### View Audit Logs
```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Login error "Column not found"
**Solution:** Already fixed! All queries updated to use `user_roles` table.

### Issue: Navigation not filtering
**Solution:**
1. Check browser console for `user.permissions` array
2. Clear localStorage and login again
3. Verify permissions exist in database

### Issue: Email not sending
**Solution:**
1. Check `.env` has `AUTH_SMTP_*` credentials
2. Test email configuration in admin panel
3. Check error logs

---

## Production Deployment

1. ✅ Backup database
2. ✅ Run migrations (already done)
3. ✅ Test with all roles
4. ✅ Configure SMTP for production
5. ✅ Set up audit log rotation
6. ✅ Deploy!

---

## Need Help?

- **Full Documentation:** See `RBAC_COMPLETE_IMPLEMENTATION.md`
- **Quick Reference:** See `RBAC_QUICK_REFERENCE.md`
- **Implementation Summary:** See `FINAL_IMPLEMENTATION_SUMMARY.md`

---

**Status:** ✅ Production Ready
**Tests:** ✅ All Passing
**Documentation:** ✅ Complete

**You're all set! The app is running smoothly with full RBAC support.**
