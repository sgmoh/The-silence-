import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { tokenSubmissionSchema, dmMessageSchema, bulkDmSchema } from "@shared/schema";
import { Client, GatewayIntentBits, Collection } from "discord.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Handle token submission
  app.post("/api/token", async (req, res) => {
    try {
      const validation = tokenSubmissionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid token format",
          errors: validation.error.flatten().fieldErrors 
        });
      }
      
      const { botToken, clientId } = validation.data;
      
      // Store token submission
      const submission = await storage.saveTokenSubmission({
        botToken,
        clientId: clientId || null,
        timestamp: new Date()
      });
      
      return res.status(200).json({ 
        success: true,
        message: "Token received successfully",
        id: submission.id
      });
    } catch (error) {
      console.error("Error processing token:", error);
      return res.status(500).json({ 
        message: "Failed to process token submission" 
      });
    }
  });

  // Send direct message to a user
  app.post("/api/dm/send", async (req, res) => {
    try {
      const validation = dmMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid message format",
          errors: validation.error.flatten().fieldErrors 
        });
      }
      
      const { token, userId, message } = validation.data;
      
      // Create a new Discord client
      const client = new Client({
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages
        ]
      });
      
      try {
        // Log in to Discord
        await client.login(token);
        
        // Fetch the user and send the message
        const user = await client.users.fetch(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        
        const dmChannel = await user.createDM();
        await dmChannel.send(message);
        
        // Destroy the client after sending the message
        client.destroy();
        
        return res.status(200).json({ 
          success: true,
          message: `Message sent to user ${userId}`,
        });
      } catch (discordError: any) {
        console.error("Discord API error:", discordError);
        // Ensure client is destroyed in case of error
        client.destroy();
        
        return res.status(400).json({ 
          success: false,
          message: `Failed to send message: ${discordError.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Error sending DM:", error);
      return res.status(500).json({ 
        message: "Failed to send direct message" 
      });
    }
  });

  // Get available guild members for a bot
  app.post("/api/guild/members", async (req, res) => {
    try {
      const { token, guildId } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      if (!guildId) {
        return res.status(400).json({ message: "Guild ID is required" });
      }
      
      // Create a new Discord client
      const client = new Client({
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages
        ]
      });
      
      try {
        // Log in to Discord
        await client.login(token);
        
        // Fetch the guild
        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
          client.destroy();
          return res.status(404).json({ 
            success: false,
            message: `Guild with ID ${guildId} not found` 
          });
        }
        
        // Fetch members
        await guild.members.fetch();
        
        // Extract member data
        const members = guild.members.cache.map(member => ({
          id: member.id,
          username: member.user.username,
          displayName: member.displayName,
          avatarUrl: member.user.displayAvatarURL({ size: 64 })
        }));
        
        // Destroy the client after fetching members
        client.destroy();
        
        return res.status(200).json({ 
          success: true,
          members
        });
      } catch (discordError: any) {
        console.error("Discord API error:", discordError);
        // Ensure client is destroyed in case of error
        client.destroy();
        
        return res.status(400).json({ 
          success: false,
          message: `Failed to fetch guild members: ${discordError.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Error fetching guild members:", error);
      return res.status(500).json({ 
        message: "Failed to fetch guild members" 
      });
    }
  });

  // Get guilds available to the bot
  app.post("/api/guilds", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Create a new Discord client with all necessary intents
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });
      
      try {
        // Log in to Discord
        await client.login(token);
        
        // Fetch all guilds the bot is in
        const guilds = client.guilds.cache.map(guild => ({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          iconUrl: guild.iconURL({ size: 64 })
        }));
        
        // Destroy the client after fetching guilds
        client.destroy();
        
        return res.status(200).json({ 
          success: true,
          guilds
        });
      } catch (discordError: any) {
        console.error("Discord API error:", discordError);
        // Ensure client is destroyed in case of error
        client.destroy();
        
        return res.status(400).json({ 
          success: false,
          message: `Failed to fetch guilds: ${discordError.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Error fetching guilds:", error);
      return res.status(500).json({ 
        message: "Failed to fetch guilds" 
      });
    }
  });
  
  // Send bulk DMs to multiple users
  app.post("/api/dm/bulk", async (req, res) => {
    try {
      const validation = bulkDmSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid bulk message format",
          errors: validation.error.flatten().fieldErrors 
        });
      }
      
      const { token, userIds, message, selectAll, guildId, delay } = validation.data;
      
      // Create a new Discord client
      const client = new Client({
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });
      
      try {
        // Log in to Discord
        await client.login(token);
        
        // Track successful and failed messages
        const results = {
          success: 0,
          failed: 0,
          failedIds: [] as string[]
        };
        
        // If selectAll and guildId are provided, fetch all guild members
        let targetUserIds = [...userIds];
        
        if (selectAll && guildId) {
          try {
            const guild = await client.guilds.fetch(guildId);
            await guild.members.fetch();
            
            // Add all guild member IDs to the target list
            guild.members.cache.forEach(member => {
              if (!member.user.bot && !targetUserIds.includes(member.id)) {
                targetUserIds.push(member.id);
              }
            });
          } catch (guildError) {
            console.error("Error fetching guild members:", guildError);
          }
        }
        
        // Send messages to each user with delay if specified
        for (const userId of targetUserIds) {
          try {
            const user = await client.users.fetch(userId);
            if (!user) {
              results.failed++;
              results.failedIds.push(userId);
              continue;
            }
            
            // Don't DM bots
            if (user.bot) {
              continue;
            }
            
            const dmChannel = await user.createDM();
            await dmChannel.send(message);
            results.success++;
            
            // Add delay between messages if specified
            if (delay && delay > 0 && userId !== targetUserIds[targetUserIds.length - 1]) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (userError) {
            console.error(`Error sending message to user ${userId}:`, userError);
            results.failed++;
            results.failedIds.push(userId);
          }
        }
        
        // Destroy the client after sending all messages
        client.destroy();
        
        return res.status(200).json({ 
          success: true,
          message: `Sent ${results.success} messages, failed ${results.failed} messages`,
          sentCount: results.success,
          failedCount: results.failed,
          failedIds: results.failedIds
        });
      } catch (discordError: any) {
        console.error("Discord API error:", discordError);
        // Ensure client is destroyed in case of error
        client.destroy();
        
        return res.status(400).json({ 
          success: false,
          message: `Failed to send bulk messages: ${discordError.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Error sending bulk DMs:", error);
      return res.status(500).json({ 
        message: "Failed to send bulk messages" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
