# Complete RBAC and Security Fix Plan

## Issues to Fix:

### 1. Database Query Error
- **Error**: `Column not found: 1054 Unknown column 'up.permission' in 'where clause'`
- **Root Cause**: Old test/debug files using wrong column name
- **Fix**: These are in test files, not production code. The actual PermissionService is correct.

### 2. Role-Based Navigation
- **Issue**: Blogger sees admin routes (Users, Organizations, etc.)
- **Fix**: Implement proper permission checking in navigation

### 3. Force Password Change
- **Issue**: Users with must_change_password=1 should be forced to change password
- **Fix**: Implement password change flow before dashboard access

### 4. Change Password Route
- **Error**: Route not found for `/api/auth/change-password`
- **Fix**: Route exists, needs debugging

### 5. Password Visibility Toggle
- **Issue**: Login form missing password toggle
- **Fix**: Add eye icon to toggle password visibility

### 6. Forgot Password
- **Issue**: No forgot password functionality
- **Fix**: Implement email-based password reset

### 7. React Error (Lock component)
- **Error**: `Illegal constructor` in Lock component
- **Fix**: Lock component is being used incorrectly

## Role Definitions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules |
| **Content Editor** | content.view, content.edit, content.publish, blogs.view, blogs.edit, blogs.publish, news.view, news.edit, news.publish |
| **Program Manager** | jobs.*, scholarships.*, organizations.* |
| **Marketing Officer** | newsletter.*, analytics.view, marketing.* |
| **Analyst** | analytics.view (read-only) |
| **Blogger** | content.view, content.edit, content.publish, blogs.*, news.*, jobs.*, scholarships.*, newsletter.* |

## Implementation Order:

1. ✅ Verify PermissionService is correct (already done)
2. Fix navigation permissions
3. Implement force password change
4. Fix password change route
5. Add password toggle
6. Implement forgot password
7. Fix Lock component error
8. Test everything
