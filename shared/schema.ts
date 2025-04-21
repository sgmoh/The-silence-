import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Token submission schema
export const tokenSubmissions = pgTable("token_submissions", {
  id: serial("id").primaryKey(),
  botToken: text("bot_token").notNull(),
  clientId: text("client_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Message replies model
export const messageReplies = pgTable("message_replies", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  messageId: text("message_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  avatarUrl: text("avatar_url"),
  guildId: text("guild_id"),
  guildName: text("guild_name"),
});

export const tokenSubmissionSchema = z.object({
  botToken: z.string().min(1, { message: "Bot token is required" }),
  clientId: z.string().optional().nullable(),
});

// DM message schema
export const dmMessageSchema = z.object({
  token: z.string().min(1, { message: "Bot token is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  message: z.string().min(1, { message: "Message is required" }),
});

export const bulkDmSchema = z.object({
  token: z.string().min(1, { message: "Bot token is required" }),
  userIds: z.array(z.string()).min(0),
  message: z.string().min(1, { message: "Message is required" }),
  selectAll: z.boolean().optional(),
  delay: z.number().min(0).max(10000).optional(),
});

// Message reply schema
export const messageReplySchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  content: z.string().min(1, { message: "Message content is required" }),
  messageId: z.string().min(1, { message: "Message ID is required" }),
  avatarUrl: z.string().optional(),
  guildId: z.string().optional(),
  guildName: z.string().optional(),
});

export type GuildMember = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

export type TokenSubmission = typeof tokenSubmissions.$inferSelect;
export type InsertTokenSubmission = z.infer<typeof tokenSubmissionSchema> & { 
  timestamp: Date 
};

export type MessageReply = typeof messageReplies.$inferSelect;
export type InsertMessageReply = z.infer<typeof messageReplySchema> & {
  timestamp: Date
};
