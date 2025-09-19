# Academic Credentials Verification Platform

A comprehensive system for verifying academic credentials nationwide, built with security, privacy, and efficiency in mind.

## Architecture

- **Frontend**: React with Vite, Tailwind CSS, and shadcn/ui
- **Backend**: Slim PHP framework with JWT authentication
- **Database**: MySQL with encrypted file storage
- **Security**: TLS, rate limiting, 2FA support, and audit logging

## Features

- Institution management with role-based permissions
- Credential record creation with unique QR codes
- Public verification endpoint with caching
- Bulk CSV import with validation
- Comprehensive audit logging
- Encrypted file attachments
- Developer API portal

## Directory Structure

```
├── backend/           # Slim PHP API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── config/
│   │   └── utils/
│   ├── tests/
│   ├── migrations/
│   └── storage/
├── frontend/          # React Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── contexts/
│   └── public/
├── docs/             # Documentation
└── scripts/          # Deployment and utility scripts
```

## Quick Start

1. Set up the backend:
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php migrations/setup.php
   ```

2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Security Features

- TLS encryption for all traffic
- Password hashing with salt
- Role-based access control
- Rate limiting and bot protection
- Two-factor authentication support
- Encrypted file storage
- Comprehensive audit trails

## Documentation

See the `docs/` directory for:
- API reference
- Installation guide
- Security guidelines
- Integration examples