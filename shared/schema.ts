import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - health workers, administrators, MoH officials
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("health_worker"), // health_worker, admin, super_admin
  phoneNumber: text("phone_number"),
  facilityName: text("facility_name"),
  district: text("district"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Patients table - anonymized patient records
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientCode: text("patient_code").notNull().unique(), // Anonymized identifier
  age: integer("age"),
  gender: text("gender"), // male, female, other
  district: text("district"),
  facilityName: text("facility_name"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Diagnostic results table
export const diagnostics = pgTable("diagnostics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  submittedById: varchar("submitted_by_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(), // S3 URL for blood smear image
  result: text("result").notNull(), // positive, negative, inconclusive
  parasiteCount: integer("parasite_count"), // Number of parasites detected
  aiConfidenceScore: integer("ai_confidence_score"), // 0-100
  reviewStatus: text("review_status").notNull().default("pending"), // pending, reviewed, verified
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  symptoms: jsonb("symptoms"), // Array of symptoms reported
  testDate: timestamp("test_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table - SMS and Email notification logs
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  diagnosticId: varchar("diagnostic_id").references(() => diagnostics.id),
  type: text("type").notNull(), // sms, email
  recipient: text("recipient").notNull(), // phone number or email
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  priority: text("priority").notNull().default("routine"), // urgent, routine
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients),
  diagnosticsSubmitted: many(diagnostics, { relationName: "submitted_diagnostics" }),
  diagnosticsReviewed: many(diagnostics, { relationName: "reviewed_diagnostics" }),
  notifications: many(notifications),
  passwordResetTokens: many(passwordResetTokens),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [patients.createdById],
    references: [users.id],
  }),
  diagnostics: many(diagnostics),
}));

export const diagnosticsRelations = relations(diagnostics, ({ one }) => ({
  patient: one(patients, {
    fields: [diagnostics.patientId],
    references: [patients.id],
  }),
  submittedBy: one(users, {
    fields: [diagnostics.submittedById],
    references: [users.id],
    relationName: "submitted_diagnostics",
  }),
  reviewedBy: one(users, {
    fields: [diagnostics.reviewedById],
    references: [users.id],
    relationName: "reviewed_diagnostics",
  }),
  notifications: one(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  diagnostic: one(diagnostics, {
    fields: [notifications.diagnosticId],
    references: [diagnostics.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiagnosticSchema = createInsertSchema(diagnostics).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewStatus: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  status: true,
  retryCount: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Diagnostic = typeof diagnostics.$inferSelect;
export type InsertDiagnostic = z.infer<typeof insertDiagnosticSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Auth schemas for API validation
export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["health_worker", "admin", "super_admin"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  facilityName: z.string().optional(),
  district: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
