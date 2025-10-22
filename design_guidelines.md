# Design Guidelines: Introspect Backend API

## Project Context
This is a **backend API infrastructure project** for Introspect, a health diagnostic platform for malaria detection. There is no frontend/UI component - these guidelines focus on API design and data architecture principles.

---

## API Design Approach

**Design System:** RESTful API following healthcare interoperability standards (HL7 FHIR-inspired) with WHO digital health compliance

**Core Principles:**
- Medical-grade reliability and security
- Offline-first data sync capabilities
- Field-optimized for low-bandwidth environments
- HIPAA/WHO health data standards compliance

---

## API Architecture

### Endpoint Structure
```
Base URL: /api/v1/

Authentication:
- POST /auth/register
- POST /auth/login  
- POST /auth/refresh
- POST /auth/forgot-password
- POST /auth/reset-password

User Management:
- GET /users/profile
- PUT /users/profile
- DELETE /users/account

Diagnostics:
- POST /diagnostics/submit (blood smear image upload)
- GET /diagnostics/history
- GET /diagnostics/{id}
- PUT /diagnostics/{id}/review

Patients:
- POST /patients
- GET /patients
- GET /patients/{id}
- PUT /patients/{id}

Notifications:
- POST /notifications/send
- GET /notifications/history
- PUT /notifications/{id}/status

System:
- GET /health
- GET /status
```

### Response Format
**Standardized JSON Structure:**
```
Success: { success: true, data: {...}, timestamp: ISO8601 }
Error: { success: false, error: { code, message, details }, timestamp: ISO8601 }
```

### Authentication Strategy
- JWT tokens with 24-hour expiry
- Refresh tokens for 30-day sessions
- Role-based access (health_worker, admin, super_admin)
- Device fingerprinting for security

---

## Data Schema Principles

### User Table
- Encrypted PII (names, contacts)
- Role-based permissions
- Facility assignment tracking
- Last login/activity timestamps

### Diagnostic Results
- Anonymized patient linkage
- Image storage in S3 (encrypted at rest)
- AI confidence scores
- Review/verification workflow states
- Geolocation (district level only for privacy)

### Notification Log
- Delivery status tracking
- Retry mechanisms for failed sends
- Template-based messaging
- Priority levels (urgent/routine)

---

## AWS Integration Specifications

**S3 Buckets:**
- `introspect-diagnostic-images-prod` (encrypted, lifecycle policies)
- `introspect-backups` (cross-region replication)

**Services:**
- **Cognito:** User pool management (optional alternative to custom JWT)
- **SES:** Email notifications (verification, results)
- **SNS:** SMS alerts for critical diagnoses
- **RDS PostgreSQL:** Primary database with read replicas
- **Lambda:** Image preprocessing and AI inference triggers
- **API Gateway:** Rate limiting and request throttling

---

## Security & Compliance

**Data Encryption:**
- TLS 1.3 for all API communication
- AES-256 encryption at rest for PII and diagnostic images
- Encrypted backups with 7-year retention

**Audit Logging:**
- All diagnostic submissions logged with timestamps
- User actions tracked for compliance
- Failed authentication attempts monitored

**HIPAA Alignment:**
- De-identification of patient data in analytics
- Access controls with minimum necessary principle
- Business associate agreements with third-party services

---

## Notification Strategy

**Email (SendGrid):**
- Account verification
- Password reset tokens
- Weekly diagnostic summaries for health workers
- Monthly reports for facility managers

**SMS (Twilio):**
- Positive malaria detection alerts
- Critical patient follow-up reminders
- System downtime notifications

**Rate Limiting:**
- Max 5 SMS per patient per day
- Email batching for non-urgent communications

---

## Performance Targets

- API response time: <200ms (p95)
- Image upload: Support up to 10MB files
- Concurrent users: 500+ health workers
- Offline sync: Queue up to 100 diagnostic submissions
- Uptime SLA: 99.5% (allowing for maintenance windows)

---

## Documentation Standards

**OpenAPI 3.0 Specification:**
- Interactive Swagger UI at `/api/docs`
- Example requests/responses for all endpoints
- Authentication flow diagrams
- Error code reference guide

This backend will serve as the foundation for the Flutter mobile app, web dashboard, and future integrations with national health information systems.