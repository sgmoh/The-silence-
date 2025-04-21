import { users, tokenSubmissions, type User, type InsertUser, type InsertTokenSubmission, type TokenSubmission } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveTokenSubmission(submission: InsertTokenSubmission): Promise<{ id: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async saveTokenSubmission(submission: InsertTokenSubmission): Promise<{ id: number }> {
    const [result] = await db
      .insert(tokenSubmissions)
      .values({
        botToken: submission.botToken,
        clientId: submission.clientId || null,
        timestamp: submission.timestamp
      })
      .returning({ id: tokenSubmissions.id });
    return result;
  }
}

// Fallback to in-memory storage if database connection fails
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokenSubmissions: Map<number, TokenSubmission>;
  currentId: number;
  tokenSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.tokenSubmissions = new Map();
    this.currentId = 1;
    this.tokenSubmissionId = 1;
    console.warn("Using in-memory storage. Data will be lost on restart!");
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveTokenSubmission(submission: InsertTokenSubmission): Promise<{ id: number }> {
    const id = this.tokenSubmissionId++;
    const tokenSubmission: TokenSubmission = { 
      id, 
      botToken: submission.botToken,
      clientId: submission.clientId || null,
      timestamp: submission.timestamp
    };
    this.tokenSubmissions.set(id, tokenSubmission);
    return { id };
  }
}

// Use DatabaseStorage by default, with fallback to MemStorage if there's an error
let storage: IStorage;

try {
  storage = new DatabaseStorage();
  console.log("Using database storage");
} catch (error) {
  console.error("Failed to initialize database storage:", error);
  storage = new MemStorage();
}

export { storage };
