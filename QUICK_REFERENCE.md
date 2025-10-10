# Quick Reference - Team Management Enhancement

## 🚀 Quick Start (3 Steps)

### Step 1: Database
```bash
mysql -u root -p devco_db < backend/migrations/create_team_members_table.sql
```

### Step 2: Directory
```bash
mkdir -p backend/public/uploads/team
chmod 755 backend/public/uploads/team
```

### Step 3: Run
```bash
cd frontend && npm run dev
```

## 📍 Access Points

- **Public Team Page**: http://localhost:5173/team
- **Admin Dashboard**: http://localhost:5173/admin/team

## ✨ Key Features

### Public Page
- ✅ Full-size team member photos
- ✅ Animated gradient hero
- ✅ Department filtering
- ✅ Core values section
- ✅ Social media links
- ✅ Mobile responsive

### Admin Panel
- ✅ Create team members
- ✅ Edit team members
- ✅ Delete team members
- ✅ Upload photos
- ✅ Toggle active status
- ✅ Set featured members
- ✅ Search & filter

## 🔧 Configuration

### Photo Requirements
- **Max Size**: 5MB
- **Max Dimensions**: 2000x2000px
- **Recommended**: 800x800px
- **Formats**: JPG, PNG, WebP

### API Endpoints
```
GET    /api/team              - Get active team members
GET    /api/admin/team        - Get all team members
POST   /api/admin/team        - Create team member
PUT    /api/admin/team/{id}   - Update team member
DELETE /api/admin/team/{id}   - Delete team member
POST   /api/admin/team/upload-photo - Upload photo
```

## 🐛 Troubleshooting

### Photos Not Showing
1. Check upload directory exists
2. Verify file permissions (755)
3. Check photo URL in database
4. Ensure backend running on port 8002

### API Errors
1. Verify database connection
2. Check .env file settings
3. Ensure team_members table exists
4. Check backend server is running

### Upload Fails
1. Check file size < 5MB
2. Verify file type (JPG/PNG/WebP)
3. Check dimensions < 2000x2000px
4. Verify directory permissions

## 📚 Documentation Files

- `TEAM_UI_UX_ENHANCEMENT.md` - Complete changes
- `TEAM_SETUP_GUIDE.md` - Detailed setup
- `TEAM_VISUAL_GUIDE.md` - Visual design
- `QUICK_REFERENCE.md` - This file

## 🎨 Design Tokens

### Colors
- Primary: `#7C3AED` (Purple)
- Secondary: `#4F46E5` (Indigo)
- Accent: `#EC4899` (Pink)

### Spacing
- Card Gap: `gap-8` (2rem)
- Section Padding: `py-12` to `py-24`
- Container: `px-4`

### Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## ✅ Testing Checklist

- [ ] Database migration ran successfully
- [ ] Upload directory created
- [ ] Public page loads
- [ ] Team members display
- [ ] Photos show correctly
- [ ] Department filter works
- [ ] Admin login works
- [ ] Can create team member
- [ ] Can edit team member
- [ ] Can delete team member
- [ ] Photo upload works
- [ ] Search works
- [ ] Filters work
- [ ] Mobile responsive

## 🔐 Security

- ✅ File type validation
- ✅ File size limits
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ CSP headers
- ✅ Input sanitization

## 📊 Database Fields

### Required
- `name` - Team member name
- `position` - Job title

### Optional
- `department` - Department name
- `bio` - Biography text
- `email` - Contact email
- `phone` - Phone number
- `location` - Geographic location
- `photo_url` - Photo URL
- `linkedin_url` - LinkedIn profile
- `twitter_url` - Twitter profile
- `website_url` - Personal website
- `skills` - JSON array
- `years_experience` - Number
- `active` - Boolean
- `featured` - Boolean
- `order_position` - Sort order

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| 404 on photos | Check upload directory exists |
| CORS errors | Verify CSP headers |
| Upload fails | Check file permissions |
| No team members | Run database migration |
| API not responding | Check backend server |

## 💡 Tips

1. **Photo Quality**: Use 800x800px for best results
2. **Bio Length**: Keep under 200 characters
3. **Skills**: Add 3-5 relevant skills
4. **Order**: Use order_position for sorting
5. **Featured**: Limit to 3-5 members
6. **Department**: Keep names consistent

## 🔗 Quick Links

- Frontend: `frontend/src/components/pages/Team.jsx`
- Admin: `frontend/src/components/admin/TeamManagement.jsx`
- API: `backend/src/Controllers/TeamController.php`
- Routes: `backend/src/routes.php`
- Migration: `backend/migrations/create_team_members_table.sql`

## 📞 Support

Need help?
1. Check console errors
2. Review server logs
3. Verify database connection
4. Check file permissions
5. Read documentation files

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: ✅ Production Ready
