# Corruption Reporter - Web Admin Panel

A modern, secure web-based admin panel for managing corruption reports, built with React, TypeScript, and Tailwind CSS.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Role-based access control (Super Admin, Institution Admin, Investigator)
- Secure logout with token cleanup

### 📊 Dashboard
- Real-time statistics and KPIs
- Recent reports overview
- Category-wise report distribution
- System health monitoring

### 📝 Report Management
- View and filter reports by status, category, date
- Assign reports to investigators
- Update report status with audit trail
- Add internal comments and notes
- View complete report history

### 👥 User Management
- Create and manage user accounts
- Role assignment and permissions
- Account activation/deactivation
- User activity monitoring

### 🏢 Institution Management
- Manage reporting institutions
- Assign administrators and investigators
- Institution-specific analytics

### 📈 Analytics & Reporting
- Interactive charts and graphs
- Trend analysis over time
- Export reports in CSV/PDF format
- Public transparency metrics

### 🔍 Audit & Security
- Complete audit trail of all actions
- User activity logs
- IP tracking and session management
- Security event monitoring

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for auth state
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router
- **Build Tool**: Vite
- **HTTP Client**: Axios with interceptors

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── layout/             # Layout components (Sidebar, Header)
├── pages/                  # Page components
├── stores/                 # Zustand stores
├── lib/                    # Utilities and API client
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on http://localhost:8000

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Create .env file
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - URL: http://localhost:3000
   - Default Admin: admin@corruption-reporter.com / admin123!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features Implementation

### Authentication Flow
```typescript
// Automatic token refresh with interceptors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto-refresh token and retry request
      await refreshToken()
      return api(originalRequest)
    }
  }
)
```

### Role-Based Navigation
```typescript
// Dynamic navigation based on user role
const filteredNavigation = navigation.filter(item =>
  user?.role && item.roles.includes(user.role)
)
```

### Real-Time Data
```typescript
// Automatic data refetching with React Query
const { data, isLoading } = useQuery({
  queryKey: ['reports'],
  queryFn: () => reportsApi.getReports(),
  refetchInterval: 30000, // Refresh every 30 seconds
})
```

## Security Features

### Client-Side Security
- JWT tokens stored securely in localStorage
- Automatic token cleanup on logout
- CSRF protection via custom headers
- Input validation and sanitization

### API Integration
- All requests include authentication headers
- Automatic retry on token expiration
- Rate limiting compliance
- Error handling and user feedback

## Component Library

Built with shadcn/ui for consistent, accessible components:

- **Cards**: Dashboard widgets and content containers
- **Tables**: Data display with sorting and filtering
- **Forms**: Input validation and error handling
- **Dialogs**: Modal interactions
- **Toasts**: User notifications

## Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive sidebar navigation
- Adaptive data tables
- Touch-friendly interactions

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of page components
- Optimized re-renders with React Query
- Efficient state management with Zustand

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Clear naming conventions

### State Management
- Local state for UI interactions
- Zustand for global auth state
- React Query for server state
- No prop drilling

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Fallback UI components
- Graceful degradation

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```bash
VITE_API_URL=https://api.corruption-reporter.com
```

### Deployment Options
- Netlify/Vercel for static hosting
- Docker container deployment
- CDN distribution for assets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow TypeScript best practices
2. Use existing component patterns
3. Maintain responsive design
4. Add proper error handling
5. Update documentation

## License

All rights reserved.