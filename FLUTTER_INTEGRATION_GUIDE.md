# Flutter App Integration Guide

## Overview
This document provides comprehensive instructions for integrating your Flutter mobile app with the Introspect backend API.

## Base URL
**Development:** `http://localhost:5000` (when running locally)  
**Production:** `https://your-replit-deployment.replit.app`

## Authentication Flow

### 1. User Registration
```dart
// POST /api/auth/register
final response = await http.post(
  Uri.parse('$baseUrl/api/auth/register'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'nurse@clinic.bw',
    'password': 'SecurePass123!',
    'fullName': 'Thato Molosiwa',
    'role': 'health_worker',
    'phoneNumber': '+26771234567',
    'facilityName': 'Okavango District Clinic',
    'district': 'Okavango'
  }),
);

if (response.statusCode == 201) {
  final data = jsonDecode(response.body);
  String token = data['data']['token'];
  // Save token securely using flutter_secure_storage
}
```

### 2. User Login
```dart
// POST /api/auth/login
final response = await http.post(
  Uri.parse('$baseUrl/api/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'nurse@clinic.bw',
    'password': 'SecurePass123!'
  }),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  String token = data['data']['token'];
  // Save token for subsequent requests
}
```

### 3. Authenticated Requests
All protected endpoints require the JWT token in the Authorization header:

```dart
final response = await http.get(
  Uri.parse('$baseUrl/api/users/profile'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
);
```

### 4. Password Reset Flow
```dart
// Step 1: Request reset token
await http.post(
  Uri.parse('$baseUrl/api/auth/forgot-password'),
  body: jsonEncode({'email': 'nurse@clinic.bw'}),
);

// Step 2: User receives email with token, then resets password
await http.post(
  Uri.parse('$baseUrl/api/auth/reset-password'),
  body: jsonEncode({
    'token': 'reset-token-from-email',
    'newPassword': 'NewSecurePass123!'
  }),
);
```

## Patient Management

### Create Patient
```dart
final response = await http.post(
  Uri.parse('$baseUrl/api/patients'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'patientCode': 'P2026-0042',
    'age': 5,
    'gender': 'male',
    'district': 'Ngami',
    'facilityName': 'Ngami Health Post'
  }),
);
```

### Get Patient List
```dart
// With optional filters
final response = await http.get(
  Uri.parse('$baseUrl/api/patients?district=Okavango&limit=20'),
  headers: {'Authorization': 'Bearer $token'},
);
```

## Diagnostic Submission

### Upload Blood Smear Image
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> submitDiagnostic(File imageFile, String patientId) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('$baseUrl/api/diagnostics/submit'),
  );
  
  request.headers['Authorization'] = 'Bearer $token';
  
  // Add image file
  request.files.add(
    await http.MultipartFile.fromPath('image', imageFile.path),
  );
  
  // Add other fields
  request.fields['patientId'] = patientId;
  request.fields['result'] = 'positive'; // From AI analysis
  request.fields['parasiteCount'] = '1250';
  request.fields['aiConfidenceScore'] = '94';
  request.fields['symptoms'] = jsonEncode(['fever', 'chills', 'headache']);
  
  final response = await request.send();
  
  if (response.statusCode == 201) {
    final responseData = await response.stream.bytesToString();
    final data = jsonDecode(responseData);
    print('Diagnostic submitted: ${data['data']['id']}');
  }
}
```

### Get Diagnostic History
```dart
final response = await http.get(
  Uri.parse('$baseUrl/api/diagnostics/history?limit=50'),
  headers: {'Authorization': 'Bearer $token'},
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  List diagnostics = data['data'];
  // Display in UI
}
```

## Notifications

### Send Notification
```dart
// Send SMS notification for positive result
await http.post(
  Uri.parse('$baseUrl/api/notifications/send'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'type': 'sms',
    'recipient': '+26771234567',
    'message': 'Malaria test result: POSITIVE. Patient P2026-0042. Please initiate treatment protocol.',
    'priority': 'urgent',
    'diagnosticId': 'diagnostic-uuid'
  }),
);
```

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-08-07T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  },
  "timestamp": "2026-08-07T10:30:00Z"
}
```

### Common Error Codes
- `UNAUTHORIZED` (401) - Missing or invalid token
- `FORBIDDEN` (403) - Insufficient permissions
- `VALIDATION_ERROR` (400) - Invalid request data
- `USER_EXISTS` (400) - Email already registered
- `INVALID_CREDENTIALS` (401) - Wrong email/password
- `NOT_FOUND` (404) - Resource not found
- `SERVER_ERROR` (500) - Internal server error

## Token Management

### Storing Tokens Securely
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Save token
await storage.write(key: 'auth_token', value: token);

// Read token
String? token = await storage.read(key: 'auth_token');

// Delete token on logout
await storage.delete(key: 'auth_token');
```

### Token Expiry
- JWT tokens expire after 24 hours
- Check for 401 responses and prompt user to re-login
- Recommended: Implement automatic re-authentication when token expires

## Environment Configuration

Create different configurations for development and production:

```dart
class ApiConfig {
  static const String devBaseUrl = 'http://localhost:5000';
  static const String prodBaseUrl = 'https://your-deployment.replit.app';
  
  static String get baseUrl {
    return const bool.fromEnvironment('dart.vm.product')
      ? prodBaseUrl
      : devBaseUrl;
  }
}
```

## Testing Checklist

Before production deployment, test these scenarios:

- [ ] User registration with all fields
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (verify error handling)
- [ ] Password reset flow
- [ ] Create patient record
- [ ] Upload diagnostic image (test with 1MB, 5MB, 10MB files)
- [ ] View diagnostic history
- [ ] Send notifications
- [ ] Profile update
- [ ] Token expiry handling
- [ ] Network error handling
- [ ] Offline data persistence

## AWS S3 Integration

The backend automatically uploads diagnostic images to AWS S3. You don't need to handle S3 directly - just send the image file to `/api/diagnostics/submit` and the backend will:
1. Upload to S3 with encryption
2. Return the S3 URL in the response
3. Store the URL in the database

## Notification Services

### Current Status
The notification endpoints are implemented and ready to use. When you call `/api/notifications/send`, the backend:
- Logs the notification intent
- Stores the notification in the database
- Returns success status

### Production Setup (To Be Configured)
For production deployment, the backend supports:
- **Twilio** for SMS notifications
- **SendGrid** for email notifications

These will be activated when the administrator configures the environment variables. Your Flutter app code doesn't change - the same API endpoints will work automatically.

## Support & Documentation

- **API Documentation UI:** Visit the root URL (`/`) to see interactive API documentation
- **Health Check:** `GET /api/health` - Verify API is running
- **API Status:** `GET /api/status` - Check API version and configuration status

## Sample Flutter Packages

Recommended packages for integration:
```yaml
dependencies:
  http: ^1.1.0
  flutter_secure_storage: ^9.0.0
  image_picker: ^1.0.4
  provider: ^6.1.1  # For state management
  dio: ^5.4.0  # Alternative to http with better features
```

## Complete Example: Diagnostic Submission Flow

```dart
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class DiagnosticSubmissionScreen extends StatefulWidget {
  @override
  _DiagnosticSubmissionScreenState createState() => _DiagnosticSubmissionScreenState();
}

class _DiagnosticSubmissionScreenState extends State<DiagnosticSubmissionScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  String? _patientId;
  bool _isSubmitting = false;

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }

  Future<void> _submitDiagnostic() async {
    if (_selectedImage == null || _patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select an image and patient')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/diagnostics/submit'),
      );

      String? token = await storage.read(key: 'auth_token');
      request.headers['Authorization'] = 'Bearer $token';

      request.files.add(
        await http.MultipartFile.fromPath('image', _selectedImage!.path),
      );

      request.fields['patientId'] = _patientId!;
      request.fields['result'] = 'positive'; // From AI analysis
      request.fields['parasiteCount'] = '1250';
      request.fields['aiConfidenceScore'] = '94';
      request.fields['symptoms'] = jsonEncode(['fever', 'chills']);

      final response = await request.send();
      final responseData = await response.stream.bytesToString();

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Diagnostic submitted successfully!')),
        );
        Navigator.pop(context);
      } else {
        final error = jsonDecode(responseData);
        throw Exception(error['error']['message']);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Submit Diagnostic')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_selectedImage != null)
              Image.file(_selectedImage!, height: 200),
            ElevatedButton(
              onPressed: _pickImage,
              child: Text('Capture Blood Smear'),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitDiagnostic,
              child: _isSubmitting
                  ? CircularProgressIndicator()
                  : Text('Submit Diagnostic'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Next Steps

1. Clone this backend repository or note the deployment URL
2. Set up your Flutter project with required packages
3. Implement authentication flows
4. Build patient and diagnostic management UIs
5. Test thoroughly with the development API
6. Deploy to production and update `prodBaseUrl`

## Questions or Issues?

If you encounter any issues or have questions:
1. Check the API documentation UI at the root URL (`/`)
2. Review the response error codes and messages
3. Verify your JWT token is valid and not expired
4. Check network connectivity and base URL configuration
