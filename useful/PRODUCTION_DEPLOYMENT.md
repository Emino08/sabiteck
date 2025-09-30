# Sabiteck Production Deployment Guide

Complete guide for deploying Sabiteck to production with domains `sabiteck.com` and `backend.sabiteck.com`.

## 📋 Pre-Deployment Checklist

### 1. Domain & SSL Setup
- [ ] Domain `sabiteck.com` points to frontend server
- [ ] Domain `backend.sabiteck.com` points to backend server
- [ ] SSL certificates installed for both domains
- [ ] DNS propagation completed

### 2. Google OAuth Configuration
- [ ] Google Cloud Console project configured
- [ ] OAuth consent screen approved
- [ ] Production URLs added to Google OAuth settings
- [ ] Client ID and secret updated in environment files

### 3. Database Setup
- [ ] Production database created
- [ ] Database credentials configured
- [ ] Database migrations run
- [ ] Sample data added (optional)

## 🛠️ Backend Deployment

### Step 1: Prepare Backend Environment

```bash
# Navigate to backend directory
cd backend/

# Copy production environment
cp .env.production .env

# Update environment variables
nano .env
```

**Required Environment Variables:**
```env
DB_HOST=your-production-db-host
DB_NAME=your-production-db-name
DB_USER=your-production-db-user
DB_PASS=your-production-db-password
JWT_SECRET=generate-strong-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
API_URL=https://backend.sabiteck.com
FRONTEND_URL=https://sabiteck.com
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
composer install --no-dev --optimize-autoloader

# Set file permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 600 .env
```

### Step 3: Web Server Configuration

#### Apache Configuration
Copy the provided `.htaccess` file to your document root and ensure:
- Document root points to `/path/to/backend/public`
- mod_rewrite is enabled
- SSL certificates are configured

#### Nginx Configuration
Use the provided `nginx.conf` file and:
- Update SSL certificate paths
- Set correct document root
- Enable PHP-FPM
- Configure rate limiting

### Step 4: Database Setup

```bash
# Test database connection
php test_db_connection.php

# Run migrations (if available)
php migrations/run.php

# Add sample analytics data (optional)
php add_sample_analytics_data.php
```

### Step 5: Test Backend API

```bash
# Test API endpoints
curl https://backend.sabiteck.com/api/health
curl https://backend.sabiteck.com/api/jobs
```

## 🌐 Frontend Deployment

### Step 1: Prepare Frontend Environment

```bash
# Navigate to frontend directory
cd frontend/

# Copy production environment
cp .env.production .env

# Update Google Client ID
nano .env
```

**Update these values:**
```env
VITE_API_URL=https://backend.sabiteck.com
VITE_APP_URL=https://sabiteck.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### Step 2: Build for Production

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The built files will be in the 'dist' directory
```

### Step 3: Deploy Frontend

```bash
# Copy built files to web server
cp -r dist/* /var/www/sabiteck.com/

# Set proper permissions
chmod -R 755 /var/www/sabiteck.com/
```

### Step 4: Configure Web Server

#### Apache (.htaccess for React SPA)
```apache
RewriteEngine On
RewriteBase /

# Handle HTTPS redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name sabiteck.com www.sabiteck.com;
    return 301 https://sabiteck.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sabiteck.com www.sabiteck.com;

    root /var/www/sabiteck.com;
    index index.html;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # React Router handling
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔐 Google OAuth Setup

### Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID

### Step 2: Configure OAuth Settings

**Authorized JavaScript Origins:**
```
https://sabiteck.com
```

**Authorized Redirect URIs:**
```
https://backend.sabiteck.com/api/auth/google/callback
```

### Step 3: Update Environment Variables

**Backend (.env):**
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=https://backend.sabiteck.com/api/auth/google/callback
```

**Frontend (.env):**
```env
VITE_GOOGLE_CLIENT_ID=your-actual-client-id
VITE_GOOGLE_REDIRECT_URI=https://backend.sabiteck.com/api/auth/google/callback
```

## 🧪 Testing Production Deployment

### Backend API Tests
```bash
# Health check
curl https://backend.sabiteck.com/api/health

# Public endpoints
curl https://backend.sabiteck.com/api/jobs
curl https://backend.sabiteck.com/api/content

# CORS test
curl -H "Origin: https://sabiteck.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://backend.sabiteck.com/api/jobs
```

### Frontend Tests
1. Open https://sabiteck.com
2. Test navigation between pages
3. Test Google OAuth login flow
4. Verify API calls work from browser
5. Check browser console for errors

### Google OAuth Flow Test
1. Click "Login with Google" on frontend
2. Complete Google authorization
3. Verify user is logged in
4. Check that JWT token is stored
5. Test authenticated API calls

## 🔧 Production Optimization

### Backend Optimizations
```bash
# Enable OPcache in PHP
echo "opcache.enable=1" >> /etc/php/8.2/apache2/php.ini

# Configure log rotation
nano /etc/logrotate.d/sabiteck

# Set up monitoring
systemctl enable apache2
systemctl enable mysql
```

### Frontend Optimizations
- Enable Gzip compression
- Set proper cache headers
- Configure CDN (optional)
- Monitor Core Web Vitals

## 📊 Monitoring & Maintenance

### Backend Monitoring
```bash
# Check logs
tail -f /var/log/apache2/sabiteck_backend_error.log

# Monitor API performance
curl -w "@curl-format.txt" -s -o /dev/null https://backend.sabiteck.com/api/jobs

# Database monitoring
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Frontend Monitoring
- Google Analytics setup
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

## 🚨 Troubleshooting

### Common Issues

#### CORS Errors
- Verify backend CORS middleware configuration
- Check allowed origins in Apache/.htaccess or Nginx config
- Ensure preflight OPTIONS requests are handled

#### Google OAuth Issues
- Verify client ID and secret are correct
- Check redirect URIs match exactly
- Ensure OAuth consent screen is published
- Test with different browsers/incognito mode

#### SSL/HTTPS Issues
- Verify SSL certificates are valid
- Check certificate chain
- Test with SSL Labs: https://www.ssllabs.com/ssltest/

#### Database Connection Issues
- Verify database credentials
- Check database server status
- Test connection with command line client
- Verify firewall rules

### Debug Commands
```bash
# Check Apache status
systemctl status apache2

# Check PHP-FPM status
systemctl status php8.2-fpm

# Check SSL certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Test database connection
mysql -h localhost -u username -p database_name
```

## 📚 Security Best Practices

### Backend Security
- [ ] Keep PHP and dependencies updated
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting
- [ ] Configure fail2ban for intrusion prevention
- [ ] Regular security audits

### Frontend Security
- [ ] Use HTTPS everywhere
- [ ] Implement Content Security Policy
- [ ] Regular dependency updates
- [ ] Secure cookie settings
- [ ] XSS protection headers

## 🎉 Go Live Checklist

### Final Pre-Launch
- [ ] All tests passing
- [ ] Google OAuth working
- [ ] Database properly configured
- [ ] SSL certificates valid
- [ ] DNS propagation complete
- [ ] Monitoring systems active

### Post-Launch
- [ ] Monitor error logs
- [ ] Check analytics tracking
- [ ] Verify email functionality
- [ ] Test all major user flows
- [ ] Set up automated backups

---

## Support & Documentation

- **Backend API Documentation**: Available at `/api/docs` (if implemented)
- **Google OAuth Documentation**: [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- **Deployment Issues**: Check logs and refer to troubleshooting section above

Good luck with your production deployment! 🚀