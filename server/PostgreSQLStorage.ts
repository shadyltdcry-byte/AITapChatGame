import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import {
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type Upgrade,
  type InsertUpgrade,
  type GameStats,
  type InsertGameStats,
  type ChatMessage,
  type InsertChatMessage,
  type GameSettings,
  type InsertGameSettings,
  type MediaFile,
  type WheelReward,
  type UserCharacter
} from "@shared/schema";
import type { IStorage } from './storage';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class PostgreSQLStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    const result = await db.select().from(schema.characters).where(eq(schema.characters.id, id)).limit(1);
    return result[0];
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    const result = await db.select().from(schema.characters).where(eq(schema.characters.userId, userId));
    return result;
  }

  async getAllCharacters(): Promise<Character[]> {
    const result = await db.select().from(schema.characters);
    return result;
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    const userCharacter = await db.select()
      .from(schema.userCharacters)
      .where(and(eq(schema.userCharacters.userId, userId), eq(schema.userCharacters.isSelected, true)))
      .limit(1);
    
    if (userCharacter[0]) {
      const character = await this.getCharacter(userCharacter[0].characterId);
      return character;
    }
    return undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const result = await db.insert(schema.characters).values(character).returning();
    return result[0];
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const result = await db.update(schema.characters).set(updates).where(eq(schema.characters.id, id)).returning();
    return result[0];
  }

  async deleteCharacter(id: string): Promise<void> {
    await db.delete(schema.characters).where(eq(schema.characters.id, id));
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    // First deselect all characters for this user
    await db.update(schema.userCharacters)
      .set({ isSelected: false })
      .where(eq(schema.userCharacters.userId, userId));
    
    // Then select the specified character
    await db.update(schema.userCharacters)
      .set({ isSelected: true })
      .where(and(eq(schema.userCharacters.userId, userId), eq(schema.userCharacters.characterId, characterId)));
  }

  // Upgrade management
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const result = await db.select().from(schema.upgrades).where(eq(schema.upgrades.id, id)).limit(1);
    return result[0];
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    const result = await db.select().from(schema.upgrades).where(eq(schema.upgrades.userId, userId));
    return result;
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const result = await db.insert(schema.upgrades).values(upgrade).returning();
    return result[0];
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const result = await db.update(schema.upgrades).set(updates).where(eq(schema.upgrades.id, id)).returning();
    return result[0];
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) {
      throw new Error('Upgrade not found');
    }
    
    const newLevel = upgrade.level + 1;
    const result = await db.update(schema.upgrades)
      .set({ level: newLevel })
      .where(eq(schema.upgrades.id, upgradeId))
      .returning();
    
    return result[0];
  }

  async deleteUpgrade(id: string): Promise<void> {
    await db.delete(schema.upgrades).where(eq(schema.upgrades.id, id));
  }

  // Game stats
  async getUserStats(userId: string): Promise<GameStats> {
    const result = await db.select().from(schema.gameStats).where(eq(schema.gameStats.userId, userId)).limit(1);
    
    if (result[0]) {
      return result[0];
    }
    
    // Create default stats if none exist
    const defaultStats: InsertGameStats = {
      userId,
      totalTaps: 0,
      totalEarned: 0,
      totalPoints: 0,
      pointsPerSecond: 0,
      currentEnergy: 4500,
      maxEnergy: 4500,
      wheelSpinsRemaining: 1
    };
    
    const created = await db.insert(schema.gameStats).values(defaultStats).returning();
    return created[0];
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    await db.update(schema.gameStats).set(updates).where(eq(schema.gameStats.userId, userId));
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    if (characterId) {
      const result = await db.select().from(schema.chatMessages)
        .where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.characterId, characterId)))
        .orderBy(desc(schema.chatMessages.createdAt));
      return result;
    }
    
    const result = await db.select().from(schema.chatMessages)
      .where(eq(schema.chatMessages.userId, userId))
      .orderBy(desc(schema.chatMessages.createdAt));
    return result;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(schema.chatMessages).values(message).returning();
    return result[0];
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    if (characterId) {
      await db.delete(schema.chatMessages)
        .where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.characterId, characterId)));
    } else {
      await db.delete(schema.chatMessages)
        .where(eq(schema.chatMessages.userId, userId));
    }
  }

  // Wheel system
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    const stats = await this.getUserStats(userId);
    return stats.lastWheelSpin;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    await this.updateUserStats(userId, { 
      lastWheelSpin: new Date(),
      wheelSpinsRemaining: 0 
    });
  }

  // Admin/Settings
  async getGameSettings(): Promise<GameSettings> {
    const result = await db.select().from(schema.gameSettings).limit(1);
    
    if (result[0]) {
      return result[0];
    }
    
    // Create default settings if none exist
    const defaultSettings: InsertGameSettings = {
      energyRegenRate: 1,
      maxEnergyBonus: 0,
      nsfwEnabled: false,
      wheelRewards: [],
      chatRandomPercentage: 15
    };
    
    const created = await db.insert(schema.gameSettings).values(defaultSettings).returning();
    return created[0];
  }

  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    // Get existing settings first
    const existing = await this.getGameSettings();
    await db.update(schema.gameSettings).set(settings).where(eq(schema.gameSettings.id, existing.id));
  }

  async getSystemStats(): Promise<any> {
    const userCount = await db.select({ count: schema.users.id }).from(schema.users);
    const characterCount = await db.select({ count: schema.characters.id }).from(schema.characters);
    
    return {
      totalUsers: userCount.length,
      totalCharacters: characterCount.length,
      timestamp: new Date()
    };
  }

  async exportAllData(): Promise<any> {
    const users = await db.select().from(schema.users);
    const characters = await db.select().from(schema.characters);
    const upgrades = await db.select().from(schema.upgrades);
    
    return {
      users,
      characters,
      upgrades,
      exportedAt: new Date()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    const result = await db.select().from(schema.mediaFiles);
    return result;
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    if (characterId) {
      const result = await db.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.characterId, characterId));
      return result;
    }
    
    return this.getAllMedia();
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const result = await db.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.id, id)).limit(1);
    return result[0];
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const result = await db.insert(schema.mediaFiles).values(file).returning();
    return result[0];
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    const mediaFile: MediaFile = {
      id: crypto.randomUUID(),
      filename: file.filename || file.originalName || 'unknown',
      originalName: file.originalName || file.originalname || 'unknown',
      mimeType: file.mimeType || file.mimetype || 'application/octet-stream',
      size: file.size || 0,
      fileType: (file.mimeType || file.mimetype || '').startsWith('image/') ? 'image' : 'file',
      url: file.url || `/uploads/${file.filename}`,
      path: file.path || file.url || '',
      characterId: file.characterId || null,
      uploadedBy: file.uploadedBy || 'system',
      tags: file.tags || [],
      description: file.description || null,
      isNsfw: file.isNsfw || false,
      requiredLevel: file.requiredLevel || 1,
      chatSendChance: file.chatSendChance || 5,
      isVipOnly: file.isVipOnly || false,
      isEventOnly: file.isEventOnly || false,
      isWheelReward: file.isWheelReward || false,
      createdAt: new Date()
    };
    
    return this.saveMediaFile(mediaFile);
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const result = await db.update(schema.mediaFiles).set(updates).where(eq(schema.mediaFiles.id, id)).returning();
    return result[0];
  }

  async deleteMediaFile(id: string): Promise<void> {
    await db.delete(schema.mediaFiles).where(eq(schema.mediaFiles.id, id));
  }

  // Additional methods needed by routes
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(schema.users);
    return result;
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    const result = await db.select().from(schema.upgrades);
    return result;
  }

  async assignMediaToCharacter(mediaId: string, characterId: string): Promise<void> {
    await db.update(schema.mediaFiles)
      .set({ characterId })
      .where(eq(schema.mediaFiles.id, mediaId));
  }
}