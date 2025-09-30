# Sabiteck Backend Production

This is the production-ready backend for Sabiteck.

## Deployment Instructions

1. Update .env with production credentials
2. Run: composer install --no-dev --optimize-autoloader
3. Point web server document root to /public directory
4. Set file permissions: chmod -R 755 . && chmod 600 .env
5. Configure SSL certificates
6. Test all endpoints

## Important Files

- .env: Environment configuration (update with real credentials)
- public/: Web server document root
- deploy.php: Deployment checklist script
- setup_analytics_simple.php: Database setup
- nginx.conf: Nginx configuration reference

## Google OAuth Setup

Update Google Cloud Console with:
- Authorized Origins: https://sabiteck.com
- Redirect URIs: https://backend.sabiteck.com/api/auth/google/callback

Generated on: 2025-09-15 22:06:58