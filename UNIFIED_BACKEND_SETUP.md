# 🚀 Unified Backend Setup - Development & Production

## ✅ Setup Complete

The Sabiteck project now uses a **single unified backend** that works for both development and production environments. The `backend_production` folder has been removed and all functionality consolidated into the main `backend` folder.

## 📁 Project Structure

```
sabiteck_main_website-main/
├── backend/                    # 🎯 UNIFIED BACKEND (dev + production)
│   ├── .env                   # Development configuration
│   ├── .env.production        # Production configuration
│   ├── public/
│   │   └── index.php          # Framework-free API (works everywhere)
│   ├── src/                   # Additional backend files
│   ├── uploads/               # File storage
│   └── composer.json          # Dependencies (optional)
│
├── frontend/                  # React frontend
└── [other files...]
```

## 🔧 Environment Configuration

### **Development (.env)**
- **Database**: Local MySQL with fallback to mock data
- **URLs**: `localhost:8002` (backend), `localhost:5175` (frontend)
- **Debug**: Enabled
- **Auth**: Fallback admin login (admin/admin123)

### **Production (.env.production)**
- **Database**: Hostinger MySQL (`u315026656_sabi_db`)
- **URLs**: `sabiteck.com`, `backend.sabiteck.com`
- **Debug**: Disabled
- **Auth**: Database-driven with JWT tokens

## 🏃‍♂️ Running the Project

### **Development Mode**

1. **Start Backend:**
   ```bash
   cd backend/public
   php -S localhost:8002
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   # Usually runs on http://localhost:5175
   ```

3. **Access Admin Panel:**
   - URL: `http://localhost:5175/admin`
   - Username: `admin`
   - Password: `admin123`

### **Production Deployment**

1. **Upload Backend:**
   ```bash
   # Copy entire 'backend' folder to Hostinger
   # Point backend.sabiteck.com to backend/public/
   ```

2. **Switch to Production Environment:**
   ```bash
   cd backend
   mv .env .env.development
   mv .env.production .env
   ```

3. **Frontend Build:**
   ```bash
   cd frontend
   npm run build
   # Upload dist/ folder to sabiteck.com
   ```

## 🎯 Key Features

### **✅ Admin Panel Integration**
- **Home Section Management** (Hero, Features, Statistics)
- **About Section Management** (Story, Mission/Vision, Values)
- **Services Section Management** (Service listings)
- **Portfolio Section Management** (Projects, Categories)
- **Teams Section Management** (Team member profiles)
- **Dashboard Analytics** (Stats, Recent Contacts)

### **✅ Backend API**
- **Framework-Free**: No Slim/Laravel dependencies
- **Auto-Fallback**: Mock data when database unavailable
- **CORS Configured**: Ready for frontend integration
- **JWT Authentication**: Secure admin access
- **Auto-Table Creation**: Sets up MySQL tables automatically

### **✅ Development Features**
- **Hot Reload**: Frontend auto-refreshes on changes
- **Debug Mode**: Detailed error logging
- **Mock Data**: Works without database setup
- **Environment Switching**: Easy dev/production toggle

## 🔐 Security

### **Development**
- Admin fallback login enabled
- Debug mode for troubleshooting
- Local-only access

### **Production**
- Database-driven authentication
- JWT token security
- HTTPS enforcement
- Production error handling

## 📊 API Endpoints

### **Core Endpoints**
- `GET /` - API status and info
- `GET /api/status` - System health check
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Admin dashboard data

### **Content Endpoints**
- `GET /api/jobs` - Job listings
- `GET /api/scholarships` - Scholarship listings
- `POST /api/contact` - Contact form submissions
- `POST /api/newsletter/subscribe` - Newsletter signups

### **Admin Management**
- `GET /api/admin/team` - Team management
- `GET /api/admin/services` - Services management
- `GET /api/admin/content` - Content management
- `GET /api/admin/analytics` - Analytics data

## 🌐 Deployment Commands

### **Quick Development Start**
```bash
# Terminal 1 - Backend
cd sabiteck_main_website-main/backend/public && php -S localhost:8002

# Terminal 2 - Frontend
cd sabiteck_main_website-main/frontend && npm run dev
```

### **Production Setup**
```bash
# 1. Upload backend folder to Hostinger
# 2. Point backend.sabiteck.com to backend/public/
# 3. Switch environment file
mv backend/.env backend/.env.development
mv backend/.env.production backend/.env

# 4. Build and upload frontend
cd frontend && npm run build
# Upload dist/ to sabiteck.com
```

## ✨ Benefits of Unified Backend

1. **📦 Single Codebase**: One backend for all environments
2. **🔄 Easy Switching**: Environment files for dev/production
3. **🏠 Hostinger Ready**: Framework-free for maximum compatibility
4. **🛡️ Fallback Security**: Works even without database
5. **🎯 Admin Integration**: Complete admin panel functionality
6. **📈 Scalable**: Easy to extend and maintain

## 🚨 Important Notes

- **Environment Files**: Always use the correct `.env` for your environment
- **Database**: Development uses mock data fallback, production needs MySQL
- **Ports**: Development backend on 8002, frontend on 5175
- **Admin Access**: Development allows fallback login, production requires database
- **Consolidated**: All backend functionality merged into single `backend/` directory

The project is now ready for both development and production use with a single, unified backend architecture! 🎉