# API Reference

## Base URL
```
https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### API Keys (for trusted partners)
```http
X-API-Key: <api-key>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "mfa_code": "123456" // Optional if MFA enabled
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "institution_admin",
      "institution_id": 1,
      "institution_name": "National University",
      "permissions": ["create_record", "edit_record"],
      "mfa_enabled": false
    }
  }
}
```

### POST /auth/refresh
Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### POST /auth/logout
Logout current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### POST /auth/forgot-password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent"
  }
}
```

## Verification Endpoints (Public)

### GET /verify/{code}
Verify a credential by code or slug.

**Parameters:**
- `code` (path): Certificate code or verification slug

**Response:**
```json
{
  "success": true,
  "data": {
    "certificate_code": "NU-CS-2024-001",
    "verification_slug": "nu-cs-alice-johnson",
    "student_name": "Alice Johnson",
    "program_name": "Computer Science",
    "program_type": "degree",
    "award_grade": "First Class Honours",
    "graduation_date": "2024-06-15",
    "record_type": "certificate",
    "public_summary": "Bachelor of Science in Computer Science with First Class Honours",
    "institution": {
      "name": "National University",
      "logo": "/uploads/logos/nu.png",
      "verified": true,
      "domain": "national-university.edu"
    },
    "status": "valid",
    "issued_date": "2024-06-16T10:30:00Z",
    "qr_code_url": "https://your-domain.com/qr/nu-cs-alice-johnson.png",
    "verification_url": "https://your-domain.com/verify/nu-cs-alice-johnson",
    "trust_score": 95
  }
}
```

### POST /verify/request
Request detailed verification access.

**Request:**
```json
{
  "code": "NU-CS-2024-001",
  "email": "employer@company.com",
  "name": "HR Manager",
  "organization": "ABC Corporation",
  "reason": "Employment verification for software developer position"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Verification request submitted successfully",
    "request_id": 123,
    "status": "pending_approval"
  }
}
```

### GET /verify/detailed/{token}
Access detailed verification with approved token.

**Parameters:**
- `token` (path): Access token from approved request

**Response:**
```json
{
  "success": true,
  "data": {
    "certificate_code": "NU-CS-2024-001",
    "student_name": "Alice Johnson",
    "student_id": "STU001",
    "program_name": "Computer Science",
    "program_type": "degree",
    "award_grade": "First Class Honours",
    "graduation_date": "2024-06-15",
    "record_type": "certificate",
    "public_summary": "Bachelor of Science in Computer Science with First Class Honours",
    "institution": {
      "name": "National University",
      "logo": "/uploads/logos/nu.png"
    },
    "metadata": {
      "gpa": "3.8",
      "credits": "120",
      "specialization": "Artificial Intelligence"
    },
    "digital_signature": "...",
    "issued_date": "2024-06-16T10:30:00Z",
    "file_available": true,
    "audit_trail": [
      {
        "action": "credential_created",
        "timestamp": "2024-06-16T10:30:00Z",
        "actor": "Registration Office"
      }
    ],
    "trust_score": 95,
    "access_info": {
      "requested_by": "employer@company.com",
      "requested_at": "2024-06-20T14:00:00Z",
      "approved_at": "2024-06-20T15:30:00Z",
      "expires_at": "2024-06-27T15:30:00Z"
    }
  }
}
```

## Institution Management

### GET /institutions
List institutions (paginated).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `search` (string): Search term
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "National University",
        "accreditation_id": "UNIV-001",
        "domain_email": "admin@national-university.edu",
        "contact_name": "Dr. John Smith",
        "contact_email": "registrar@national-university.edu",
        "address": "123 University Ave, Capital City",
        "is_verified": true,
        "is_active": true,
        "created_at": "2024-01-15T09:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### POST /institutions
Create new institution (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "State University",
  "accreditation_id": "STATE-001",
  "domain_email": "admin@state-university.edu",
  "contact_name": "Dr. Jane Doe",
  "contact_email": "registrar@state-university.edu",
  "address": "456 College Road, State City"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "State University",
    "accreditation_id": "STATE-001",
    "domain_email": "admin@state-university.edu",
    "contact_name": "Dr. Jane Doe",
    "contact_email": "registrar@state-university.edu",
    "address": "456 College Road, State City",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-06-20T10:00:00Z"
  }
}
```

## Credential Management

### GET /credentials
List credentials (paginated).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number
- `status` (string): Filter by status
- `student_name` (string): Search by student name
- `institution_id` (int): Filter by institution

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "institution_id": 1,
        "student_name": "Alice Johnson",
        "student_id": "STU001",
        "program_name": "Computer Science",
        "program_type": "degree",
        "award_grade": "First Class Honours",
        "graduation_date": "2024-06-15",
        "certificate_code": "NU-CS-2024-001",
        "verification_slug": "nu-cs-alice-johnson",
        "status": "valid",
        "record_type": "certificate",
        "public_summary": "Bachelor of Science in Computer Science",
        "created_at": "2024-06-16T10:30:00Z",
        "institution_name": "National University"
      }
    ],
    "total": 1000,
    "page": 1,
    "per_page": 20,
    "total_pages": 50,
    "has_next": true,
    "has_prev": false
  }
}
```

### POST /credentials
Create new credential.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "student_name": "Bob Smith",
  "student_id": "STU002",
  "program_name": "Business Administration",
  "program_type": "degree",
  "award_grade": "Second Class Upper",
  "graduation_date": "2024-06-15",
  "record_type": "certificate",
  "public_summary": "Bachelor of Business Administration with Second Class Upper Division",
  "metadata": {
    "gpa": "3.5",
    "major": "Finance"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "institution_id": 1,
    "student_name": "Bob Smith",
    "student_id": "STU002",
    "program_name": "Business Administration",
    "program_type": "degree",
    "award_grade": "Second Class Upper",
    "graduation_date": "2024-06-15",
    "certificate_code": "NU-BA-2024-002",
    "verification_slug": "nu-ba-bob-smith",
    "status": "valid",
    "record_type": "certificate",
    "public_summary": "Bachelor of Business Administration with Second Class Upper Division",
    "created_at": "2024-06-20T11:00:00Z"
  }
}
```

### POST /credentials/{id}/approve
Approve pending credential.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Credential approved successfully"
  }
}
```

### POST /credentials/{id}/revoke
Revoke credential.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "reason": "Degree revoked due to academic misconduct"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Credential revoked successfully"
  }
}
```

### POST /credentials/bulk-import
Bulk import credentials from CSV.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Request:**
```
Form Data:
file: [CSV file]
```

**CSV Format:**
```csv
student_name,student_id,program_name,program_type,award_grade,graduation_date,record_type,public_summary
"John Doe","STU003","Mathematics","degree","First Class","2024-05-30","certificate","Bachelor of Mathematics with First Class"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 100,
    "failed": 5,
    "errors": [
      {
        "row": 15,
        "error": "Invalid graduation date format"
      }
    ]
  }
}
```

## User Management

### GET /users
List users (paginated).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number
- `role` (string): Filter by role
- `institution_id` (int): Filter by institution

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "institution_id": 1,
        "name": "John Admin",
        "email": "admin@national-university.edu",
        "role": "institution_admin",
        "permissions": ["create_record", "edit_record", "approve_record"],
        "is_active": true,
        "created_at": "2024-01-15T09:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "per_page": 20,
    "total_pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

### POST /users/invite
Invite new user.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "email": "newuser@university.edu",
  "role": "staff",
  "institution_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Invitation sent successfully"
  }
}
```

## Audit Endpoints

### GET /audit/logs
Get audit logs (paginated).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number
- `action` (string): Filter by action type
- `entity_type` (string): Filter by entity type
- `start_date` (string): Filter from date (YYYY-MM-DD)
- `end_date` (string): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "action": "credential_created",
        "entity_type": "credential",
        "timestamp": "2024-06-20T10:30:00Z",
        "actor_name": "John Admin",
        "metadata": {
          "credential_code": "NU-CS-2024-001",
          "student_name": "Alice Johnson"
        }
      }
    ],
    "total": 500,
    "page": 1,
    "per_page": 50,
    "total_pages": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

### GET /audit/credentials/{id}/trail
Get complete audit trail for a credential.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "credential_created",
      "timestamp": "2024-06-16T10:30:00Z",
      "actor_name": "Registration Office",
      "metadata": {
        "created_by": "John Admin"
      }
    },
    {
      "id": 2,
      "action": "verification_attempt",
      "timestamp": "2024-06-20T14:15:00Z",
      "actor_name": null,
      "metadata": {
        "success": true,
        "ip_address": "192.168.1.100"
      }
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting:

- **General endpoints**: 60 requests per minute
- **Verification endpoints**: 120 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Upload endpoints**: 5 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1624360800
Retry-After: 60
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## Webhook Events (Coming Soon)

Future versions will support webhooks for real-time notifications:

- `credential.created`
- `credential.approved`
- `credential.revoked`
- `verification.requested`
- `verification.approved`

## SDKs and Libraries

Official SDKs are planned for:
- PHP
- JavaScript/Node.js
- Python
- Java

## Postman Collection

A complete Postman collection is available at `/docs/postman-collection.json` for testing and development.