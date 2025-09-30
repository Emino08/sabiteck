# Corruption Reporting Platform

A comprehensive platform for reporting and managing corruption cases with a Flutter mobile app, web admin panel, and secure backend.

## Architecture

- **Mobile App**: Flutter with offline-first architecture
- **Web Admin**: Vite + shadcn/ui + Tailwind CSS
- **Backend API**: Slim PHP with JWT authentication
- **Database**: MySQL with full audit logging
- **Security**: End-to-end encryption, SHA-256 hashing, digital watermarking

## Project Structure

```
corruption-reporter/
├── backend/                 # Slim PHP API
├── web-admin/              # Vite admin dashboard
├── mobile-app/             # Flutter mobile app
├── docs/                   # Documentation
└── deployment/             # Docker & deployment configs
```

## Features

### Core Functionality
- Anonymous reporting with whistleblower protection
- Offline data capture with auto-sync
- Real-time case tracking with unique IDs
- Multi-media evidence collection (photo, video, audio)
- GPS location and metadata capture

### Security & Privacy
- AES-256 encryption for data at rest and in transit
- SHA-256 file integrity verification
- Digital watermarking for media authenticity
- Complete audit trail system
- Role-based access control

### Admin Features
- Multi-role user management (Super Admin, Institution Admin, Investigators)
- Case assignment and workflow management
- Analytics dashboard with trend analysis
- Data export (CSV/PDF) for official reporting
- Push notification system

### Transparency
- Public trust section with anonymized success stories
- Case status tracking for reporters
- Community impact metrics

## Getting Started

See individual component READMEs for setup instructions:
- [Backend Setup](./backend/README.md)
- [Web Admin Setup](./web-admin/README.md)
- [Mobile App Setup](./mobile-app/README.md)

## License

All rights reserved.