# Sabiteck Analytics System Documentation

A complete self-hosted website analytics solution built with PHP Slim 4, providing comprehensive visitor tracking, real-time analytics, and detailed reporting capabilities.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [API Endpoints](#api-endpoints)
6. [JavaScript Tracking](#javascript-tracking)
7. [Admin Dashboard](#admin-dashboard)
8. [Privacy & GDPR](#privacy--gdpr)
9. [Troubleshooting](#troubleshooting)
10. [Development](#development)

## Features

### Core Analytics
- **Visitor Tracking**: Unique visitors, returning visitors, session management
- **Page Views**: Real-time page view tracking with time-on-page metrics
- **User Journey**: Track complete user paths through your website
- **Bounce Rate**: Calculate and monitor visitor engagement
- **Session Duration**: Track how long users stay on your site

### Advanced Tracking
- **Geographic Data**: Country, region, and city-level visitor tracking
- **Device Detection**: Desktop, mobile, tablet detection with OS and browser info
- **Referrer Analysis**: Track traffic sources (search engines, social media, direct)
- **Event Tracking**: Custom events (downloads, clicks, form submissions)
- **UTM Campaign Tracking**: Full UTM parameter support

### Real-time Analytics
- **Live Visitor Tracking**: See active users on your site right now
- **Real-time Page Views**: Monitor which pages are being viewed live
- **Geographic Heat Map**: Real-time visitor locations
- **Device Breakdown**: Live device type distribution

### Reporting & Export
- **Dashboard**: Beautiful admin dashboard with charts and graphs
- **CSV Export**: Export analytics data to CSV format
- **PDF Reports**: Generate professional PDF reports
- **Email Reports**: Automated weekly/monthly summary emails
- **Custom Date Ranges**: Flexible reporting periods

### Privacy & Compliance
- **GDPR Compliant**: Built-in GDPR compliance features
- **IP Anonymization**: Automatic IP address anonymization
- **Opt-out Support**: Visitors can opt-out of tracking
- **Cookie Consent**: Integration with cookie consent systems
- **Data Retention**: Configurable data retention policies

## Installation

### Prerequisites

- PHP 8.1+
- MySQL 5.7+ or MySQL 8.0+
- Composer
- Web server (Apache/Nginx)

### Step 1: Install Dependencies

```bash
cd backend
composer install
```

### Step 2: Environment Configuration

Copy the environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret_key
```

### Step 3: Database Setup

Run the analytics setup script:

```bash
php setup_analytics.php
```

This will:
- Create all necessary database tables
- Set up default analytics settings
- Generate a unique tracking code
- Create required directories

### Step 4: GeoIP Database (Optional)

Download the GeoLite2-City database for geographic tracking:

1. Visit: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
2. Download `GeoLite2-City.mmdb`
3. Place it in `backend/data/GeoLite2-City.mmdb`

### Step 5: Web Server Configuration

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

#### Nginx
```nginx
try_files $uri $uri/ /index.php?$query_string;
```

## Configuration

### Analytics Settings

Configure analytics through the admin dashboard or directly in the database:

```sql
-- Enable/disable features
UPDATE analytics_settings SET setting_value = 'true' WHERE setting_key = 'gdpr_enabled';
UPDATE analytics_settings SET setting_value = 'true' WHERE setting_key = 'anonymize_ip';
UPDATE analytics_settings SET setting_value = '30' WHERE setting_key = 'session_timeout';

-- Email reports
UPDATE analytics_settings SET setting_value = '["admin@example.com"]' WHERE setting_key = 'email_report_recipients';
```

### Middleware Configuration

The analytics middleware is automatically added to track all page visits. To exclude specific paths:

```php
// In AnalyticsMiddleware.php
private $excludedPaths = [
    '/api/',
    '/admin/',
    '/health',
    // Add your paths here
];
```

## Usage

### Basic Implementation

1. **Include the tracking script** in your website's `<head>` section:

```html
<script src="/frontend/analytics.js"></script>
```

2. **Automatic tracking** starts immediately for:
   - Page views
   - Session tracking
   - Basic user interactions

3. **Access the dashboard** at `/frontend/analytics-dashboard.html`

### Advanced Implementation

#### Custom Event Tracking

Track specific user interactions:

```javascript
// Track downloads
SabiteckAnalytics.track('download', 'click', 'whitepaper.pdf');

// Track form submissions
SabiteckAnalytics.track('form', 'submit', 'contact-form');

// Track video interactions
SabiteckAnalytics.track('video', 'play', 'intro-video', 30); // 30 seconds
```

#### Custom Configuration

```javascript
SabiteckAnalytics.init({
    apiUrl: 'https://your-api-url.com/api',
    trackPageViews: true,
    trackEvents: true,
    trackOutboundLinks: true,
    trackDownloads: true,
    trackScrollDepth: true,
    gdprCompliant: true,
    sessionTimeout: 30, // minutes
    debug: false
});
```

## API Endpoints

### Public Endpoints

#### Track Page View
```http
POST /api/analytics/track
Content-Type: application/json

{
    "visitor_id": "abc123...",
    "session_id": "def456...",
    "page_url": "https://example.com/page",
    "page_title": "Page Title",
    "page_path": "/page",
    "referrer": "https://google.com",
    "time_on_page": 45
}
```

#### Track Event
```http
POST /api/analytics/track-event
Content-Type: application/json

{
    "visitor_id": "abc123...",
    "session_id": "def456...",
    "event_category": "download",
    "event_action": "click",
    "event_label": "document.pdf",
    "page_url": "https://example.com/downloads"
}
```

#### Privacy Controls
```http
POST /api/analytics/opt-out
POST /api/analytics/opt-in
Content-Type: application/json

{
    "visitor_id": "abc123..."
}
```

### Admin Endpoints

All admin endpoints require authentication with JWT token.

#### Dashboard Statistics
```http
GET /api/admin/analytics/dashboard?period=30d
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Popular Pages
```http
GET /api/admin/analytics/pages?period=30d&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Traffic Sources
```http
GET /api/admin/analytics/referrers?period=30d&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Geographic Data
```http
GET /api/admin/analytics/geography?period=30d&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Device Statistics
```http
GET /api/admin/analytics/devices?period=30d
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Real-time Data
```http
GET /api/admin/analytics/realtime
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Export Reports
```http
GET /api/admin/analytics/export?format=csv&period=30d&type=overview
GET /api/admin/analytics/export?format=pdf&period=30d&type=pages
Authorization: Bearer YOUR_JWT_TOKEN
```

## JavaScript Tracking

### Automatic Tracking

The JavaScript tracker automatically captures:

- **Page views** when pages load
- **Session data** including duration and page count
- **Device information** (type, OS, browser)
- **Geographic data** (via IP address)
- **Referrer information** (where visitors came from)
- **UTM parameters** (campaign tracking)

### Manual Event Tracking

```javascript
// Basic event tracking
SabiteckAnalytics.track('category', 'action', 'label', value);

// Examples
SabiteckAnalytics.track('video', 'play', 'homepage-intro');
SabiteckAnalytics.track('download', 'click', 'price-list.pdf');
SabiteckAnalytics.track('form', 'submit', 'newsletter-signup');
SabiteckAnalytics.track('engagement', 'scroll', '75-percent', 75);
```

### Privacy Controls

```javascript
// Opt out of tracking
SabiteckAnalytics.optOut();

// Opt back in
SabiteckAnalytics.optIn();

// Check if user has opted out
if (SabiteckAnalytics.hasOptedOut()) {
    // Show privacy notice
}
```

### Custom Configuration

```javascript
// Initialize with custom settings
SabiteckAnalytics.init({
    apiUrl: 'https://analytics.yoursite.com/api',
    trackPageViews: true,
    trackEvents: true,
    trackOutboundLinks: true,
    trackDownloads: true,
    trackScrollDepth: true,
    gdprCompliant: true,
    cookieDomain: '.yoursite.com',
    sessionTimeout: 30,
    heartbeatInterval: 15,
    debug: process.env.NODE_ENV === 'development'
});
```

## Admin Dashboard

### Accessing the Dashboard

1. Open `frontend/analytics-dashboard.html` in your browser
2. Login with your admin credentials
3. View real-time and historical analytics data

### Dashboard Features

#### Overview Section
- **Key Metrics**: Visitors, sessions, page views, bounce rate
- **Time Series Charts**: Daily visitor trends
- **Device Breakdown**: Pie chart of device types
- **Top Pages**: Most visited pages table
- **Traffic Sources**: Referrer breakdown

#### Real-time Section
- **Active Users**: Current visitors on your site
- **Live Pages**: Pages currently being viewed
- **Geographic Distribution**: Where active users are located

#### Detailed Reports
- **Pages Report**: Detailed page performance metrics
- **Traffic Sources**: Complete referrer analysis
- **Geographic Report**: Country/city visitor breakdown
- **Device Report**: Detailed device and browser stats

### Export Features

Generate reports in multiple formats:

```javascript
// Export CSV
exportReport('csv');

// Export PDF
exportReport('pdf');

// Custom exports via API
fetch('/api/admin/analytics/export?format=xlsx&period=90d&type=geography')
```

## Privacy & GDPR

### GDPR Compliance Features

1. **IP Anonymization**: Automatic IP address masking
2. **Consent Management**: Integration with cookie consent systems
3. **Opt-out Mechanism**: Easy visitor opt-out process
4. **Data Retention**: Configurable data retention periods
5. **Data Portability**: Export user data in standard formats

### Implementation

#### Cookie Consent Integration

```javascript
// Wait for consent before tracking
document.addEventListener('cookieConsentGiven', function() {
    SabiteckAnalytics.optIn();
});

document.addEventListener('cookieConsentRevoked', function() {
    SabiteckAnalytics.optOut();
});
```

#### Privacy Policy Integration

```html
<!-- Opt-out link for privacy policy -->
<a href="#" onclick="SabiteckAnalytics.optOut(); return false;">
    Opt out of analytics tracking
</a>
```

### Configuration

```php
// Enable GDPR compliance
UPDATE analytics_settings SET setting_value = 'true' WHERE setting_key = 'gdpr_enabled';

// Enable IP anonymization
UPDATE analytics_settings SET setting_value = 'true' WHERE setting_key = 'anonymize_ip';

// Set data retention (days)
INSERT INTO analytics_settings (setting_key, setting_value, setting_type)
VALUES ('data_retention_days', '730', 'integer');
```

## Troubleshooting

### Common Issues

#### 1. No Data Appearing in Dashboard

**Symptoms**: Dashboard shows zero visitors/page views
**Solutions**:
- Check database connection in `.env` file
- Verify analytics middleware is loaded in `index.php`
- Ensure JavaScript tracking script is included in pages
- Check browser console for JavaScript errors

#### 2. Geographic Data Not Working

**Symptoms**: All visitors show as "Unknown" location
**Solutions**:
- Download and install GeoLite2-City.mmdb database
- Place database file in `backend/data/GeoLite2-City.mmdb`
- Check file permissions (should be readable by web server)

#### 3. Real-time Data Not Updating

**Symptoms**: Real-time dashboard not showing live data
**Solutions**:
- Check that realtime cleanup is running
- Verify database triggers are working
- Check for PHP/MySQL errors in logs

#### 4. Export Functions Not Working

**Symptoms**: CSV/PDF export returns errors
**Solutions**:
- Ensure Dompdf and PhpSpreadsheet are installed via Composer
- Check PHP memory limits for large exports
- Verify file write permissions

### Debug Mode

Enable debug logging:

```javascript
SabiteckAnalytics.init({
    debug: true
});
```

Check PHP error logs:
```bash
tail -f /var/log/apache2/error.log
```

### Database Issues

Check table structure:
```sql
DESCRIBE analytics_visitors;
DESCRIBE analytics_sessions;
DESCRIBE analytics_page_views;
```

Verify data is being inserted:
```sql
SELECT COUNT(*) FROM analytics_visitors;
SELECT COUNT(*) FROM analytics_page_views;
```

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Testing

Run the included tests:

```bash
cd backend
composer test
```

### Database Schema Changes

When modifying the database schema:

1. Update `migrations/analytics_schema.sql`
2. Create migration scripts for existing installations
3. Update the setup script
4. Test with fresh and existing databases

### Adding New Metrics

To add new tracking metrics:

1. **Update Database Schema**: Add new columns/tables
2. **Update Models**: Extend `Analytics.php` model
3. **Update API**: Add new endpoints in `AnalyticsController.php`
4. **Update JavaScript**: Extend tracking script
5. **Update Dashboard**: Add new visualizations

### Performance Considerations

For high-traffic websites:

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Data Archiving**: Implement data archiving for old records
3. **Caching**: Add Redis/Memcached for frequent queries
4. **Queue Processing**: Use job queues for heavy processing

### Example Extension: Custom Events

```php
// Add new event type in Analytics.php
public function trackCustomEvent($eventData) {
    $stmt = $this->db->prepare("
        INSERT INTO analytics_custom_events (
            session_id, visitor_id, event_type, event_data, created_at
        ) VALUES (?, ?, ?, ?, NOW())
    ");

    return $stmt->execute([
        $eventData['session_id'],
        $eventData['visitor_id'],
        $eventData['event_type'],
        json_encode($eventData['data'])
    ]);
}
```

```javascript
// Add to JavaScript API
SabiteckAnalytics.trackCustom = function(eventType, data) {
    this.sendData('/analytics/track-custom', {
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        event_type: eventType,
        data: data
    });
};
```

---

## Support

For support, issues, or feature requests:

1. Check this documentation first
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include error logs and configuration details

## License

This analytics system is open source and available under the MIT License.

---

**Version**: 1.0.0
**Last Updated**: 2024
**Minimum Requirements**: PHP 8.1, MySQL 5.7, Modern Browsers