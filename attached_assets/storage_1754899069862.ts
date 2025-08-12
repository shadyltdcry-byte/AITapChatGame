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
  type MediaFile
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Character management
  getCharacter(id: string): Promise<Character | undefined>;
  getUserCharacters(userId: string): Promise<Character[]>;
  getAllCharacters(): Promise<Character[]>;
  getSelectedCharacter(userId: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<void>;
  selectCharacter(userId: string, characterId: string): Promise<void>;

  // Upgrade management
  getUpgrade(id: string): Promise<Upgrade | undefined>;
  getUserUpgrades(userId: string): Promise<Upgrade[]>;
  createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade>;
  updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined>;

  // Game stats
  getUserStats(userId: string): Promise<GameStats>;
  updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void>;

  // Chat system
  getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: string, characterId?: string): Promise<void>;

  // Wheel system
  getLastWheelSpin(userId: string): Promise<Date | null>;
  recordWheelSpin(userId: string, reward: string): Promise<void>;

  // Admin/Settings
  getGameSettings(): Promise<GameSettings>;
  updateGameSettings(settings: Partial<GameSettings>): Promise<void>;
  getSystemStats(): Promise<any>;
  exportAllData(): Promise<any>;

  // Media management
  getMediaFiles(characterId?: string): Promise<MediaFile[]>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  saveMediaFile(file: MediaFile): Promise<void>;
  updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined>;
  deleteMediaFile(id: string): Promise<void>;
  assignMediaToCharacter(mediaId: string, characterId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private characters: Map<string, Character>;
  private upgrades: Map<string, Upgrade>;
  private gameStats: Map<string, GameStats>;
  private chatMessages: Map<string, ChatMessage[]>;
  private wheelSpins: Map<string, Date>;
  private gameSettings: GameSettings;
  private mediaFiles: Map<string, MediaFile>;
  private selectedCharacters: Map<string, string>; // userId -> characterId

  constructor() {
    this.users = new Map();
    this.characters = new Map();
    this.upgrades = new Map();
    this.gameStats = new Map();
    this.chatMessages = new Map();
    this.wheelSpins = new Map();
    this.mediaFiles = new Map();
    this.selectedCharacters = new Map();

    // Initialize default game settings
    this.gameSettings = {
      id: randomUUID(),
      energyRegenRate: 1,
      maxEnergyBonus: 0,
      nsfwEnabled: false,
      wheelRewards: [
        { type: 'coins', min: 100, max: 1000, probability: 0.4 },
        { type: 'gems', min: 1, max: 10, probability: 0.3 },
        { type: 'energy', min: 100, max: 500, probability: 0.2 },
        { type: 'character', probability: 0.1 }
      ],
      updatedAt: new Date()
    };

    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create mock user
    const mockUser: User = {
      id: "mock-user-id",
      username: "ShadyLTD",
      password: "password123",
      level: 4,
      points: 2140,
      energy: 4500,
      maxEnergy: 4500,
      hourlyRate: 16933,
      isAdmin: true,
      nsfwEnabled: false,
      createdAt: new Date()
    };
    this.users.set(mockUser.id, mockUser);

    // Create mock characters with full feature set
    const mockCharacters: Character[] = [
      {
        id: "char-yuki",
        name: "Yuki",
        bio: "A mysterious shrine maiden with ancient powers and a gentle heart",
        backstory: "Born in the mountains, Yuki learned ancient magic from her grandmother",
        interests: "Meditation, tea ceremonies, ancient texts",
        quirks: "Always speaks in soft whispers, has a pet fox spirit",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000",
        isUnlocked: true,
        requiredLevel: 1,
        personality: "shy",
        chatStyle: "formal",
        isNsfw: false,
        isVip: false,
        isEvent: false,
        isWheelReward: true,
        userId: mockUser.id
      },
      {
        id: "char-aria",
        name: "Aria",
        bio: "A confident warrior princess with a fiery spirit",
        backstory: "Heir to a kingdom, trained in combat from a young age",
        interests: "Swordsmanship, strategy games, royal duties",
        quirks: "Never backs down from a challenge, loves spicy food",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616c0763598?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000",
        isUnlocked: false,
        requiredLevel: 10,
        personality: "playful",
        chatStyle: "energetic",
        isNsfw: false,
        isVip: true,
        isEvent: false,
        isWheelReward: false,
        userId: mockUser.id
      }
    ];

    mockCharacters.forEach(char => this.characters.set(char.id, char));
    this.selectedCharacters.set(mockUser.id, "char-yuki");

    // Create mock upgrades
    const mockUpgrades: Upgrade[] = [
      {
        id: "upgrade-1",
        name: "Special Talent",
        description: "Increases sugar per hour",
        cost: 5172,
        level: 8,
        maxLevel: 50,
        hourlyBonus: 798,
        tapBonus: 0,
        userId: mockUser.id,
        requiredLevel: 1,
        requiredUpgrades: {}
      }
    ];
    mockUpgrades.forEach(upgrade => this.upgrades.set(upgrade.id, upgrade));

    // Create mock stats
    const mockStats: GameStats = {
      id: "stats-mock-user",
      userId: mockUser.id,
      totalTaps: 1247,
      totalEarned: 45200,
      dailySpinUsed: null
    };
    this.gameStats.set(mockUser.id, mockStats);

    // Initialize empty chat for user
    this.chatMessages.set(mockUser.id, []);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      level: 1,
      points: 0,
      energy: 4500,
      maxEnergy: 4500,
      hourlyRate: 0,
      isAdmin: false,
      nsfwEnabled: false,
      createdAt: new Date()
    };
    this.users.set(id, user);

    // Initialize user stats
    const stats: GameStats = {
      id: randomUUID(),
      userId: id,
      totalTaps: 0,
      totalEarned: 0,
      dailySpinUsed: null
    };
    this.gameStats.set(id, stats);

    // Initialize empty chat
    this.chatMessages.set(id, []);

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      char => char.userId === userId
    );
  }

  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    const characterId = this.selectedCharacters.get(userId);
    return characterId ? this.characters.get(characterId) : undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const id = randomUUID();
    const newCharacter: Character = {
      ...character,
      id,
      bio: character.bio || "",
      backstory: character.backstory || "",
      interests: character.interests || "",
      quirks: character.quirks || "",
      imageUrl: character.imageUrl || "",
      isUnlocked: character.isUnlocked ?? false,
      requiredLevel: character.requiredLevel ?? 1,
      personality: character.personality || "friendly",
      chatStyle: character.chatStyle || "casual",
      isNsfw: character.isNsfw ?? false,
      isVip: character.isVip ?? false,
      isEvent: character.isEvent ?? false,
      isWheelReward: character.isWheelReward ?? false,
      userId: character.userId || ""
    };
    this.characters.set(id, newCharacter);
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
    // Remove from selected characters
    for (const [userId, charId] of this.selectedCharacters.entries()) {
      if (charId === id) {
        this.selectedCharacters.delete(userId);
      }
    }
    // Clear related media assignments
    for (const [mediaId, media] of this.mediaFiles.entries()) {
      if (media.characterId === id) {
        this.mediaFiles.set(mediaId, { ...media, characterId: undefined });
      }
    }
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    this.selectedCharacters.set(userId, characterId);
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    return this.upgrades.get(id);
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    return Array.from(this.upgrades.values()).filter(
      upgrade => upgrade.userId === userId
    );
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    const id = randomUUID();
    const newUpgrade: Upgrade = {
      ...upgrade,
      id,
      level: upgrade.level || 1,
      maxLevel: upgrade.maxLevel || 1,
      hourlyBonus: upgrade.hourlyBonus || 0,
      tapBonus: upgrade.tapBonus || 0,
      requiredLevel: upgrade.requiredLevel || 1,
      requiredUpgrades: upgrade.requiredUpgrades || {}
    };
    this.upgrades.set(id, newUpgrade);
    return newUpgrade;
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const upgrade = this.upgrades.get(id);
    if (!upgrade) return undefined;

    const updatedUpgrade = { ...upgrade, ...updates };
    this.upgrades.set(id, updatedUpgrade);
    return updatedUpgrade;
  }

  async getUserStats(userId: string): Promise<GameStats> {
    const stats = this.gameStats.get(userId);
    if (!stats) {
      const defaultStats: GameStats = {
        id: randomUUID(),
        userId,
        totalTaps: 0,
        totalEarned: 0,
        dailySpinUsed: null
      };
      this.gameStats.set(userId, defaultStats);
      return defaultStats;
    }
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    const stats = await this.getUserStats(userId);
    const updatedStats = { ...stats, ...updates };
    this.gameStats.set(userId, updatedStats);
  }

  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(userId) || [];
    if (characterId) {
      return messages.filter(msg => msg.characterId === characterId);
    }
    return messages;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      createdAt: new Date()
    };

    const userMessages = this.chatMessages.get(message.userId) || [];
    userMessages.push(chatMessage);
    this.chatMessages.set(message.userId, userMessages);

    return chatMessage;
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    const messages = this.chatMessages.get(userId) || [];
    if (characterId) {
      const filteredMessages = messages.filter(msg => msg.characterId !== characterId);
      this.chatMessages.set(userId, filteredMessages);
    } else {
      this.chatMessages.set(userId, []);
    }
  }

  async getLastWheelSpin(userId: string): Promise<Date | null> {
    return this.wheelSpins.get(userId) || null;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    this.wheelSpins.set(userId, new Date());

    // Update daily spin in stats
    const stats = await this.getUserStats(userId);
    await this.updateUserStats(userId, { dailySpinUsed: new Date() });
  }

  async getGameSettings(): Promise<GameSettings> {
    return this.gameSettings;
  }

  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    this.gameSettings = {
      ...this.gameSettings,
      ...settings,
      updatedAt: new Date()
    };
  }

  async getSystemStats(): Promise<any> {
    return {
      totalUsers: this.users.size,
      dailyActiveUsers: Math.floor(this.users.size * 0.7),
      totalTaps: Array.from(this.gameStats.values()).reduce((sum, stats) => sum + stats.totalTaps, 0),
      totalMediaFiles: this.mediaFiles.size,
      totalCharacters: this.characters.size
    };
  }

  async exportAllData(): Promise<any> {
    return {
      users: Array.from(this.users.values()),
      characters: Array.from(this.characters.values()),
      upgrades: Array.from(this.upgrades.values()),
      gameStats: Array.from(this.gameStats.values()),
      chatMessages: Object.fromEntries(this.chatMessages),
      gameSettings: this.gameSettings,
      mediaFiles: Array.from(this.mediaFiles.values()),
      timestamp: new Date().toISOString()
    };
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    const files = Array.from(this.mediaFiles.values());
    if (characterId) {
      return files.filter(file => file.characterId === characterId);
    }
    return files;
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    return this.mediaFiles.get(id);
  }

  async saveMediaFile(file: MediaFile): Promise<void> {
    this.mediaFiles.set(file.id, file);
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

  async assignMediaToCharacter(mediaId: string, characterId: string): Promise<void> {
    const media = this.mediaFiles.get(mediaId);
    if (media) {
      this.mediaFiles.set(mediaId, { ...media, characterId });
    }
  }

  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade || upgrade.userId !== userId) {
      throw new Error("Upgrade not found");
    }

    if (upgrade.level >= upgrade.maxLevel) {
      throw new Error("Upgrade is already at maximum level");
    }

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newLevel = upgrade.level + 1;
    const newCost = Math.floor(upgrade.cost * Math.pow(1.15, newLevel - 1));

    if (user.points < newCost) {
      throw new Error("Insufficient points");
    }

    // Update user points
    await this.updateUser(userId, {
      points: user.points - newCost,
      hourlyRate: user.hourlyRate + upgrade.hourlyBonus
    });

    // Update upgrade
    const updatedUpgrade = {
      ...upgrade,
      level: newLevel,
      cost: Math.floor(newCost * 1.15)
    };

    this.upgrades.set(upgradeId, updatedUpgrade);
    return updatedUpgrade;
  }

  async deleteUpgrade(id: string): Promise<void> {
    this.upgrades.delete(id);
  }

  async getAllUpgrades(): Promise<Upgrade[]> {
    return Array.from(this.upgrades.values());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).map(user => ({
      ...user,
      password: "[HIDDEN]" // Don't expose passwords
    }));
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    this.gameStats.delete(id);
    this.chatMessages.delete(id);
    this.selectedCharacters.delete(id);
    this.wheelSpins.delete(id);
  }

  // Event management
  private events: Map<string, any> = new Map();

  async getActiveEvents(): Promise<any[]> {
    return Array.from(this.events.values()).filter(event => 
      new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date()
    );
  }

  async createEvent(eventData: any): Promise<any> {
    const id = randomUUID();
    const event = {
      ...eventData,
      id,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: any): Promise<any | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    this.events.delete(id);
  }
}

export const storage = new MemStorage();