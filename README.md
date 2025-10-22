# Introspect Backend API

AI-powered malaria diagnostic platform backend for healthcare workers in Botswana and Sub-Saharan Africa.

## Overview

This is the backend API infrastructure for Introspect, providing comprehensive REST APIs for:
- User authentication and management
- Patient record management (anonymized)
- Diagnostic test submission and retrieval
- Blood smear image storage (AWS S3)
- Notification services (SMS/Email)
- Role-based access control

## Technology Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle
- **Authentication:** JWT + bcrypt
- **File Storage:** AWS S3
- **Notifications:** Twilio (SMS) + SendGrid (Email)
- **Frontend:** React + TypeScript (API Documentation)

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- AWS account (for S3)
- Twilio account (for SMS)
- SendGrid account (for Email)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Variables section below)

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Variables

Required:
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
```

Optional (for full functionality):
```bash
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=introspect-diagnostic-images

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@introspect.health
```

## API Documentation

Visit `http://localhost:5000` to access the interactive API documentation interface.

Key endpoint categories:
- `/api/auth/*` - Authentication (register, login, password reset)
- `/api/users/*` - User management
- `/api/patients/*` - Patient records
- `/api/diagnostics/*` - Diagnostic tests and results
- `/api/notifications/*` - SMS and Email notifications
- `/api/health` - Health check
- `/api/status` - API status and version

## Database Schema

### Users
- Healthcare workers, administrators, and MoH officials
- Role-based access (health_worker, admin, super_admin)
- Encrypted passwords, facility tracking

### Patients
- Anonymized records (patient codes instead of names)
- Age, gender, district tracking
- HIPAA/WHO compliance considerations

### Diagnostics
- Blood smear test results
- AI analysis data (confidence scores, parasite counts)
- S3 image URLs
- Review workflow (pending → reviewed → verified)

### Notifications
- SMS and Email logs
- Delivery status tracking
- Retry logic for failed sends

### Password Reset Tokens
- Secure, time-limited password recovery
- One-time use tokens

## Security Features

- **Authentication:** JWT tokens with 24-hour expiry
- **Password Hashing:** bcrypt with 10 rounds
- **Authorization:** Role-based access control
- **Input Validation:** Zod schemas for all endpoints
- **Data Encryption:** AES-256 for S3 storage
- **Privacy:** Anonymized patient data

## Flutter Integration

See `FLUTTER_INTEGRATION_GUIDE.md` for comprehensive instructions on integrating your Flutter mobile app with this backend.

Key points for Flutter developers:
- All endpoints use JWT authentication
- Multipart form data for image uploads
- Standardized JSON responses
- Comprehensive error codes
- 24-hour token expiry

## Development

### Database Migrations
```bash
# Push schema changes
npm run db:push

# Force push (if needed)
npm run db:push --force
```

### Running Tests
```bash
npm test
```

### Project Structure
```
├── client/               # React API documentation UI
│   └── src/
│       ├── components/   # React components
│       └── pages/        # Page components
├── server/               # Backend API
│   ├── auth.ts          # Authentication middleware
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   ├── s3.ts            # AWS S3 integration
│   └── notifications.ts # Notification services
├── shared/
│   └── schema.ts        # Shared types and schemas
└── README.md
```

## Deployment

### Replit Deployment
This project is configured for easy deployment on Replit:
1. Publish your Repl
2. Configure environment variables
3. Access via your Replit app URL

### Production Checklist
- [ ] Set `SESSION_SECRET` to a strong random value
- [ ] Configure AWS S3 credentials
- [ ] Set up Twilio for SMS notifications
- [ ] Set up SendGrid for email notifications
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for your Flutter app domain
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Review and test all security measures

## API Response Format

All responses follow this standard format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-08-07T10:30:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2026-08-07T10:30:00Z"
}
```

## Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - Insufficient permissions for the operation
- `VALIDATION_ERROR` - Invalid request data
- `USER_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong email or password
- `NOT_FOUND` - Requested resource not found
- `SERVER_ERROR` - Internal server error

## Performance Targets

- API response time: <200ms (p95)
- Image upload: Up to 10MB files
- Concurrent users: 500+ health workers
- Uptime SLA: 99.5%

## Compliance & Standards

- **WHO Digital Health Standards:** Compliant data structures
- **HIPAA Alignment:** De-identified patient data, audit logging ready
- **Data Encryption:** TLS 1.3 for transport, AES-256 at rest
- **Privacy:** Minimal data collection, anonymized analytics

## Support

For questions or issues:
1. Check the API documentation UI
2. Review the Flutter integration guide
3. Check error response codes and messages
4. Verify environment configuration

## License

Proprietary - Introspect Health Technologies

## Contributors

- Ditiro Rampate (Founder)
- AI Development Team

---

**Version:** 1.0.0  
**Last Updated:** October 22, 2025  
**Status:** Production Ready for Flutter Integration
