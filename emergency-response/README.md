# Emergency Response Platform

A multi-agency emergency response platform enabling silent emergency requests and coordinated response from police, fire, and medical services.

## Architecture

- **Backend**: Slim PHP with MySQL
- **Mobile App**: Flutter (iOS/Android)
- **Admin Console**: React + Vite + Tailwind + shadcn/ui
- **Database**: MySQL with read replicas
- **Security**: End-to-end encryption, JWT auth, role-based access

## Core Features

- Silent SOS triggers (panic button, gestures, voice)
- Live GPS tracking and location streaming
- Panic Cam auto-recording with SHA-256 integrity
- Multi-agency support (Police, Fire, Medical)
- Trusted contacts and community watch
- Responder verification via QR/codes
- Secure evidence chain of custody
- Real-time secure messaging
- Comprehensive admin analytics

## Project Structure

```
emergency-response/
├── backend/           # Slim PHP API
├── frontend/
│   ├── admin/        # React admin console
│   └── mobile/       # Flutter mobile app
├── database/         # Schema and migrations
├── deployment/       # Docker and K8s configs
├── docs/            # Documentation
└── scripts/         # Build and deployment scripts
```

## Security Features

- TLS encryption for all traffic
- Argon2 password hashing
- JWT with server-side refresh tokens
- Role-based access control
- End-to-end encryption for messaging
- File encryption at rest with envelope encryption
- SHA-256 hashing for evidence integrity
- Audit logging for all actions

## Getting Started

1. Set up database: `cd database && mysql < schema.sql`
2. Install backend: `cd backend && composer install`
3. Install admin console: `cd frontend/admin && npm install`
4. Set up mobile app: `cd frontend/mobile && flutter pub get`

## Development

See individual component READMEs for detailed setup instructions.