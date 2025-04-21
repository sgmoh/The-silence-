import { 
  users, 
  tokenSubmissions, 
  messageReplies,
  type User, 
  type InsertUser, 
  type InsertTokenSubmission, 
  type TokenSubmission,
  type MessageReply,
  type InsertMessageReply 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveTokenSubmission(submission: InsertTokenSubmission): Promise<{ id: number }>;
  saveMessageReply(reply: InsertMessageReply): Promise<MessageReply>;
  getMessageReplies(): Promise<MessageReply[]>;
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

  async saveMessageReply(reply: InsertMessageReply): Promise<MessageReply> {
    const [result] = await db
      .insert(messageReplies)
      .values({
        userId: reply.userId,
        username: reply.username,
        content: reply.content,
        messageId: reply.messageId,
        timestamp: reply.timestamp,
        avatarUrl: reply.avatarUrl || null,
        guildId: reply.guildId || null,
        guildName: reply.guildName || null
      })
      .returning();
    return result;
  }

  async getMessageReplies(): Promise<MessageReply[]> {
    return db.select().from(messageReplies).orderBy(desc(messageReplies.timestamp));
  }
}

// Fallback to in-memory storage if database connection fails
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokenSubmissions: Map<number, TokenSubmission>;
  private messageRepliesData: Map<number, MessageReply>;
  currentId: number;
  tokenSubmissionId: number;
  messageReplyId: number;

  constructor() {
    this.users = new Map();
    this.tokenSubmissions = new Map();
    this.messageRepliesData = new Map();
    this.currentId = 1;
    this.tokenSubmissionId = 1;
    this.messageReplyId = 1;
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

  async saveMessageReply(reply: InsertMessageReply): Promise<MessageReply> {
    const id = this.messageReplyId++;
    const messageReply: MessageReply = {
      id,
      userId: reply.userId,
      username: reply.username,
      content: reply.content,
      messageId: reply.messageId,
      timestamp: reply.timestamp,
      avatarUrl: reply.avatarUrl || null,
      guildId: reply.guildId || null,
      guildName: reply.guildName || null
    };
    this.messageRepliesData.set(id, messageReply);
    return messageReply;
  }

  async getMessageReplies(): Promise<MessageReply[]> {
    return Array.from(this.messageRepliesData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
