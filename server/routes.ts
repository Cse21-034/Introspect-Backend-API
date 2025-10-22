import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  authMiddleware, 
  requireRole,
  type AuthRequest 
} from "./auth";
import { uploadImageToS3, isS3Configured } from "./s3";
import multer from "multer";
import { nanoid } from "nanoid";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  insertPatientSchema,
  insertDiagnosticSchema,
  insertNotificationSchema,
} from "@shared/schema";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTHENTICATION ROUTES ====================
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);

      // Return user (without password) and token
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Verify password
      const isValid = await verifyPassword(validatedData.password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user);

      // Return user (without password) and token
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          success: true,
          data: {
            message: "If an account exists with that email, password reset instructions have been sent",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
      });

      // TODO: Send email with reset token using SendGrid
      // For now, return success (in production, would send email)
      
      res.json({
        success: true,
        data: {
          message: "Password reset instructions sent to your email",
          // In dev mode only - remove in production
          ...(process.env.NODE_ENV === 'development' && { resetToken }),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      const resetToken = await storage.getPasswordResetToken(validatedData.token);
      if (!resetToken || resetToken.usedAt) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired reset token",
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Reset token has expired",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword);

      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword } as any);

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({
        success: true,
        data: {
          message: "Password successfully reset",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==================== USER ROUTES ====================

  // Get current user profile
  app.get("/api/users/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { password, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: userWithoutPassword,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch user profile",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Update user profile
  app.put("/api/users/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      
      const user = await storage.updateUser(req.user!.id, validatedData);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { password, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: userWithoutPassword,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Delete user account
  app.delete("/api/users/account", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteUser(req.user!.id);
      
      res.json({
        success: true,
        data: {
          message: "Account successfully deleted",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to delete account",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==================== PATIENT ROUTES ====================

  // Create patient
  app.post("/api/patients", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPatientSchema.parse({
        ...req.body,
        createdById: req.user!.id,
      });

      // Check if patient code already exists
      const existingPatient = await storage.getPatientByCode(validatedData.patientCode);
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          error: {
            code: "PATIENT_EXISTS",
            message: "Patient with this code already exists",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const patient = await storage.createPatient(validatedData);
      
      res.status(201).json({
        success: true,
        data: patient,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get patients list
  app.get("/api/patients", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { district, limit } = req.query;
      
      const patients = await storage.getPatients({
        district: district as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({
        success: true,
        data: patients,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch patients",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get patient by ID
  app.get("/api/patients/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Patient not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Get patient's diagnostics
      const diagnostics = await storage.getDiagnostics({ patientId: patient.id });
      
      res.json({
        success: true,
        data: {
          ...patient,
          diagnostics,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch patient",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Update patient
  app.put("/api/patients/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Patient not found",
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({
        success: true,
        data: patient,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==================== DIAGNOSTIC ROUTES ====================

  // Submit diagnostic
  app.post("/api/diagnostics/submit", authMiddleware, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_IMAGE",
            message: "Blood smear image is required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      let imageUrl: string;
      
      if (isS3Configured()) {
        // Upload to S3
        imageUrl = await uploadImageToS3(req.file.buffer, req.file.originalname, req.user!.id);
      } else {
        // Fallback for development - use placeholder
        imageUrl = `http://localhost:5000/uploads/${nanoid()}_${req.file.originalname}`;
      }

      // Parse request body
      const diagnosticData = {
        patientId: req.body.patientId,
        submittedById: req.user!.id,
        imageUrl,
        result: req.body.result || 'pending',
        parasiteCount: req.body.parasiteCount ? parseInt(req.body.parasiteCount) : null,
        aiConfidenceScore: req.body.aiConfidenceScore ? parseInt(req.body.aiConfidenceScore) : null,
        symptoms: req.body.symptoms ? JSON.parse(req.body.symptoms) : null,
        testDate: req.body.testDate || new Date().toISOString(),
      };

      const validatedData = insertDiagnosticSchema.parse(diagnosticData);
      const diagnostic = await storage.createDiagnostic(validatedData);
      
      res.status(201).json({
        success: true,
        data: diagnostic,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get diagnostic history
  app.get("/api/diagnostics/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { patientId, result, limit } = req.query;
      
      const diagnostics = await storage.getDiagnostics({
        patientId: patientId as string | undefined,
        result: result as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({
        success: true,
        data: diagnostics,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch diagnostics",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get diagnostic by ID
  app.get("/api/diagnostics/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const diagnostic = await storage.getDiagnostic(req.params.id);
      if (!diagnostic) {
        return res.status(404).json({
          success: false,
          error: {
            code: "DIAGNOSTIC_NOT_FOUND",
            message: "Diagnostic not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Get patient info
      const patient = await storage.getPatient(diagnostic.patientId);
      
      res.json({
        success: true,
        data: {
          ...diagnostic,
          patient: patient ? {
            patientCode: patient.patientCode,
            age: patient.age,
            gender: patient.gender,
            district: patient.district,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch diagnostic",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Update diagnostic review (admin only)
  app.put("/api/diagnostics/:id/review", authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
    try {
      const { reviewStatus, reviewNotes } = req.body;

      if (!reviewStatus) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_STATUS",
            message: "Review status is required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const diagnostic = await storage.updateDiagnosticReview(
        req.params.id,
        req.user!.id,
        reviewStatus,
        reviewNotes
      );

      if (!diagnostic) {
        return res.status(404).json({
          success: false,
          error: {
            code: "DIAGNOSTIC_NOT_FOUND",
            message: "Diagnostic not found",
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({
        success: true,
        data: diagnostic,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==================== NOTIFICATION ROUTES ====================

  // Send notification
  app.post("/api/notifications/send", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const notification = await storage.createNotification(validatedData);

      // TODO: Actually send the notification via Twilio/SendGrid
      // For now, just create the record
      
      res.status(201).json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get notification history
  app.get("/api/notifications/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { type, status, limit } = req.query;
      
      const notifications = await storage.getNotifications({
        type: type as string | undefined,
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({
        success: true,
        data: notifications,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch notifications",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Update notification status
  app.put("/api/notifications/:id/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { status, errorMessage } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_STATUS",
            message: "Status is required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const notification = await storage.updateNotificationStatus(
        req.params.id,
        status,
        errorMessage
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Invalid request data",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==================== SYSTEM ROUTES ====================

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API status
  app.get("/api/status", (req, res) => {
    res.json({
      success: true,
      data: {
        version: "1.0.0",
        name: "Introspect API",
        description: "AI-powered malaria diagnostic platform",
        status: "operational",
        s3Configured: isS3Configured(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
