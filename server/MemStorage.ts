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

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private characters = new Map<string, Character>();
  private upgrades = new Map<string, Upgrade>();
  private gameStats = new Map<string, GameStats>();
  private chatMessages = new Map<string, ChatMessage[]>();
  private mediaFiles = new Map<string, MediaFile>();
  private userCharacters = new Map<string, UserCharacter[]>();
  private gameSettings: GameSettings | null = null;
  private wheelRewards = new Map<string, WheelReward>();

  constructor() {
    // Initialize default settings
    this.gameSettings = {
      id: crypto.randomUUID(),
      energyRegenRate: 1,
      maxEnergyBonus: 0,
      nsfwEnabled: false,
      wheelRewards: [],
      chatRandomPercentage: 15,
      vipBenefits: {
        daily: { coins: 500, gems: 24, energyRegen: 50, exclusiveChars: true, vipChat: true },
        weekly: { coins: 2000, gems: 7, energyRegen: 100, allExclusive: true, prioritySupport: true, dailyBonus: true },
        monthly: { coins: 6000, gems: 30, energyRegen: 200, unlimited: true, customChars: true, monthlyEvents: true }
      },
      levelRequirements: [
        { level: 1, pointsRequired: 0 },
        { level: 2, pointsRequired: 1000 },
        { level: 3, pointsRequired: 2500 },
        { level: 4, pointsRequired: 5000 },
        { level: 5, pointsRequired: 10000 },
        { level: 6, pointsRequired: 20000 },
        { level: 7, pointsRequired: 40000 },
        { level: 8, pointsRequired: 75000 },
        { level: 9, pointsRequired: 125000 },
        { level: 10, pointsRequired: 200000 }
      ],
      updatedAt: new Date()
    };
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: user.id ?? crypto.randomUUID(),
      username: user.username,
      password: user.password,
      level: user.level ?? 1,
      points: user.points ?? 0,
      energy: user.energy ?? 4500,
      maxEnergy: user.maxEnergy ?? 4500,
      hourlyRate: user.hourlyRate ?? 0,
      isAdmin: user.isAdmin ?? false,
      nsfwEnabled: user.nsfwEnabled ?? false,
      lustGems: user.lustGems ?? 0,
      createdAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Character management
  async getCharacter(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(char => char.userId === userId);
  }

  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    const userChars = this.userCharacters.get(userId) || [];
    const selected = userChars.find(uc => uc.isSelected);
    if (selected) {
      return this.characters.get(selected.characterId);
    }
    return undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: character.name,
      bio: character.bio ?? "",
      backstory: character.backstory ?? "",
      interests: character.interests ?? "",
      quirks: character.quirks ?? "",
      imageUrl: character.imageUrl ?? "",
      avatarUrl: character.avatarUrl ?? "",
      isUnlocked: character.isUnlocked ?? false,
      requiredLevel: character.requiredLevel ?? 1,
      personality: character.personality ?? "friendly",
      chatStyle: character.chatStyle ?? "casual",
      personalityStyle: character.personalityStyle ?? "Sweet & Caring",
      moodDistribution: character.moodDistribution ?? {
        normal: 70,
        happy: 20,
        flirty: 10,
        playful: 0,
        mysterious: 0,
        shy: 0
      },
      responseTimeMin: character.responseTimeMin ?? 1,
      responseTimeMax: character.responseTimeMax ?? 3,
      responseTimeMs: character.responseTimeMs ?? 2000,
      randomPictureSending: character.randomPictureSending ?? false,
      pictureSendChance: character.pictureSendChance ?? 5,
      customTriggerWords: character.customTriggerWords ?? [],
      customGreetings: character.customGreetings ?? [],
      customResponses: character.customResponses ?? [],
      likes: character.likes ?? "",
      dislikes: character.dislikes ?? "",
      description: character.description ?? "",
      level: character.level ?? 1,
      isNsfw: character.isNsfw ?? false,
      isVip: character.isVip ?? false,
      isEvent: character.isEvent ?? false,
      isWheelReward: character.isWheelReward ?? false,
      userId: character.userId ?? null
    };
    this.characters.set(newCharacter.id, newCharacter);
    return newCharacter;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...updates };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: string): Promise<void> {
    this.characters.delete(id);
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    let userChars = this.userCharacters.get(userId) || [];
    
    // Deselect all characters for this user
    userChars = userChars.map(uc => ({ ...uc, isSelected: false }));
    
    // Select the specified character
    const targetCharIndex = userChars.findIndex(uc => uc.characterId === characterId);
    if (targetCharIndex >= 0) {
      userChars[targetCharIndex] = { ...userChars[targetCharIndex], isSelected: true };
    } else {
      // Create new user character relationship
      userChars.push({
        id: crypto.randomUUID(),
        userId,
        characterId,
        isUnlocked: true,
        unlockedAt: new Date(),
        level: 1,
        experience: 0,
        isSelected: true
      });
    }
    
    this.userCharacters.set(userId, userChars);
  }

  // Upgrade management
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    return this.upgrades.get(id);
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    return Array.from(this.upgrades.values()).filter(upgrade => upgrade.userId === userId);
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    return Array.from(this.upgrades.values());
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const newUpgrade: Upgrade = {
      id: crypto.randomUUID(),
      name: upgrade.name,
      description: upgrade.description,
      cost: upgrade.cost,
      level: upgrade.level ?? 1,
      maxLevel: upgrade.maxLevel ?? 1,
      hourlyBonus: upgrade.hourlyBonus ?? 0,
      tapBonus: upgrade.tapBonus ?? 0,
      userId: upgrade.userId,
      requiredLevel: upgrade.requiredLevel ?? 1,
      requiredUpgrades: upgrade.requiredUpgrades ?? {}
    };
    this.upgrades.set(newUpgrade.id, newUpgrade);
    return newUpgrade;
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const upgrade = this.upgrades.get(id);
    if (!upgrade) return undefined;
    
    const updatedUpgrade = { ...upgrade, ...updates };
    this.upgrades.set(id, updatedUpgrade);
    return updatedUpgrade;
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) {
      throw new Error('Upgrade not found');
    }
    
    const newLevel = upgrade.level + 1;
    const updatedUpgrade = { ...upgrade, level: newLevel };
    this.upgrades.set(upgradeId, updatedUpgrade);
    return updatedUpgrade;
  }

  async deleteUpgrade(id: string): Promise<void> {
    this.upgrades.delete(id);
  }

  // Game stats
  async getUserStats(userId: string): Promise<GameStats> {
    let stats = this.gameStats.get(userId);
    
    if (!stats) {
      // Create default stats if none exist
      stats = {
        id: crypto.randomUUID(),
        userId,
        totalTaps: 0,
        totalEarned: 0,
        totalPoints: 0,
        pointsPerSecond: 0,
        currentEnergy: 4500,
        maxEnergy: 4500,
        lastWheelSpin: null,
        wheelSpinsRemaining: 1,
        selectedCharacterId: null
      };
      this.gameStats.set(userId, stats);
    }
    
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    const stats = await this.getUserStats(userId);
    const updatedStats = { ...stats, ...updates };
    this.gameStats.set(userId, updatedStats);
  }

  // Chat system
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    const key = characterId ? `${userId}:${characterId}` : userId;
    return this.chatMessages.get(key) || [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: message.userId,
      characterId: message.characterId ?? null,
      message: message.message,
      isFromUser: message.isFromUser,
      createdAt: new Date()
    };
    
    const key = message.characterId ? `${message.userId}:${message.characterId}` : message.userId;
    const messages = this.chatMessages.get(key) || [];
    messages.push(newMessage);
    this.chatMessages.set(key, messages);
    
    return newMessage;
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    const key = characterId ? `${userId}:${characterId}` : userId;
    this.chatMessages.set(key, []);
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
    return this.gameSettings!;
  }

  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    this.gameSettings = { ...this.gameSettings!, ...settings };
  }

  async getSystemStats(): Promise<any> {
    return {
      totalUsers: this.users.size,
      totalCharacters: this.characters.size,
      timestamp: new Date()
    };
  }

  async exportAllData(): Promise<any> {
    return {
      users: Array.from(this.users.values()),
      characters: Array.from(this.characters.values()),
      upgrades: Array.from(this.upgrades.values()),
      exportedAt: new Date()
    };
  }

  // Media management
  async getAllMedia(): Promise<MediaFile[]> {
    return Array.from(this.mediaFiles.values());
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    if (characterId) {
      return Array.from(this.mediaFiles.values()).filter(file => file.characterId === characterId);
    }
    return this.getAllMedia();
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    return this.mediaFiles.get(id);
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    this.mediaFiles.set(file.id, file);
    return file;
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
    const file = this.mediaFiles.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.mediaFiles.set(id, updatedFile);
    return updatedFile;
  }

  async deleteMediaFile(id: string): Promise<void> {
    this.mediaFiles.delete(id);
  }

  // Additional methods needed by routes
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async assignMediaToCharacter(mediaId: string, characterId: string): Promise<void> {
    await this.updateMediaFile(mediaId, { characterId });
  }
}