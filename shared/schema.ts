import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
  energy: integer("energy").notNull().default(4500),
  maxEnergy: integer("maxEnergy").notNull().default(4500),
  hourlyRate: integer("hourlyRate").notNull().default(0),
  isAdmin: boolean("isAdmin").notNull().default(false),
  nsfwEnabled: boolean("nsfwEnabled").notNull().default(false),
  lustGems: integer("lustGems").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`)
});

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bio: text("bio").default(""),
  backstory: text("backstory").default(""),
  interests: text("interests").default(""),
  quirks: text("quirks").default(""),
  imageUrl: text("imageUrl").default(""),
  avatarUrl: text("avatarUrl").default(""),
  isUnlocked: boolean("isUnlocked").notNull().default(false),
  requiredLevel: integer("requiredLevel").notNull().default(1),
  personality: text("personality").notNull().default("friendly"),
  chatStyle: text("chatStyle").notNull().default("casual"),
  personalityStyle: text("personalityStyle").notNull().default("Sweet & Caring"),
  moodDistribution: jsonb("moodDistribution").default({
    normal: 70,
    happy: 20,
    flirty: 10,
    playful: 0,
    mysterious: 0,
    shy: 0
  }),
  responseTimeMin: integer("responseTimeMin").notNull().default(1),
  responseTimeMax: integer("responseTimeMax").notNull().default(3),
  responseTimeMs: integer("responseTimeMs").notNull().default(2000),
  randomPictureSending: boolean("randomPictureSending").notNull().default(false),
  pictureSendChance: integer("pictureSendChance").notNull().default(5),
  customTriggerWords: jsonb("customTriggerWords").default([]),
  customGreetings: jsonb("customGreetings").default([]),
  customResponses: jsonb("customResponses").default([]),
  likes: text("likes").default(""),
  dislikes: text("dislikes").default(""),
  description: text("description").default(""),
  level: integer("level").notNull().default(1),
  isNsfw: boolean("isNsfw").notNull().default(false),
  isVip: boolean("isVip").notNull().default(false),
  isEvent: boolean("isEvent").notNull().default(false),
  isWheelReward: boolean("isWheelReward").notNull().default(false),
  userId: varchar("userId")
});

export const upgrades = pgTable("upgrades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(),
  level: integer("level").notNull().default(1),
  maxLevel: integer("maxLevel").notNull().default(1),
  hourlyBonus: integer("hourlyBonus").notNull().default(0),
  tapBonus: integer("tapBonus").notNull().default(0),
  userId: varchar("userId").notNull(),
  requiredLevel: integer("requiredLevel").notNull().default(1),
  requiredUpgrades: jsonb("requiredUpgrades").default({})
});

export const gameStats = pgTable("gameStats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  totalTaps: integer("totalTaps").notNull().default(0),
  totalEarned: integer("totalEarned").notNull().default(0),
  totalPoints: integer("totalPoints").notNull().default(0),
  pointsPerSecond: integer("pointsPerSecond").notNull().default(0),
  currentEnergy: integer("currentEnergy").notNull().default(4500),
  maxEnergy: integer("maxEnergy").notNull().default(4500),
  lastWheelSpin: timestamp("lastWheelSpin"),
  wheelSpinsRemaining: integer("wheelSpinsRemaining").notNull().default(1),
  selectedCharacterId: varchar("selectedCharacterId")
});

export const wheelRewards = pgTable("wheelRewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'coins', 'gems', 'character', 'energy'
  amount: integer("amount").default(0),
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  label: text("label").notNull(),
  weight: integer("weight").notNull().default(100), // Higher = more likely
  characterId: varchar("characterId"), // For character unlocks
  isActive: boolean("isActive").notNull().default(true)
});

export const userCharacters = pgTable("userCharacters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  characterId: varchar("characterId").notNull(),
  isUnlocked: boolean("isUnlocked").notNull().default(false),
  unlockedAt: timestamp("unlockedAt"),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  isSelected: boolean("isSelected").notNull().default(false)
});

export const chatMessages = pgTable("chatMessages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  characterId: varchar("characterId"),
  message: text("message").notNull(),
  isFromUser: boolean("isFromUser").notNull(),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`)
});

export const mediaFiles = pgTable("mediaFiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("originalName"),
  mimeType: text("mimeType").notNull(),
  size: integer("size").default(0),
  fileType: text("fileType").notNull(),
  url: text("url").notNull(),
  path: text("path").notNull(),
  characterId: varchar("characterId"),
  uploadedBy: varchar("uploadedBy"),
  tags: jsonb("tags").default([]),
  description: text("description"),
  isNsfw: boolean("isNsfw").default(false),
  requiredLevel: integer("requiredLevel").default(1),
  chatSendChance: integer("chatSendChance").default(5),
  isVipOnly: boolean("isVipOnly").default(false),
  isEventOnly: boolean("isEventOnly").default(false),
  isWheelReward: boolean("isWheelReward").default(false),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`)
});

export const gameSettings = pgTable("gameSettings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  energyRegenRate: integer("energyRegenRate").notNull().default(1),
  maxEnergyBonus: integer("maxEnergyBonus").notNull().default(0),
  nsfwEnabled: boolean("nsfwEnabled").notNull().default(false),
  wheelRewards: jsonb("wheelRewards").notNull(),
  chatRandomPercentage: integer("chatRandomPercentage").notNull().default(15),
  vipBenefits: jsonb("vipBenefits").default({
    daily: { coins: 500, gems: 24, energyRegen: 50, exclusiveChars: true, vipChat: true },
    weekly: { coins: 2000, gems: 7, energyRegen: 100, allExclusive: true, prioritySupport: true, dailyBonus: true },
    monthly: { coins: 6000, gems: 30, energyRegen: 200, unlimited: true, customChars: true, monthlyEvents: true }
  }),
  levelRequirements: jsonb("levelRequirements").default([
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
  ]),
  updatedAt: timestamp("updatedAt").notNull().default(sql`now()`)
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'character_unlock', 'bonus_points', 'special_wheel'
  isActive: boolean("isActive").notNull().default(true),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  rewards: jsonb("rewards").notNull(),
  requirements: jsonb("requirements").default({}),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`)
});

export const userVip = pgTable("userVip", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  planType: text("planType").notNull(), // 'daily', 'weekly', 'monthly'
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  autoRenew: boolean("autoRenew").notNull().default(false),
  benefits: jsonb("benefits").notNull()
});

// Type exports
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Upgrade = typeof upgrades.$inferSelect;
export type GameStats = typeof gameStats.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type Event = typeof events.$inferSelect;
export type UserVip = typeof userVip.$inferSelect;
export type GameSettings = typeof gameSettings.$inferSelect;
export type WheelReward = typeof wheelRewards.$inferSelect;
export type UserCharacter = typeof userCharacters.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCharacterSchema = createInsertSchema(characters);
export const insertUpgradeSchema = createInsertSchema(upgrades);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMediaFileSchema = createInsertSchema(mediaFiles);
export const insertEventSchema = createInsertSchema(events);
export const insertUserVipSchema = createInsertSchema(userVip);
export const insertGameSettingsSchema = createInsertSchema(gameSettings);
export const insertGameStatsSchema = createInsertSchema(gameStats);

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertUserVip = z.infer<typeof insertUserVipSchema>;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;