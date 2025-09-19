# Corruption Reporter Mobile App

A secure, offline-first Flutter mobile application for reporting corruption incidents with end-to-end encryption and anonymous reporting capabilities.

## Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: All data encrypted using AES-256 before storage
- **Anonymous Reporting**: Submit reports without revealing identity
- **Secure Storage**: Sensitive data stored in device secure enclave
- **Data Integrity**: SHA-256 hashing for file verification
- **Secure File Deletion**: Cryptographic wiping of temporary files

### 📱 Offline-First Architecture
- **Local SQLite Database**: Full functionality without internet
- **Background Sync**: Automatic synchronization when connected
- **Conflict Resolution**: Smart merging of offline/online changes
- **Progressive Upload**: Resume interrupted uploads
- **Data Compression**: Efficient storage and transmission

### 📸 Evidence Collection
- **Camera Integration**: Capture photos and videos directly
- **Audio Recording**: Record voice evidence
- **File Attachments**: Support for documents and images
- **GPS Location**: Automatic incident location capture
- **Metadata Preservation**: Timestamp and device information

### 🎯 User Experience
- **Material Design 3**: Modern, accessible interface
- **Dark/Light Theme**: Adaptive to system preferences
- **Offline Indicators**: Clear sync status display
- **Progress Tracking**: Upload and sync progress
- **Multi-language Support**: Localized for global use

## Tech Stack

- **Framework**: Flutter 3.13+ with Dart 3.1+
- **Database**: SQLite with Drift ORM
- **Encryption**: AES-256-CBC with secure key storage
- **State Management**: BLoC pattern with Equatable
- **Networking**: Dio with retry mechanisms
- **File Handling**: Secure storage with encryption
- **Push Notifications**: Firebase Cloud Messaging

## Architecture

### Data Flow
```
UI Layer (BLoC) → Repository → Local Database (Encrypted)
                              ↓
                         Sync Service ← Background Tasks
                              ↓
                         API Client → Backend Server
```

### Security Layers
1. **App Layer**: Biometric/PIN authentication
2. **Data Layer**: AES-256 encryption at rest
3. **Transport Layer**: TLS 1.3 encryption in transit
4. **Storage Layer**: Platform secure storage APIs

## Getting Started

### Prerequisites
- Flutter 3.13.0 or higher
- Dart SDK 3.1.0 or higher
- Android SDK (API level 21+) or iOS 12.0+
- Firebase project configured

### Installation

1. **Clone and Navigate**
   ```bash
   cd mobile-app
   ```

2. **Install Dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate Code**
   ```bash
   flutter packages pub run build_runner build
   ```

4. **Configure Firebase**
   - Add `google-services.json` (Android)
   - Add `GoogleService-Info.plist` (iOS)

5. **Run the App**
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── core/                    # Core functionality
│   ├── database/           # Database schema and DAOs
│   ├── services/           # Background services
│   ├── network/            # API client and networking
│   ├── utils/              # Utilities and helpers
│   └── config/             # App configuration
├── features/               # Feature modules
│   ├── auth/               # Authentication
│   ├── reports/            # Report management
│   ├── media/              # Media handling
│   └── sync/               # Data synchronization
└── shared/                 # Shared components
    ├── widgets/            # Reusable UI components
    ├── themes/             # App theming
    └── constants/          # App constants
```

## Key Components

### Database Schema
```sql
-- Reports table with encryption support
CREATE TABLE reports (
  id INTEGER PRIMARY KEY,
  uuid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  is_encrypted BOOLEAN DEFAULT TRUE,
  sync_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Encryption Service
```dart
// Encrypt sensitive data before storage
final encryptedData = encryptionService.encryptText(sensitiveText);
await database.store(encryptedData);

// Decrypt when needed
final decryptedText = encryptionService.decryptText(encryptedData);
```

### Sync Service
```dart
// Automatic background synchronization
syncService.startAutoSync(interval: Duration(minutes: 5));

// Monitor sync progress
syncService.syncProgress.listen((progress) {
  if (progress.isCompleted) {
    showSuccessMessage('Data synced successfully');
  }
});
```

## Security Implementation

### Data Encryption
- **Master Key**: Generated and stored in platform secure storage
- **Per-Item Keys**: Unique encryption keys for each data item
- **IV Generation**: Cryptographically secure random IVs
- **Key Rotation**: Periodic master key updates

### Anonymous Reporting
- **No PII Collection**: Optional personal information
- **Device Anonymization**: Randomized device identifiers
- **Network Privacy**: Tor/VPN support for enhanced anonymity
- **Metadata Stripping**: Remove identifying information from files

### Secure Communication
- **Certificate Pinning**: Prevent man-in-the-middle attacks
- **Request Signing**: HMAC signatures for API requests
- **Token Encryption**: Encrypted authentication tokens
- **Rate Limiting**: Client-side request throttling

## Offline Capabilities

### Local Storage
- **Full CRUD**: Complete functionality without internet
- **Media Storage**: Encrypted file storage on device
- **Search/Filter**: Offline report browsing and search
- **Draft Support**: Save incomplete reports

### Sync Strategy
- **Conflict Resolution**: Last-write-wins with user override
- **Batch Operations**: Efficient bulk synchronization
- **Delta Sync**: Only sync changed data
- **Retry Logic**: Exponential backoff for failed syncs

## Performance Optimizations

### Database Performance
- **Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient large dataset handling
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Minimized database operations

### Memory Management
- **Image Compression**: Automatic photo optimization
- **Lazy Loading**: Load data as needed
- **Cache Management**: LRU cache for frequently accessed data
- **Dispose Pattern**: Proper resource cleanup

### Battery Optimization
- **Background Limits**: Respectful background processing
- **Batch Network**: Group network operations
- **Location Services**: Smart GPS usage
- **Wake Lock Management**: Minimal screen wake usage

## Testing Strategy

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

### Widget Tests
```bash
flutter test test/widgets/
```

### Security Tests
- Encryption/Decryption validation
- Secure storage verification
- Network security testing
- File integrity checks

## Build & Deployment

### Android Release
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS Release
```bash
flutter build ios --release
```

### Code Signing
- Configure signing certificates
- Set up provisioning profiles
- Enable app-specific features

## Monitoring & Analytics

### Crash Reporting
- Firebase Crashlytics integration
- Custom error tracking
- Performance monitoring
- User session analytics

### Privacy-Compliant Analytics
- No PII collection
- Aggregated usage statistics
- Opt-in analytics consent
- Local-only metrics option

## Accessibility

### WCAG Compliance
- Screen reader support
- High contrast themes
- Large font support
- Voice navigation

### Inclusive Design
- Color-blind friendly palettes
- Motor impairment considerations
- Cognitive load reduction
- Multi-modal interactions

## Internationalization

### Supported Languages
- English (default)
- Spanish
- French
- Portuguese
- Arabic

### Localization
```bash
flutter gen-l10n
```

## Contributing

### Code Style
- Follow Dart/Flutter conventions
- Use provided linting rules
- Document public APIs
- Write comprehensive tests

### Security Review
- All encryption changes require review
- Security-sensitive code needs approval
- Regular security audits
- Penetration testing

## License

All rights reserved. This software is proprietary and confidential.