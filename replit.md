# Introspect Backend API

## Project Overview
**Purpose:** Backend API infrastructure for Introspect, an AI-powered malaria diagnostic platform for healthcare workers in Botswana and Sub-Saharan Africa.

**Technology Stack:**
- Backend: Node.js + Express.js
- Database: PostgreSQL (Neon)
- Frontend: React + TypeScript (API Documentation UI)
- Authentication: JWT tokens
- Integrations: AWS S3, Twilio (SMS), SendGrid (Email)

## Current State (October 22, 2025)
- ✅ Complete database schema defined for users, patients, diagnostics, notifications
- ✅ API documentation interface built with beautiful UI
- ✅ Design system configured with health-focused colors (medical blues/greens)
- 🚧 Backend implementation in progress

## Project Architecture

### Database Schema
**Users Table**
- Healthcare workers, administrators, and MoH officials
- Role-based access control (health_worker, admin, super_admin)
- Facility and district assignment tracking
- Encrypted passwords with bcrypt

**Patients Table**
- Anonymized patient records (using patient codes)
- Links to facility and district for surveillance
- Privacy-first design (no PII)

**Diagnostics Table**
- Blood smear test results with AI analysis
- S3 URLs for diagnostic images
- AI confidence scores and parasite counts
- Review workflow (pending → reviewed → verified)
- Links to patients and submitting users

**Notifications Table**
- SMS and Email notification logs
- Delivery status tracking with retry logic
- Priority levels (urgent for positive results, routine for reports)

**Password Reset Tokens**
- Secure token-based password recovery
- Time-limited tokens with expiry tracking

### API Endpoints Structure

**Authentication** (`/api/auth`)
- POST /register - Create new user account
- POST /login - Get JWT token
- POST /forgot-password - Request reset token
- POST /reset-password - Reset with token

**User Management** (`/api/users`)
- GET /profile - Get current user
- PUT /profile - Update user info
- DELETE /account - Delete account

**Diagnostics** (`/api/diagnostics`)
- POST /submit - Upload blood smear image
- GET /history - List all diagnostics
- GET /:id - Get specific diagnostic
- PUT /:id/review - Add review notes (admin only)

**Patients** (`/api/patients`)
- POST / - Create patient record
- GET / - List patients
- GET /:id - Get patient with test history
- PUT /:id - Update patient info

**Notifications** (`/api/notifications`)
- POST /send - Send SMS/email
- GET /history - View sent notifications
- PUT /:id/status - Update delivery status

**System** (`/api`)
- GET /health - Health check
- GET /status - API version and status

### AWS S3 Integration
**Buckets:**
- `introspect-diagnostic-images-prod` - Blood smear images (encrypted)
- Lifecycle policies for cost optimization
- Cross-region replication for reliability

**Configuration:**
- Images encrypted at rest (AES-256)
- Secure upload with pre-signed URLs
- Automatic image preprocessing via Lambda triggers

### Notification Services
**Twilio (SMS)**
- Critical alerts for positive malaria diagnoses
- Follow-up reminders
- Rate limiting (max 5 per patient/day)

**SendGrid (Email)**
- Account verification
- Password reset tokens
- Weekly/monthly diagnostic reports
- Batch processing for efficiency

## User Preferences & Workflow
- Focus on backend API development for Flutter mobile app integration
- Medical-grade security and WHO health data compliance
- Offline-first architecture for rural clinics
- Field-optimized for low-bandwidth environments

## Recent Changes
- **Oct 22, 2025:** Initial project setup
  - Database schema defined with all relations (users, patients, diagnostics, notifications, password_reset_tokens)
  - Complete backend API implemented with all authentication and CRUD endpoints
  - JWT-based authentication with bcrypt password hashing
  - AWS S3 integration for blood smear image uploads
  - Notification service stubs for Twilio (SMS) and SendGrid (Email)
  - API documentation UI created with professional design
  - Design tokens configured (medical blues/greens for trust/health)
  - All database migrations pushed successfully
  - Fixed: Added updatedAt column to users table for proper profile updates

## Security & Compliance
**Data Encryption:**
- TLS 1.3 for all API communication
- AES-256 for data at rest
- JWT tokens with 24-hour expiry
- Bcrypt password hashing (10 rounds)

**HIPAA Alignment:**
- De-identified patient data (codes instead of names)
- Audit logging for all diagnostic submissions
- Access controls with role-based permissions
- Business associate agreements with third parties

**Privacy:**
- Minimal data collection
- Anonymized analytics
- Optional consent for data sharing with national health systems

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session encryption
- `JWT_SECRET` - JWT token signing (to be added)
- `AWS_ACCESS_KEY_ID` - S3 access (to be added)
- `AWS_SECRET_ACCESS_KEY` - S3 secret (to be added)
- `AWS_REGION` - S3 region (to be added)
- `TWILIO_ACCOUNT_SID` - SMS service (to be added)
- `TWILIO_AUTH_TOKEN` - SMS auth (to be added)
- `SENDGRID_API_KEY` - Email service (to be added)

## Development Workflow
1. Schema-first development (completed)
2. Backend API implementation (in progress)
3. Integration testing
4. Flutter app connection (external)

## Performance Targets
- API response time: <200ms (p95)
- Image upload: Up to 10MB files
- Concurrent users: 500+ health workers
- Uptime SLA: 99.5%

## Key Files
- `shared/schema.ts` - All database models and types
- `server/routes.ts` - API route handlers
- `server/storage.ts` - Database operations
- `server/db.ts` - Database connection
- `client/src/components/ApiDocumentation.tsx` - API docs UI
- `design_guidelines.md` - API design standards

## Next Steps
1. Implement backend routes with authentication
2. Set up AWS S3 integration
3. Configure Twilio and SendGrid connectors
4. Test all API endpoints
5. Deploy and provide Flutter team with API URL
