# RBAC Complete Fix - Implementation Plan

## Issues Identified

1. **SQL Error**: Column 'up.permission' not found in user_permissions table
2. **Navigation Visibility**: Bloggers seeing admin routes (User Roles, etc.)
3. **Password Change Route**: Route exists but may need verification
4. **Forgot Password**: Not routed for admin login
5. **Password Visibility**: Toggle missing in admin login form

## Fix Implementation

### 1. Database Schema Verification
- Verify user_permissions table has correct columns
- Ensure role_permissions mappings are correct
- Sync blogger user permissions

### 2. Navigation Filtering
- Update Admin.jsx to properly filter tabs based on exact permissions
- Ensure blogger role only sees: Content, Jobs, Scholarships, Newsletter
- Hide: User Roles, Organizations, Announcements, Settings, Routes

### 3. Password Management
- Add forgot password link to admin login
- Ensure password visibility toggle on all password fields
- Force password change on first login for invited users

### 4. Email Integration
- Send credentials email when admin creates user
- Include temporary password and change password instructions

## Role Permissions Matrix

### Admin
- Full access to all modules

### Content Editor
- Dashboard, Content, Team, About, Services, Portfolio, Announcements

### Program Manager
- Dashboard, Jobs, Scholarships, Organizations

### Marketing Officer
- Dashboard, Newsletter, Analytics, Announcements

### Analyst
- Dashboard (view only), Analytics

### Blogger
- Dashboard, Content, Jobs, Scholarships, Newsletter
- NO ACCESS TO: User Roles, Organizations, Announcements, Settings, Routes, Tools
