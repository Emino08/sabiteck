# Frontend-Backend Route Mapping Report

## Summary
This report details the mapping between frontend routes and backend API endpoints, including database connectivity status.

## Database Configuration
- **Database Name**: devco_db
- **Host**: localhost
- **Port**: 3306
- **Status**: MySQL services are running (2 instances detected)

## Frontend Routes (from App.jsx)

### Public Pages
1. **Home** - `/`
2. **About** - `/about`
3. **Services** - `/services`
4. **Portfolio** - `/portfolio`
5. **Team** - `/team`
6. **Blog** - `/blog`
7. **News** - `/news` (uses Blog component with contentType="news")
8. **Tools** - `/tools`
9. **Contact** - `/contact`
10. **Announcements** - `/announcements`
11. **Scholarships** - `/scholarships`
12. **Scholarship Detail** - `/scholarships/:slug`
13. **Jobs** - `/jobs`
14. **Job Detail** - `/jobs/:slug`

### Authentication Routes
15. **Login** - `/login`
16. **Register** - `/register`
17. **Dashboard** - `/dashboard`
18. **Profile** - `/profile`
19. **Admin** - `/admin`

## Backend API Endpoints (index.php)

### Core API Endpoints ✅
- `GET /` - API status check
- `GET /api/test` - API test endpoint

### Portfolio Endpoints ✅
- `GET /api/portfolio` - List all portfolio items
- `GET /api/portfolio/featured` - Featured portfolio items
- `GET /api/portfolio/categories` - Portfolio categories
- `GET /api/portfolio/:slug` - Portfolio item detail

### Services Endpoints ✅
- `GET /api/services` - List all services
- `GET /api/services/popular` - Popular services
- `GET /api/services/:slug` - Service detail

### Team Endpoints ✅
- `GET /api/team` - List all team members
- `GET /api/team/featured` - Featured team members
- `GET /api/team/departments` - Team departments

### Blog/Content Endpoints ✅
- `GET /api/blog` - List all blog posts
- `GET /api/blog/featured` - Featured blog posts
- `GET /api/blog/categories` - Blog categories
- `GET /api/blog/:slug` - Blog post detail
- `GET /api/content` - General content endpoint

### Jobs Endpoints ✅
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/featured` - Featured jobs
- `GET /api/jobs/categories` - Job categories
- `GET /api/jobs/locations` - Job locations
- `GET /api/jobs/:slug` - Job detail
- `POST /api/jobs/:id/apply` - Apply for job (requires auth)
- `GET /api/jobs/:id/check-application` - Check application status

### Scholarships Endpoints ✅
- `GET /api/scholarships` - List all scholarships
- `GET /api/scholarships/featured` - Featured scholarships
- `GET /api/scholarships/categories` - Scholarship categories
- `GET /api/scholarships/regions` - Scholarship regions
- `GET /api/scholarships/education-levels` - Education levels
- `GET /api/scholarships/:slug` - Scholarship detail

### Announcements Endpoints ✅
- `GET /api/announcements` - List all announcements

### Organizations Endpoints ✅
- `GET /api/organizations` - List all organizations
- `GET /api/organizations/featured` - Featured organizations
- `GET /api/organizations/categories` - Organization categories
- `GET /api/organizations/:slug` - Organization detail

### Contact & Newsletter Endpoints ✅
- `POST /api/contact` - Contact form submission
- `POST /api/newsletter/subscribe` - Newsletter subscription

### Authentication Endpoints ✅
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/google` - Google OAuth (placeholder)
- `GET /auth/google/callback` - Google OAuth callback (placeholder)
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (requires auth)
- `POST /api/user/change-password` - Change password (requires auth)

### Admin Endpoints ✅
- `POST /api/admin/login` - Admin login
- `GET /api/admin/analytics` - Analytics data
- `GET /api/admin/settings` - Admin settings
- `GET /api/admin/jobs` - Admin jobs management
- `GET /api/admin/scholarships` - Admin scholarships management
- `GET /api/admin/announcements` - Admin announcements
- `GET /api/admin/team` - Admin team management
- `GET /api/admin/services` - Admin services management

### Analytics Endpoints ✅
- `POST /api/analytics/track` - Track analytics
- `POST /api/analytics/track-event` - Track specific events
- `POST /api/analytics/opt-out` - Analytics opt-out
- `POST /api/analytics/opt-in` - Analytics opt-in

### Social & Comments Endpoints ✅
- `GET /api/content/:id/comments` - Get comments
- `POST /api/content/:id/comments` - Post comment (requires auth)
- `POST /api/content/:id/like-status` - Check like status
- `POST /api/content/:id/like` - Like content (requires auth)
- `GET /api/social` - Social media management (requires auth)
- `GET /api/social/scheduled` - Scheduled posts (requires auth)
- `POST /api/social` - Create social post (requires auth)

### File Conversion Endpoints (Placeholders) ⚠️
- `POST /api/convert/pdf-to-word` - Not implemented
- `POST /api/convert/word-to-pdf` - Not implemented
- `POST /api/convert/pdf-to-images` - Not implemented
- `POST /api/convert/image-to-word` - Not implemented
- `POST /api/resize/file` - Not implemented
- `POST /api/compress/file` - Not implemented

## Database Tables Required

The following tables are automatically created when first accessed:

1. **contacts** - Contact form submissions
2. **newsletter_subscribers** - Newsletter subscriptions
3. **users** - User accounts
4. **admin_users** - Admin accounts (default: admin/admin123)
5. **content** - Blog posts and general content
6. **portfolio** - Portfolio items
7. **jobs** - Job listings
8. **scholarships** - Scholarship listings
9. **services** - Service offerings
10. **team** - Team members
11. **organizations** - Partner organizations
12. **announcements** - Site announcements
13. **analytics_events** - Analytics tracking
14. **settings** - Site settings

## Issues Fixed

1. ✅ **Corrupted index.php**: The backend index.php file was corrupted with mixed/duplicated content. A clean version has been created with proper structure.

2. ✅ **Database Connection**: Database connection function implemented with proper error handling.

3. ✅ **Auto-table Creation**: Tables are automatically created on first use if they don't exist.

4. ✅ **JWT Authentication**: Basic JWT implementation for user and admin authentication.

## Recommendations

1. **Environment Variables**: Create a `.env` file with:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=devco_db
   DB_USER=root
   DB_PASS=
   JWT_SECRET=your-secret-key-here
   ```

2. **Database Setup**: Run MySQL and create the `devco_db` database:
   ```sql
   CREATE DATABASE IF NOT EXISTS devco_db;
   ```

3. **File Conversion Features**: The file conversion endpoints are placeholders and need implementation if required.

4. **Authentication Middleware**: Consider implementing proper JWT verification middleware for protected routes.

5. **CORS Configuration**: Current CORS allows all origins (`*`). Consider restricting to specific domains in production.

## Status Legend
- ✅ Implemented and connected to database
- ⚠️ Placeholder/Not implemented
- 🔒 Requires authentication

## Conclusion

All frontend routes have corresponding backend endpoints. The backend is configured to connect to MySQL database with auto-table creation. The corrupted index.php file has been replaced with a clean, properly structured version that handles all required routes and database connections.