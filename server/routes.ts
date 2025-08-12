import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import fsSync from "fs";
import { storage } from "./storage";
import { insertUserSchema, insertCharacterSchema, insertUpgradeSchema, insertChatMessageSchema, insertMediaFileSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { MediaFile } from "@shared/schema";
import { mistralService } from "./mistralService";

// Configure multer for file uploads
const uploadDir = './public/uploads';
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static('./public/uploads'));
  app.use('/public', express.static('./public'));

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Initialize or get default user
  app.post("/api/user/init", async (req, res) => {
    try {
      const defaultUserId = "default-player";
      
      // Check if default user already exists
      let user = await storage.getUser(defaultUserId);
      
      if (!user) {
        // Create default user
        user = await storage.createUser({
          id: defaultUserId,
          username: "Player",
          password: "default", // In a real app, this would be properly hashed
          level: 1,
          points: 1000, // Give some starting points
          energy: 4500,
          maxEnergy: 4500,
          hourlyRate: 0,
          isAdmin: true, // Make default user admin for testing
          nsfwEnabled: false,
          lustGems: 50 // Give some starting gems
        });
        
        console.log('Created default user:', user.id);
        
        // Create default upgrades
        const defaultUpgrades = [
          {
            name: "Tap Power",
            description: "Increase points per tap",
            cost: 100,
            level: 1,
            maxLevel: 10,
            tapBonus: 25,
            hourlyBonus: 0,
            requiredLevel: 1
          },
          {
            name: "Energy Boost",
            description: "Increase maximum energy",
            cost: 150,
            level: 1,
            maxLevel: 10,
            tapBonus: 0,
            hourlyBonus: 0,
            requiredLevel: 1
          },
          {
            name: "Auto Collector",
            description: "Earn points automatically",
            cost: 250,
            level: 1,
            maxLevel: 15,
            tapBonus: 0,
            hourlyBonus: 50,
            requiredLevel: 2
          }
        ];

        for (const upgradeData of defaultUpgrades) {
          await storage.createUpgrade(upgradeData);
        }

        // Create a default character for the new user
        const defaultCharacter = await storage.createCharacter({
          name: "Luna",
          bio: "A mysterious and charming companion",
          backstory: "Luna is an enigmatic character who loves to engage in conversations and help with your journey.",
          interests: "Anime, Gaming, Art",
          quirks: "Has a playful sense of humor",
          description: "A beautiful anime-style character with long dark hair and sparkling eyes",
          imageUrl: "/public/default-character.jpg",
          avatarUrl: "/public/default-avatar.jpg",
          personality: "friendly",
          personalityStyle: "Sweet & Caring",
          chatStyle: "casual",
          likes: "Adventures, cute things, helping friends",
          dislikes: "Rudeness, boredom",
          requiredLevel: 1,
          level: 1,
          responseTimeMin: 1,
          responseTimeMax: 3,
          responseTimeMs: 2000,
          pictureSendChance: 5,
          isNsfw: false,
          isVip: false,
          isEvent: false,
          isWheelReward: false,
          randomPictureSending: false,
          moodDistribution: {
            normal: 70,
            happy: 20,
            flirty: 10,
            playful: 0,
            mysterious: 0,
            shy: 0,
          },
          customTriggerWords: [],
          customGreetings: ["Hello there! I'm Luna, nice to meet you!"],
          customResponses: [],
        });
        
        // Properly select the character for this user
        await storage.selectCharacter(user.id, defaultCharacter.id);
        console.log('Created default character and set as selected:', defaultCharacter.id);
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error initializing user:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Character routes
  app.get("/api/characters/:userId", async (req, res) => {
    try {
      const characters = await storage.getUserCharacters(req.params.userId);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/character/selected/:userId", async (req, res) => {
    try {
      const character = await storage.getSelectedCharacter(req.params.userId);
      if (!character) {
        return res.status(404).json({ error: "No character selected" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      console.error('Character creation error:', error);
      res.status(400).json({ error: "Invalid character data" });
    }
  });

  app.post("/api/character", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      res.status(400).json({ error: "Invalid character data" });
    }
  });

  app.post("/api/character/select", async (req, res) => {
    try {
      const { userId, characterId } = req.body;
      await storage.selectCharacter(userId, characterId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upgrade routes
  app.get("/api/upgrades/:userId", async (req, res) => {
    try {
      const upgrades = await storage.getUserUpgrades(req.params.userId);
      res.json(upgrades);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/upgrade", async (req, res) => {
    try {
      const upgradeData = insertUpgradeSchema.parse(req.body);
      const upgrade = await storage.createUpgrade(upgradeData);
      res.json(upgrade);
    } catch (error) {
      res.status(400).json({ error: "Invalid upgrade data" });
    }
  });

  app.post("/api/upgrade/purchase", async (req, res) => {
    try {
      const { upgradeId, userId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the specific upgrade being purchased
      const upgrade = await storage.getUpgrade(upgradeId);

      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }

      // Check if upgrade is at max level
      if (upgrade.level >= upgrade.maxLevel) {
        return res.status(400).json({ error: "Upgrade is already at maximum level" });
      }

      // Calculate cost for next level (cost increases with level)
      const upgradeCost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.level));

      console.log(`Upgrade purchase attempt: User has ${user.points} points, needs ${upgradeCost} points`);

      if (user.points < upgradeCost) {
        return res.status(400).json({ 
          error: "Not enough points",
          required: upgradeCost,
          current: user.points
        });
      }

      // Purchase upgrade - deduct points
      const newPoints = user.points - upgradeCost;
      await storage.updateUser(userId, { points: newPoints });

      // Upgrade the specific upgrade
      const upgradedUpgrade = await storage.upgradeUserUpgrade(userId, upgradeId);

      // Recalculate user's hourly rate from all upgrades
      const allUserUpgrades = await storage.getUserUpgrades(userId);
      let totalHourlyBonus = 0;

      for (const userUpgrade of allUserUpgrades) {
        totalHourlyBonus += userUpgrade.hourlyBonus * userUpgrade.level;
      }

      // Update user's hourly rate
      await storage.updateUser(userId, {
        hourlyRate: totalHourlyBonus
      });

      console.log(`Upgrade purchased successfully: ${upgrade.name} level ${upgradedUpgrade.level}`);

      res.json({ 
        success: true,
        message: `${upgrade.name} upgraded to level ${upgradedUpgrade.level}!`,
        newPoints: newPoints,
        upgradeLevel: upgradedUpgrade.level,
        cost: upgradeCost,
        newHourlyRate: totalHourlyBonus
      });
    } catch (error) {
      console.error("Error purchasing upgrade:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Game stats routes
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/stats/:userId", async (req, res) => {
    try {
      await storage.updateUserStats(req.params.userId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chat routes
  app.get("/api/chat/:userId/:characterId?", async (req, res) => {
    try {
      const { characterId } = req.params;
      const messages = await storage.getChatMessages(req.params.userId, characterId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      // Ensure required fields are present and add isFromUser
      const requestBody = {
        userId: req.body.userId,
        characterId: req.body.characterId || null,
        message: req.body.message || '',
        isFromUser: true
      };
      
      if (!requestBody.message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const messageData = insertChatMessageSchema.parse(requestBody);
      console.log('Chat send request:', messageData);
      
      const message = await storage.createChatMessage(messageData);

      // Get character for personality context
      const character = messageData.characterId ? await storage.getCharacter(messageData.characterId) : null;
      
      // Get recent conversation history (excluding the current message being sent)
      const recentMessages = await storage.getChatMessages(messageData.userId, messageData.characterId || undefined);
      const conversationHistory = recentMessages
        .filter(msg => msg.message !== messageData.message) // Exclude current message
        .slice(-6) // Get last 6 messages for context
        .map(msg => ({
          role: msg.isFromUser ? 'user' as const : 'assistant' as const,
          content: msg.message
        }));

      let aiResponseText = "I understand! Thanks for talking with me.";

      // Try MistralAI if enabled, otherwise use fallback
      if (mistralService.isEnabled()) {
        try {
          console.log('Using MistralAI for chat response');
          aiResponseText = await mistralService.generateChatResponse({
            message: messageData.message,
            characterId: messageData.characterId || '',
            conversationHistory,
            characterPersonality: character?.personality || character?.bio || 'friendly'
          });
          console.log('MistralAI response:', aiResponseText);
        } catch (error) {
          console.warn('MistralAI chat failed, using fallback:', error);
          // Use existing fallback logic
          aiResponseText = generateFallbackResponse(messageData.message, character);
        }
      } else {
        console.log('MistralAI disabled, using fallback');
        aiResponseText = generateFallbackResponse(messageData.message, character);
      }

      const aiResponse = await storage.createChatMessage({
        userId: messageData.userId,
        characterId: messageData.characterId || null,
        message: aiResponseText,
        isFromUser: false
      });

      res.json({ userMessage: message, aiResponse });
    } catch (error) {
      console.error('Chat send error:', error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Helper function for fallback responses
  function generateFallbackResponse(message: string, character: any) {
    const fallbackResponses = [
      "That's interesting! Tell me more.",
      "I love chatting with you!",
      "You always know what to say.",
      "Thanks for sharing that with me.",
      "I'm enjoying our conversation!",
      `${character?.name || 'I'} appreciate${character?.name ? 's' : ''} talking with you.`
    ];
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello there! I'm ${character?.name || 'here'} and I'm happy to chat with you!`;
    } else if (lowerMessage.includes('how are you')) {
      return "I'm doing great, thanks for asking! How are you today?";
    } else if (lowerMessage.includes('love') || lowerMessage.includes('like')) {
      return "That's so sweet of you to say! 💕";
    }
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  app.delete("/api/chat/:userId/:characterId?", async (req, res) => {
    try {
      const { characterId } = req.params;
      await storage.clearChatHistory(req.params.userId, characterId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Game action routes
  app.post("/api/tap", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get current stats for energy check
      const stats = await storage.getUserStats(userId);

      // Check energy (require 5 energy per tap)
      const energyCost = 5;
      if (stats.currentEnergy < energyCost) {
        return res.status(400).json({ error: "Not enough energy" });
      }

      // Calculate points per tap (base 125 + upgrades)
      const upgrades = await storage.getUserUpgrades(userId);
      const tapBonus = upgrades.reduce((sum, upgrade) => sum + (upgrade.tapBonus * upgrade.level), 0);
      const pointsPerTap = 125 + tapBonus;

      const newPoints = user.points + pointsPerTap;
      const newEnergy = Math.max(0, stats.currentEnergy - energyCost);

      // Update user points only
      await storage.updateUser(userId, {
        points: newPoints
      });

      // Update stats including energy consumption
      await storage.updateUserStats(userId, {
        totalTaps: stats.totalTaps + 1,
        totalEarned: stats.totalEarned + pointsPerTap,
        totalPoints: newPoints,
        currentEnergy: newEnergy
      });

      res.json({
        pointsEarned: pointsPerTap,
        newPoints: newPoints,
        newEnergy: newEnergy,
        points: newPoints,
        energy: newEnergy,
        energyConsumed: energyCost
      });
    } catch (error) {
      console.error('Tap error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Wheel routes
  app.get("/api/wheel/last-spin/:userId", async (req, res) => {
    try {
      const lastSpin = await storage.getLastWheelSpin(req.params.userId);
      res.json({ lastSpin });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/wheel/spin", async (req, res) => {
    try {
      const { userId } = req.body;
      const lastSpin = await storage.getLastWheelSpin(userId);

      // Check if user can spin (once per day)
      if (lastSpin) {
        const now = new Date();
        const lastSpinDate = new Date(lastSpin);
        const timeDiff = now.getTime() - lastSpinDate.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        if (hoursDiff < 24) {
          return res.status(400).json({ error: "Daily spin already used" });
        }
      }

      // Get game settings for rewards
      const settings = await storage.getGameSettings();
      const rewards = settings.wheelRewards as any[];

      // Select random reward
      const rand = Math.random();
      let cumProb = 0;
      let selectedReward;

      for (const reward of rewards) {
        cumProb += reward.probability;
        if (rand <= cumProb) {
          selectedReward = reward;
          break;
        }
      }

      if (!selectedReward) {
        selectedReward = rewards[0] as any; // fallback
      }

      // Apply reward
      let rewardAmount = 0;
      if (selectedReward.type !== 'character') {
        rewardAmount = Math.floor(Math.random() * (selectedReward.max! - selectedReward.min! + 1)) + selectedReward.min!;

        const user = await storage.getUser(userId);
        if (user) {
          const updates: any = {};
          if (selectedReward.type === 'coins') {
            updates.points = user.points + rewardAmount;
          } else if (selectedReward.type === 'energy') {
            updates.energy = Math.min(user.maxEnergy, user.energy + rewardAmount);
          }
          await storage.updateUser(userId, updates);
        }
      }

      // Record spin
      await storage.recordWheelSpin(userId, `${selectedReward.type}:${rewardAmount}`);

      res.json({
        reward: selectedReward.type,
        amount: rewardAmount,
        message: `You won ${rewardAmount} ${selectedReward.type}!`
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/characters", async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/characters", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      res.status(400).json({ error: "Invalid character data" });
    }
  });

  app.put("/api/admin/characters/:id", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.partial().parse(req.body);
      const character = await storage.updateCharacter(req.params.id, characterData);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(400).json({ error: "Invalid character data" });
    }
  });

  // Admin upgrade management
  app.get("/api/admin/upgrades", async (req, res) => {
    try {
      const upgrades = await storage.getAllUpgrades();
      res.json(upgrades);
    } catch (error) {
      console.error('Admin upgrades error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/upgrades", async (req, res) => {
    try {
      const upgradeData = insertUpgradeSchema.parse(req.body);
      const upgrade = await storage.createUpgrade(upgradeData);
      res.json(upgrade);
    } catch (error) {
      res.status(400).json({ error: "Invalid upgrade data" });
    }
  });

  app.patch("/api/admin/upgrades/:id", async (req, res) => {
    try {
      const upgrade = await storage.updateUpgrade(req.params.id, req.body);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/upgrades/:id", async (req, res) => {
    try {
      (storage as any).upgrades.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin wheel prize management
  app.get("/api/admin/wheel-prizes", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings.wheelRewards || []);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/wheel-prizes", async (req, res) => {
    try {
      const { type, min, max, probability, label } = req.body;
      const settings = await storage.getGameSettings();
      const newPrize = {
        id: randomUUID(),
        type,
        min: min || 0,
        max: max || 0,
        probability: probability || 0.1,
        label: label || type
      };

      const updatedRewards = [...(settings.wheelRewards as any[]), newPrize];
      await storage.updateGameSettings({ wheelRewards: updatedRewards });
      res.json(newPrize);
    } catch (error) {
      res.status(400).json({ error: "Invalid prize data" });
    }
  });

  app.delete("/api/admin/wheel-prizes/:id", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      const updatedRewards = (settings.wheelRewards as any[]).filter((prize: any) => prize.id !== req.params.id);
      await storage.updateGameSettings({ wheelRewards: updatedRewards });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chat settings routes
  app.get("/api/chat/settings/:userId/:characterId", async (req, res) => {
    try {
      const { userId, characterId } = req.params;
      // For now, return default settings - implement storage later
      res.json({
        settings: {
          autoReply: false,
          allowImages: true,
          moodResponses: true,
          triggerWords: []
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chat/settings", async (req, res) => {
    try {
      const { userId, characterId, settings } = req.body;
      // TODO: Implement settings storage
      console.log('Saving chat settings:', { userId, characterId, settings });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/trigger-words", async (req, res) => {
    try {
      const { word, response, characterId } = req.body;
      // TODO: Implement trigger words storage
      console.log('Saving trigger word:', { word, response, characterId });
      res.json({ success: true, id: randomUUID() });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/media", async (req, res) => {
    try {
      const media = await storage.getMediaFiles();
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/media/upload", async (req, res) => {
    try {
      const { filename, fileType, url } = req.body;
      const media = await storage.uploadMedia({
        filename,
        fileType,
        url: url || `/uploads/${filename}`,
        uploadedBy: "admin"
      });
      res.json(media);
    } catch (error) {
      res.status(400).json({ error: "Upload failed" });
    }
  });

  // VIP routes
  app.get("/api/vip/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // Mock VIP status for now
      res.json({ isActive: false, planType: null, endDate: null });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/vip/purchase", async (req, res) => {
    try {
      const { userId, planId } = req.body;
      // Mock VIP purchase
      const endDate = new Date();
      if (planId === "daily") endDate.setDate(endDate.getDate() + 1);
      else if (planId === "weekly") endDate.setDate(endDate.getDate() + 7);
      else if (planId === "monthly") endDate.setDate(endDate.getDate() + 30);

      res.json({ 
        planType: planId, 
        isActive: true, 
        endDate: endDate.toISOString(),
        message: "VIP purchase successful!" 
      });
    } catch (error) {
      res.status(400).json({ error: "Purchase failed" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      await storage.updateGameSettings(req.body);
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/settings/toggle-nsfw/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, {
        nsfwEnabled: !user.nsfwEnabled
      });

      res.json({ nsfwEnabled: updatedUser?.nsfwEnabled, success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Events routes
  app.get("/api/events/active", async (req, res) => {
    try {
      // Mock active events for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/export", async (req, res) => {
    try {
      const data = await storage.exportAllData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      await storage.updateGameSettings(req.body);
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== IMAGE MANAGEMENT SYSTEM =====

  // Get all media files with optional character filter
  app.get("/api/media", async (req, res) => {
    try {
      const { characterId, level, nsfw, sortBy = 'createdAt' } = req.query;
      let mediaFiles = await storage.getMediaFiles(characterId as string);

      // Filter by NSFW if specified
      if (nsfw !== undefined) {
        const nsfwFilter = nsfw === 'true';
        const filteredFiles = [];
        for (const file of mediaFiles) {
          const character = await storage.getCharacter(file.characterId || '');
          if (character ? character.isNsfw === nsfwFilter : false) {
            filteredFiles.push(file);
          }
        }
        mediaFiles = filteredFiles;
      }

      // Sort by specified field
      mediaFiles.sort((a, b) => {
        if (sortBy === 'createdAt') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'filename') {
          return a.filename.localeCompare(b.filename);
        }
        return 0;
      });

      res.json(mediaFiles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload single or multiple images with processing
  app.post("/api/media/upload", upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { characterId, userId, processOptions } = req.body;

      console.log('Upload request received:', { 
        filesCount: files?.length, 
        characterId, 
        userId,
        bodyKeys: Object.keys(req.body)
      });

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = [];

      for (const file of files) {
        try {
          console.log('Processing file:', file.originalname, 'Size:', file.size);
          
          // Process image with Sharp if options provided
          let processedPath = file.path;
          let finalFilename = file.filename;
          
          if (processOptions) {
            try {
              const options = JSON.parse(processOptions);
              const processedFilename = 'processed-' + file.filename;
              processedPath = path.join(uploadDir, processedFilename);
              finalFilename = processedFilename;

              let sharpProcessor = sharp(file.path);

              // Apply cropping if specified
              if (options.crop) {
                sharpProcessor = sharpProcessor.extract({
                  left: options.crop.x,
                  top: options.crop.y,
                  width: options.crop.width,
                  height: options.crop.height
                });
              }

              // Apply resizing if specified
              if (options.resize) {
                sharpProcessor = sharpProcessor.resize(options.resize.width, options.resize.height);
              }

              // Apply format conversion
              if (options.format) {
                sharpProcessor = sharpProcessor.toFormat(options.format);
              }

              await sharpProcessor.toFile(processedPath);

              // Delete original file
              await fs.unlink(file.path);
            } catch (processError) {
              console.warn('Image processing failed, using original:', processError);
              processedPath = file.path;
              finalFilename = file.filename;
            }
          }

          // Ensure file exists and get its stats
          const fileStats = await fs.stat(processedPath);
          const urlPath = `/uploads/${finalFilename}`;

          // Save to database
          const mediaFile = {
            filename: finalFilename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: fileStats.size,
            path: urlPath,
            url: urlPath,
            characterId: characterId === 'unassigned' ? null : (characterId || null),
            uploadedBy: userId || 'anonymous',
            fileType: req.body.fileType || req.body.category || 'image',
            isNsfw: req.body.isNsfw === 'true',
            requiredLevel: parseInt(req.body.requiredLevel) || 1,
            chatSendChance: parseInt(req.body.chatSendChance) || 5,
            isVipOnly: req.body.isVipOnly === 'true',
            isEventOnly: req.body.isEventOnly === 'true',
            isWheelReward: req.body.isWheelReward === 'true'
          };

          console.log('Saving media file to database:', mediaFile);

          const savedFile = await storage.uploadMedia(mediaFile);
          uploadedFiles.push(savedFile);
          
          console.log('Successfully saved file:', savedFile.id);
        } catch (fileError) {
          console.error('Error processing file:', file.originalname, fileError);
          // Continue with next file instead of failing completely
        }
      }

      console.log('Upload completed. Files processed:', uploadedFiles.length);

      res.json({
        success: true,
        files: uploadedFiles,
        message: `${uploadedFiles.length} file(s) uploaded successfully`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });

  // Get specific media file
  app.get("/api/media/:id", async (req, res) => {
    try {
      const mediaFile = await storage.getMediaFile(req.params.id);
      if (!mediaFile) {
        return res.status(404).json({ error: "Media file not found" });
      }
      res.json(mediaFile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update media file metadata
  app.patch("/api/media/:id", async (req, res) => {
    try {
      const { characterId, tags, description } = req.body;
      const updatedFile = await storage.updateMediaFile(req.params.id, {
        characterId,
        // Add support for tags and description in schema if needed
      });

      if (!updatedFile) {
        return res.status(404).json({ error: "Media file not found" });
      }

      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete media file
  app.delete('/api/media/:id', async (req, res) => {
    try {
      const mediaFile = await storage.getMediaFile(req.params.id);
      if (!mediaFile) {
        return res.status(404).json({ error: "Media file not found" });
      }

      // Delete physical file
      const fullPath = path.join('./public', mediaFile.url);
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn('Could not delete physical file:', fullPath);
      }

      // Delete from database
      await storage.deleteMediaFile(req.params.id);

      res.json({ success: true, message: "Media file deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/media/:id/assign', async (req, res) => {
    try {
      const { characterId } = req.body;
      await storage.assignMediaToCharacter(req.params.id, characterId);

      // If this is a character's main image, update the character's imageUrl
      if (characterId) {
        const media = await storage.getMediaFile(req.params.id);
        if (media) {
          await storage.updateCharacter(characterId, { 
            imageUrl: media.url || media.path 
          });
        }
      }

      res.json({ success: true, message: "Media assigned to character" });
    } catch (error) {
      console.error('Error assigning media:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Crop/edit image endpoint
  app.post("/api/media/:id/edit", async (req, res) => {
    try {
      const { crop, resize, format, quality } = req.body;
      const mediaFile = await storage.getMediaFile(req.params.id);

      if (!mediaFile) {
        return res.status(404).json({ error: "Media file not found" });
      }

      const originalPath = path.join('./public', mediaFile.url);
      const editedFilename = 'edited-' + Date.now() + '-' + mediaFile.filename;
      const editedPath = path.join(uploadDir, editedFilename);

      let sharpProcessor = sharp(originalPath);

      // Apply transformations
      if (crop) {
        sharpProcessor = sharpProcessor.extract({
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height
        });
      }

      if (resize) {
        sharpProcessor = sharpProcessor.resize(resize.width, resize.height);
      }

      if (format) {
        sharpProcessor = sharpProcessor.toFormat(format, { quality: quality || 90 });
      }

      await sharpProcessor.toFile(editedPath);

      // Create new media file entry
      const editedFile = {
        filename: editedFilename,
        originalName: `edited-${mediaFile.originalName}`,
        mimeType: format ? `image/${format}` : mediaFile.mimeType,
        size: (await fs.stat(editedPath)).size,
        path: `/uploads/${editedFilename}`,
        characterId: mediaFile.characterId,
        uploadedBy: mediaFile.uploadedBy
      };

      await storage.saveMediaFile(editedFile as any);

      res.json({
        success: true,
        editedFile,
        message: "Image edited successfully"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Layout settings routes
  app.post("/api/admin/layout-settings", async (req, res) => {
    try {
      const settings = req.body;
      // Save layout settings to storage (implement as needed)
      res.json({ success: true, message: "Layout settings saved" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save layout settings" });
    }
  });

  app.get("/api/admin/layout-settings", async (req, res) => {
    try {
      // Return saved layout settings or defaults
      const defaultSettings = {
        primaryColor: "#ff6b9d",
        secondaryColor: "#c44569", 
        backgroundColor: "#1a1a2e",
        textColor: "#ffffff",
        accentColor: "#4ecdc4",
        siteTitle: "ClassikLust"
      };
      res.json(defaultSettings);
    } catch (error) {
      res.status(500).json({ error: "Failed to load layout settings" });
    }
  });

  // Admin routes for characters
  app.get("/api/admin/characters", async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/media", async (req, res) => {
    try {
      const mediaFiles = await storage.getMediaFiles();
      res.json(mediaFiles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Character management routes
  app.get("/api/character/:id", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/character/:id", async (req, res) => {
    try {
      console.log(`Updating character ${req.params.id} with:`, req.body);

      // Ensure data is properly formatted
      const updateData = {
        ...req.body,
        moodDistribution: req.body.moodDistribution || {
          normal: 70,
          happy: 20,
          flirty: 10,
          playful: 0,
          mysterious: 0,
          shy: 0,
        },
        customTriggerWords: req.body.customTriggerWords || [],
        customGreetings: req.body.customGreetings || [],
        customResponses: req.body.customResponses || [],
      };

      const character = await storage.updateCharacter(req.params.id, updateData);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      console.error('Character update error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      console.log(`Updating character ${req.params.id} with:`, req.body);

      const updateData = {
        ...req.body,
        moodDistribution: req.body.moodDistribution || {
          normal: 70,
          happy: 20,
          flirty: 10,
          playful: 0,
          mysterious: 0,
          shy: 0,
        },
        customTriggerWords: req.body.customTriggerWords || [],
        customGreetings: req.body.customGreetings || [],
        customResponses: req.body.customResponses || [],
      };

      const character = await storage.updateCharacter(req.params.id, updateData);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      console.error('Character update error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/character/:id", async (req, res) => {
    try {
      console.log(`PUT updating character ${req.params.id} with:`, req.body);
      const character = await storage.updateCharacter(req.params.id, req.body);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      console.error('Character PUT update error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/character/:id", async (req, res) => {
    try {
      await storage.deleteCharacter(req.params.id);
      res.json({ success: true, message: "Character deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  // Placeholder image endpoint
  app.get('/api/placeholder-image', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ccc"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#666">No Image</text></svg>`);
  });

  // Serve uploaded media files
  app.get('/api/media/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    console.log('Media request for:', filename, 'Path:', filePath);

    if (fsSync.existsSync(filePath)) {
      // Set proper content type
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.sendFile(path.resolve(filePath));
    } else {
      console.warn('File not found:', filePath);
      res.status(404).json({ error: 'File not found' });
    }
  });

  // MistralAI Admin Routes
  app.get("/api/admin/mistral/status", async (req, res) => {
    try {
      const status = {
        enabled: mistralService.isEnabled(),
        hasApiKey: !!process.env.MISTRAL_API_KEY
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Mistral status" });
    }
  });

  app.post("/api/admin/mistral/toggle", async (req, res) => {
    try {
      const { enabled } = req.body;
      mistralService.setEnabled(enabled);
      res.json({ success: true, enabled: mistralService.isEnabled() });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle Mistral" });
    }
  });

  app.post("/api/admin/mistral/test", async (req, res) => {
    try {
      const result = await mistralService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Test failed" });
    }
  });

  app.post("/api/debug/assist", async (req, res) => {
    try {
      const { code, error, context } = req.body;
      const assistance = await mistralService.debugAssist({ code, error, context });
      res.json({ assistance });
    } catch (error) {
      res.status(500).json({ error: "Debug assistance failed" });
    }
  });

  // Admin Energy Settings Endpoints
  app.post("/api/admin/energy-settings", async (req, res) => {
    try {
      const { regenAmount, intervalSeconds } = req.body;

      if (typeof regenAmount !== 'number' || typeof intervalSeconds !== 'number') {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      // In a real application, you would save these settings to a database or configuration file
      // For now, we'll just log them and return success
      console.log(`Energy regeneration updated: ${regenAmount} energy every ${intervalSeconds} seconds`);

      // Placeholder for actual storage update
      // await storage.updateEnergyRegenRate(regenAmount, intervalSeconds);

      res.json({ 
        success: true, 
        message: `Energy regeneration updated: ${regenAmount} energy every ${intervalSeconds} seconds` 
      });
    } catch (error) {
      console.error("Error updating energy settings:", error);
      res.status(500).json({ error: "Failed to update energy settings" });
    }
  });

  app.get("/api/admin/energy-settings", async (req, res) => {
    try {
      // In a real application, you would fetch these settings from your storage
      // For now, we'll return default values
      const defaultSettings = {
        regenAmount: 3,
        intervalSeconds: 5
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching energy settings:", error);
      res.status(500).json({ error: "Failed to fetch energy settings" });
    }
  });

  // Implement background energy regeneration
  // This is a simplified example and would typically run in a background process or use a more robust scheduling mechanism
  // For demonstration, we'll simulate it by checking periodically
  // NOTE: This is not a production-ready solution for background tasks.
  setInterval(async () => {
    try {
      // Fetch current energy settings
      const settings = { regenAmount: 3, intervalSeconds: 5 }; // Replace with actual fetch from storage
      const users = await storage.getAllUsers(); // Fetch all users to update their energy
      for (const user of users) {
        if (user.energy < user.maxEnergy) { // Only regenerate if not at max energy
          const newEnergy = Math.min(user.maxEnergy, user.energy + settings.regenAmount);
          await storage.updateUser(user.id, { energy: newEnergy });
          // console.log(`Regenerated energy for user ${user.id}. New energy: ${newEnergy}`);
        }
      }
    } catch (error) {
      console.error("Error during background energy regeneration:", error);
    }
  }, 5000); // Regenerate every 5 seconds (intervalSeconds)


  const httpServer = createServer(app);
  return httpServer;
}