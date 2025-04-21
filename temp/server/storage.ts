import { users, type User, type InsertUser, type InsertTokenSubmission, type TokenSubmission } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveTokenSubmission(submission: InsertTokenSubmission): Promise<{ id: number }>;
}

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

export const storage = new MemStorage();
