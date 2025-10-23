import { 
  users, 
  patients, 
  diagnostics, 
  notifications,
  passwordResetTokens,
  type User, 
  type InsertUser,
  type Patient,
  type InsertPatient,
  type Diagnostic,
  type InsertDiagnostic,
  type Notification,
  type InsertNotification,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type UpdateProfileInput
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and, sql } from "drizzle-orm";


export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpdateProfileInput>): Promise<User | undefined>;
  updateLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(filters?: { district?: string; limit?: number }): Promise<Patient[]>;
  getPatientByCode(code: string): Promise<Patient | undefined>;
  updatePatient(id: string, data: Partial<InsertPatient>): Promise<Patient | undefined>;

  // Diagnostic operations
  createDiagnostic(diagnostic: InsertDiagnostic): Promise<Diagnostic>;
  getDiagnostic(id: string): Promise<Diagnostic | undefined>;
  getDiagnostics(filters?: { patientId?: string; result?: string; limit?: number }): Promise<Diagnostic[]>;
  updateDiagnosticReview(id: string, reviewedById: string, reviewStatus: string, reviewNotes?: string): Promise<Diagnostic | undefined>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(filters?: { type?: string; status?: string; limit?: number }): Promise<Notification[]>;
  updateNotificationStatus(id: string, status: string, errorMessage?: string): Promise<Notification | undefined>;

  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpdateProfileInput>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Patient operations
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatients(filters?: { district?: string; limit?: number }): Promise<Patient[]> {
    let query = db.select().from(patients);
    
    if (filters?.district) {
      query = query.where(eq(patients.district, filters.district)) as any;
    }
    
    query = query.orderBy(desc(patients.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    } else {
      query = query.limit(20) as any;
    }
    
    return await query;
  }

  async getPatientByCode(code: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientCode, code));
    return patient || undefined;
  }

  async updatePatient(id: string, data: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  // Diagnostic operations
  async createDiagnostic(insertDiagnostic: InsertDiagnostic): Promise<Diagnostic> {
    const [diagnostic] = await db
      .insert(diagnostics)
      .values(insertDiagnostic)
      .returning();
    return diagnostic;
  }

  async getDiagnostic(id: string): Promise<Diagnostic | undefined> {
    const [diagnostic] = await db.select().from(diagnostics).where(eq(diagnostics.id, id));
    return diagnostic || undefined;
  }

  async getDiagnostics(filters?: { patientId?: string; result?: string; limit?: number }): Promise<Diagnostic[]> {
    let query = db.select().from(diagnostics);
    
    const conditions = [];
    if (filters?.patientId) {
      conditions.push(eq(diagnostics.patientId, filters.patientId));
    }
    if (filters?.result) {
      conditions.push(eq(diagnostics.result, filters.result));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(diagnostics.testDate)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    } else {
      query = query.limit(20) as any;
    }
    
    return await query;
  }

  async updateDiagnosticReview(
    id: string, 
    reviewedById: string, 
    reviewStatus: string, 
    reviewNotes?: string
  ): Promise<Diagnostic | undefined> {
    const [diagnostic] = await db
      .update(diagnostics)
      .set({
        reviewStatus,
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      })
      .where(eq(diagnostics.id, id))
      .returning();
    return diagnostic || undefined;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotifications(filters?: { type?: string; status?: string; limit?: number }): Promise<Notification[]> {
    let query = db.select().from(notifications);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(notifications.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(notifications.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    } else {
      query = query.limit(20) as any;
    }
    
    return await query;
  }

  async updateNotificationStatus(id: string, status: string, errorMessage?: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({
        status,
        sentAt: status === 'sent' ? new Date() : null,
        errorMessage: errorMessage || null,
        retryCount: status === 'failed' ? sql`retry_count + 1` : sql`retry_count`,
      } as any)
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  // Password reset operations
  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markTokenAsUsed(id: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }
}

export const storage = new DatabaseStorage();
