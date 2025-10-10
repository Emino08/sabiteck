# Quick Setup Guide - Team Management Enhancement

## Installation Steps

### 1. Database Setup (REQUIRED)

Run the migration file to create/update the team_members table:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the migration
source backend/migrations/create_team_members_table.sql;
```

Or use phpMyAdmin:
1. Open phpMyAdmin
2. Select your database
3. Go to "SQL" tab
4. Copy and paste the contents of `backend/migrations/create_team_members_table.sql`
5. Click "Go"

### 2. Create Upload Directory

Ensure the upload directory exists with proper permissions:

```bash
# Navigate to backend public directory
cd backend/public

# Create uploads directory if it doesn't exist
mkdir -p uploads/team

# Set proper permissions (Linux/Mac)
chmod 755 uploads/team

# For Windows, ensure the web server has write access
```

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Navigate to frontend directory
cd frontend

# Restart Vite development server
npm run dev
```

### 4. Verify Installation

1. **Check Public Team Page**
   - Navigate to: `http://localhost:5173/team`
   - Verify team members are displayed with photos
   - Test department filtering
   - Check responsive design on mobile

2. **Check Admin Team Management**
   - Navigate to: `http://localhost:5173/admin/team`
   - Try creating a new team member
   - Test photo upload
   - Verify edit and delete operations

## Troubleshooting

### Photos Not Displaying

**Issue**: Team member photos don't show up

**Solutions**:
1. Check if `uploads/team/` directory exists
2. Verify file permissions (755 for directories, 644 for files)
3. Check browser console for 404 errors
4. Verify the photo URL in the database starts with `/uploads/team/`
5. Ensure backend server is running on port 8002

### API Errors

**Issue**: "Failed to fetch team members" error

**Solutions**:
1. Verify database connection in `.env` file:
   ```
   DB_HOST=localhost
   DB_PORT=4306
   DB_NAME=devco_db
   DB_USER=root
   DB_PASS=your_password
   ```
2. Check if `team_members` table exists
3. Verify backend server is running
4. Check browser console for CORS errors

### Upload Errors

**Issue**: Photo upload fails

**Solutions**:
1. Check file size (must be < 5MB)
2. Check file type (only JPG, PNG, WebP allowed)
3. Verify image dimensions (max 2000x2000px)
4. Check directory permissions
5. Look for PHP errors in server logs

### CSP Errors

**Issue**: "Refused to connect to 'https://ipapi.co/json/'"

**Solution**: Already fixed in `frontend/vite.config.js`
- Restart development server to apply changes

## Configuration

### Environment Variables

Backend (`.env`):
```env
DB_HOST=localhost
DB_PORT=4306
DB_NAME=devco_db
DB_USER=root
DB_PASS=your_password
```

Frontend (`.env`):
```env
VITE_API_URL=http://localhost:8002
```

### Photo Upload Settings

Located in `backend/src/Controllers/TeamMemberController.php`:
- Max file size: 5MB
- Max dimensions: 2000x2000px
- Recommended: 800x800px
- Allowed formats: JPG, PNG, WebP

To modify:
```php
$maxSize = 5 * 1024 * 1024; // Change to desired size in bytes
```

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Upload directory created with correct permissions
- [ ] Development server restarted
- [ ] Public team page displays correctly
- [ ] Team member photos are visible
- [ ] Department filtering works
- [ ] Admin can create new team members
- [ ] Photo upload works
- [ ] Admin can edit team members
- [ ] Admin can delete team members
- [ ] Search functionality works
- [ ] Mobile responsive design works
- [ ] No console errors

## Production Deployment

### Before Deploying to Production:

1. **Update API URLs**
   ```javascript
   // In frontend code, change from:
   `http://localhost:8002${photoUrl}`
   
   // To:
   `https://backend.sabiteck.com${photoUrl}`
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Update CSP Headers**
   - Edit `.htaccess` or backend headers
   - Ensure `https://ipapi.co` is in `connect-src`

4. **Set Proper Permissions**
   ```bash
   # Set upload directory permissions
   chmod 755 backend/public/uploads/team
   ```

5. **Backup Database**
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

## Quick Commands

### Start Development
```bash
# Terminal 1 - Backend
cd backend
php -S localhost:8002 -t public

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

### Database Backup
```bash
mysqldump -u root -p devco_db > backup_$(date +%Y%m%d).sql
```

### View Logs
```bash
# PHP errors
tail -f /path/to/php/error.log

# Apache errors
tail -f /var/log/apache2/error.log
```

## Support Resources

- **Documentation**: See `TEAM_UI_UX_ENHANCEMENT.md`
- **Database Schema**: `backend/migrations/create_team_members_table.sql`
- **API Endpoints**: Check `backend/src/routes.php`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Photos not uploading | Check upload directory permissions |
| 404 on API calls | Verify backend server is running |
| CORS errors | Check CSP headers in `.htaccess` |
| Database connection failed | Verify `.env` credentials |
| Team members not loading | Run database migration |
| Images broken in production | Update image URLs to production domain |

## Next Steps

After successful installation:
1. Add your real team members through admin panel
2. Upload team member photos
3. Customize department names if needed
4. Test on mobile devices
5. Deploy to production

---

**Need Help?**
- Check browser console for errors
- Review server logs
- Verify database connection
- Ensure all dependencies are installed
