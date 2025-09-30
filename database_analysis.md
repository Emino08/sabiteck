# Database Tables Analysis

## Tables Found in Codebase (Referenced in SQL Queries)

### Core Application Tables (ACTIVE - DO NOT DELETE)
- **users** - User authentication and management
- **admin_users** - Admin panel access
- **roles** - User role management
- **permissions** - Permission system
- **user_roles** - Role assignments

### Content Management Tables (ACTIVE - DO NOT DELETE)
- **content** - Blog posts, articles, news
- **content_categories** - Content categorization
- **content_comments** - Blog/content commenting
- **content_likes** - Like functionality
- **content_types** - Content type definitions

### Business Core Tables (ACTIVE - DO NOT DELETE)
- **jobs** - Job listings
- **job_applications** - Job applications
- **job_categories** - Job categorization
- **scholarships** - Scholarship listings
- **services** - Services offered
- **portfolio** - Portfolio items
- **team** - Team members
- **organizations** - Partner organizations

### Configuration Tables (ACTIVE - DO NOT DELETE)
- **settings** - Application settings
- **contacts** - Contact form submissions

### Analytics Tables (POTENTIALLY UNUSED)
- **analytics_events** - Event tracking
- **analytics_page_views** - Page view tracking
- **analytics_pageviews** - Duplicate page views?
- **analytics_realtime** - Real-time analytics
- **analytics_sessions** - Session tracking
- **analytics_settings** - Analytics configuration
- **analytics_visitors** - Visitor tracking
- **analytics_visits** - Visit tracking

### Newsletter/Marketing Tables (POTENTIALLY UNUSED)
- **newsletter_campaigns** - Email campaigns
- **newsletter_subscribers** - Subscriber list
- **newsletter_subscriptions** - Subscription management
- **newsletter_templates** - Email templates

### Additional Management Tables (POTENTIALLY UNUSED)
- **announcements** - Site announcements
- **announcement_types** - Announcement categorization
- **about_page** - About page content
- **company_content** - Company information
- **company_info** - Company details
- **social_posts** - Social media integration
- **blog_categories** - Blog categorization (duplicate of content_categories?)
- **blog_posts** - Blog posts (duplicate of content?)

### Regional/Categorization Tables (CHECK IF USED)
- **regions** - Geographic regions
- **education_levels** - Education level definitions
- **portfolio_categories** - Portfolio categorization
- **portfolio_projects** - Portfolio projects (duplicate of portfolio?)
- **scholarship_categories** - Scholarship categorization
- **service_categories** - Service categorization
- **organization_categories** - Organization categorization

### System/Config Tables (POTENTIALLY UNUSED)
- **api_configurations** - API settings
- **app_configurations** - App configuration
- **route_settings** - Route configuration
- **static_messages** - Static text messages
- **default_field_values** - Default values
- **setting_value** - Settings values (duplicate?)

### Job Related Additional Tables (CHECK IF USED)
- **job_application_history** - Application history tracking
- **team_members** - Team member details (duplicate of team?)

## Recommendations

### Tables Safe to Remove (High Confidence)
1. **analytics_pageviews** (if analytics_page_views exists)
2. **blog_posts** (if content table handles blog posts)
3. **blog_categories** (if content_categories handles blog categories)
4. **portfolio_projects** (if portfolio table handles projects)
5. **setting_value** (if settings table handles values)
6. **team_members** (if team table handles members)

### Tables to Investigate Further
1. All **analytics_*** tables - check if analytics is actually being used
2. All **newsletter_*** tables - check if newsletter functionality is active
3. **announcements** related tables - check if announcements are used
4. **social_posts** - check if social media integration is active
5. **company_content** vs **company_info** - likely duplicates
6. Various **_categories** tables - may be unused if categories are handled differently

### Tables to Keep (Critical)
- users, admin_users, roles, permissions, user_roles
- content, content_comments, content_likes
- jobs, job_applications
- scholarships, services, portfolio, team
- organizations, settings, contacts