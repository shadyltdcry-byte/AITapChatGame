
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import type { User, Character, MediaFile, InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const router = Router();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Mock authentication middleware
const authenticateUser = (req: any, res: any, next: any) => {
  req.user = { id: "mock-user-id", isAdmin: true } as User;
  next();
};

// Game state endpoint
router.get("/api/game/state", authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const character = await storage.getSelectedCharacter(req.user.id);
    const upgrades = await storage.getUserUpgrades(req.user.id);
    const stats = await storage.getUserStats(req.user.id);

    res.json({
      user,
      character: character || null,
      upgrades,
      stats
    });
  } catch (error) {
    console.error("Error fetching game state:", error);
    res.status(500).json({ error: "Failed to fetch game state" });
  }
});

// Upgrade endpoint
router.post("/api/game/upgrade", authenticateUser, async (req: any, res) => {
  try {
    const { upgradeId } = req.body;
    
    if (!upgradeId) {
      return res.status(400).json({ error: "Upgrade ID is required" });
    }

    const upgrade = await storage.upgradeUserUpgrade(req.user.id, upgradeId);
    res.json({ success: true, upgrade });
  } catch (error: any) {
    console.error("Error upgrading:", error);
    res.status(400).json({ error: error.message || "Failed to upgrade" });
  }
});

// Tap endpoint
router.post("/api/game/tap", authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const reward = Math.floor(Math.random() * 50) + 20;
    
    await storage.updateUser(req.user.id, {
      points: user.points + reward,
      energy: Math.max(0, user.energy - 10)
    });

    res.json({ success: true, reward });
  } catch (error) {
    console.error("Error processing tap:", error);
    res.status(500).json({ error: "Failed to process tap" });
  }
});

// Characters endpoints
router.get("/api/characters", authenticateUser, async (req: any, res) => {
  try {
    const characters = await storage.getAllCharacters();
    res.json(characters);
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

router.get("/api/characters/:id", authenticateUser, async (req: any, res) => {
  try {
    const character = await storage.getCharacter(req.params.id);
    if (!character) return res.status(404).json({ error: "Character not found" });

    res.json(character);
  } catch (error) {
    console.error("Error fetching character:", error);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

router.post("/api/characters/create", authenticateUser, async (req: any, res) => {
  try {
    const characterData = req.body;
    const character = await storage.createCharacter({
      ...characterData,
      userId: req.user.id
    });
    
    res.json(character);
  } catch (error) {
    console.error("Error creating character:", error);
    res.status(500).json({ error: "Failed to create character" });
  }
});

router.put("/api/characters/:id", authenticateUser, async (req: any, res) => {
  try {
    const characterData = req.body;
    const character = await storage.updateCharacter(req.params.id, characterData);
    
    if (!character) return res.status(404).json({ error: "Character not found" });
    
    res.json(character);
  } catch (error) {
    console.error("Error updating character:", error);
    res.status(500).json({ error: "Failed to update character" });
  }
});

router.delete("/api/characters/:id", authenticateUser, async (req: any, res) => {
  try {
    await storage.deleteCharacter(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting character:", error);
    res.status(500).json({ error: "Failed to delete character" });
  }
});

router.post("/api/characters/test-ai", authenticateUser, async (req: any, res) => {
  try {
    const { characterData, testMessage } = req.body;
    
    // Mock AI response based on character personality
    const responses = {
      friendly: "Oh, that's wonderful to hear! I'm always here if you need someone to chat with. 😊",
      shy: "*blushes slightly* Um... I-I'm doing okay, thank you for asking...",
      playful: "Hehe! I'm doing great, especially now that you're here to play with me! ✨",
      serious: "I am functioning within normal parameters. How may I assist you today?",
      mysterious: "Ah, what an interesting question... Perhaps the real question is, how are YOU doing? *smiles enigmatically*"
    };

    const baseResponse = responses[characterData.personality as keyof typeof responses] || responses.friendly;
    
    // Modify response based on AI personality traits
    let response = baseResponse;
    if (characterData.aiPersonality.humor > 70) {
      response += " *giggles*";
    }
    if (characterData.aiPersonality.flirtiness > 60) {
      response += " You're quite charming, by the way~ 💕";
    }

    res.json({ response });
  } catch (error) {
    console.error("Error testing AI:", error);
    res.status(500).json({ error: "Failed to test AI response" });
  }
});

// Media endpoints
router.get("/api/media/files", authenticateUser, async (req: any, res) => {
  try {
    const characterId = req.query.characterId as string;
    const mediaFiles = await storage.getMediaFiles(characterId);
    res.json(mediaFiles);
  } catch (error) {
    console.error("Error fetching media files:", error);
    res.status(500).json({ error: "Failed to fetch media files" });
  }
});

router.post("/api/media/upload", authenticateUser, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const settings = JSON.parse(req.body.settings || '{}');
    const fileId = randomUUID();
    const filename = `${fileId}_${req.file.originalname}`;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    // Ensure uploads directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, req.file.buffer);

    const mediaFile: MediaFile = {
      id: fileId,
      filename,
      originalName: req.file.originalname,
      url: `/uploads/${filename}`,
      size: req.file.size,
      fileType: req.file.mimetype,
      characterId: settings.characterId || undefined,
      isNsfw: settings.isNsfw || false,
      isVip: settings.isVip || false,
      isEvent: settings.isEvent || false,
      isWheelReward: settings.isWheelReward || false,
      requiredLevel: settings.requiredLevel || 1,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    await storage.saveMediaFile(mediaFile);
    res.json(mediaFile);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.post("/api/media/upload-drive", authenticateUser, async (req: any, res) => {
  try {
    const { url, settings } = req.body;
    
    if (!url) return res.status(400).json({ error: "Drive URL is required" });

    // Mock drive file processing - in real app, you'd download from the drive URL
    const fileId = randomUUID();
    const mockFilename = `drive_${fileId}.jpg`;
    
    const mediaFile: MediaFile = {
      id: fileId,
      filename: mockFilename,
      originalName: "Drive File",
      url: url, // In production, this would be your processed file URL
      driveUrl: url,
      size: 1024000, // Mock size
      fileType: 'image/jpeg',
      characterId: settings.characterId || undefined,
      isNsfw: settings.isNsfw || false,
      isVip: settings.isVip || false,
      isEvent: settings.isEvent || false,
      isWheelReward: settings.isWheelReward || false,
      requiredLevel: settings.requiredLevel || 1,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    await storage.saveMediaFile(mediaFile);
    res.json(mediaFile);
  } catch (error) {
    console.error("Error uploading from drive:", error);
    res.status(500).json({ error: "Failed to upload from drive" });
  }
});

router.put("/api/media/files/:id", authenticateUser, async (req: any, res) => {
  try {
    const updates = req.body;
    const mediaFile = await storage.updateMediaFile(req.params.id, updates);
    
    if (!mediaFile) return res.status(404).json({ error: "Media file not found" });
    
    res.json(mediaFile);
  } catch (error) {
    console.error("Error updating media file:", error);
    res.status(500).json({ error: "Failed to update media file" });
  }
});

router.delete("/api/media/files/:id", authenticateUser, async (req: any, res) => {
  try {
    const mediaFile = await storage.getMediaFile(req.params.id);
    if (!mediaFile) return res.status(404).json({ error: "Media file not found" });

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', mediaFile.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn("Could not delete file from filesystem:", error);
    }

    await storage.deleteMediaFile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting media file:", error);
    res.status(500).json({ error: "Failed to delete media file" });
  }
});

// Chat endpoints
router.get("/api/chat/messages", authenticateUser, async (req: any, res) => {
  try {
    const characterId = req.query.characterId as string;
    const messages = await storage.getChatMessages(req.user.id, characterId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

router.post("/api/chat/send", authenticateUser, async (req: any, res) => {
  try {
    const { message, characterId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Save user message
    const userMessage = await storage.createChatMessage({
      userId: req.user.id,
      characterId,
      message: message.trim(),
      isUser: true
    });

    // Generate AI response (mock implementation)
    const character = characterId ? await storage.getCharacter(characterId) : null;
    const aiResponse = generateAIResponse(character, message);

    // Save AI response
    const aiMessage = await storage.createChatMessage({
      userId: req.user.id,
      characterId,
      message: aiResponse,
      isUser: false
    });

    res.json({ success: true, userMessage, aiMessage });
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.delete("/api/chat/clear", authenticateUser, async (req: any, res) => {
  try {
    const characterId = req.query.characterId as string;
    await storage.clearChatHistory(req.user.id, characterId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat:", error);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

// Settings endpoints
router.get("/api/settings", authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.id);
    const gameSettings = await storage.getGameSettings();
    
    res.json({
      user: {
        nsfwEnabled: user?.nsfwEnabled || false
      },
      game: gameSettings
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/api/settings", authenticateUser, async (req: any, res) => {
  try {
    const { userSettings, gameSettings } = req.body;
    
    if (userSettings) {
      await storage.updateUser(req.user.id, userSettings);
    }
    
    if (gameSettings && req.user.isAdmin) {
      await storage.updateGameSettings(gameSettings);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Helper function to generate AI responses
function generateAIResponse(character: Character | null, userMessage: string): string {
  if (!character) {
    return "Hello! How can I help you today?";
  }

  const responses = {
    friendly: [
      `That's so interesting! As ${character.name}, I love hearing your thoughts.`,
      `*${character.name} smiles warmly* I really enjoy our conversations!`,
      `You always know how to brighten my day! What else is on your mind?`,
    ],
    shy: [
      `*${character.name} blushes* Um... that's really nice to hear...`,
      `I-I'm not sure what to say, but... thank you for sharing that with me.`,
      `*looks down shyly* You're very kind...`,
    ],
    playful: [
      `Ooh, ${character.name} likes where this is going! *giggles*`,
      `Hehe, you're so silly! I love it though~ ✨`,
      `*${character.name} grins mischievously* Now you've got my attention!`,
    ],
    serious: [
      `I appreciate your perspective on this matter.`,
      `As ${character.name}, I find your input quite valuable.`,
      `That's a thoughtful observation. Please continue.`,
    ],
    mysterious: [
      `*${character.name} smiles enigmatically* How fascinating...`,
      `There's more to this than meets the eye, don't you think?`,
      `Ah, but the real question is... *trails off mysteriously*`,
    ],
  };

  const personalityResponses = responses[character.personality] || responses.friendly;
  const randomResponse = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];

  return randomResponse;
}

// Admin Management Routes
router.get("/api/admin/settings", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const settings = await storage.getGameSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/api/admin/settings", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    await storage.updateGameSettings(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.get("/api/admin/stats", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const stats = await storage.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/api/admin/export", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const data = await storage.exportAllData();
    res.json(data);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Upgrade Management Routes
router.get("/api/admin/upgrades", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const upgrades = await storage.getAllUpgrades();
    res.json(upgrades);
  } catch (error) {
    console.error("Error fetching upgrades:", error);
    res.status(500).json({ error: "Failed to fetch upgrades" });
  }
});

router.post("/api/admin/upgrades", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const upgrade = await storage.createUpgrade({
      ...req.body,
      userId: "global" // Global upgrades
    });
    res.json(upgrade);
  } catch (error) {
    console.error("Error creating upgrade:", error);
    res.status(500).json({ error: "Failed to create upgrade" });
  }
});

router.put("/api/admin/upgrades/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const upgrade = await storage.updateUpgrade(req.params.id, req.body);
    if (!upgrade) return res.status(404).json({ error: "Upgrade not found" });
    
    res.json(upgrade);
  } catch (error) {
    console.error("Error updating upgrade:", error);
    res.status(500).json({ error: "Failed to update upgrade" });
  }
});

router.delete("/api/admin/upgrades/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    await storage.deleteUpgrade(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting upgrade:", error);
    res.status(500).json({ error: "Failed to delete upgrade" });
  }
});

// Wheel Management Routes
router.get("/api/admin/wheel/prizes", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const settings = await storage.getGameSettings();
    res.json(settings.wheelRewards);
  } catch (error) {
    console.error("Error fetching wheel prizes:", error);
    res.status(500).json({ error: "Failed to fetch wheel prizes" });
  }
});

router.put("/api/admin/wheel/prizes", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    await storage.updateGameSettings({ wheelRewards: req.body });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating wheel prizes:", error);
    res.status(500).json({ error: "Failed to update wheel prizes" });
  }
});

// Wheel spin functionality
router.get("/api/wheel/status", authenticateUser, async (req: any, res) => {
  try {
    const lastSpin = await storage.getLastWheelSpin(req.user.id);
    const now = new Date();
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
    
    const settings = await storage.getGameSettings();
    
    res.json({
      canSpin,
      nextSpinTime: canSpin ? null : new Date(lastSpin!.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      recentRewards: [], // TODO: Implement recent rewards tracking
      possibleRewards: settings.wheelRewards.map((reward, index) => ({
        id: index,
        name: reward.type,
        value: reward.min ? `${reward.min}-${reward.max}` : 'Variable'
      }))
    });
  } catch (error) {
    console.error("Error fetching wheel status:", error);
    res.status(500).json({ error: "Failed to fetch wheel status" });
  }
});

router.post("/api/wheel/spin", authenticateUser, async (req: any, res) => {
  try {
    const lastSpin = await storage.getLastWheelSpin(req.user.id);
    const now = new Date();
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
    
    if (!canSpin) {
      return res.status(400).json({ error: "Daily spin already used" });
    }

    const settings = await storage.getGameSettings();
    const rewards = settings.wheelRewards;
    
    // Simple random selection based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedReward = rewards[0];
    
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        selectedReward = reward;
        break;
      }
    }

    // Apply reward
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let rewardText = "";
    const updates: Partial<typeof user> = {};

    switch (selectedReward.type) {
      case 'coins':
        const coins = Math.floor(Math.random() * (selectedReward.max! - selectedReward.min!)) + selectedReward.min!;
        updates.points = user.points + coins;
        rewardText = `${coins} coins`;
        break;
      case 'energy':
        const energy = Math.floor(Math.random() * (selectedReward.max! - selectedReward.min!)) + selectedReward.min!;
        updates.energy = Math.min(user.maxEnergy, user.energy + energy);
        rewardText = `${energy} energy`;
        break;
      case 'character':
        rewardText = "Character unlock!";
        break;
      default:
        rewardText = "Mystery prize!";
    }

    await storage.updateUser(req.user.id, updates);
    await storage.recordWheelSpin(req.user.id, rewardText);

    res.json({ success: true, reward: rewardText });
  } catch (error) {
    console.error("Error spinning wheel:", error);
    res.status(500).json({ error: "Failed to spin wheel" });
  }
});

// Event Management Routes
router.get("/api/admin/events", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const events = await storage.getActiveEvents();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/api/admin/events", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const event = await storage.createEvent(req.body);
    res.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/api/admin/events/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const event = await storage.updateEvent(req.params.id, req.body);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/api/admin/events/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    await storage.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// User Management Routes
router.get("/api/admin/users", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/api/admin/users/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/api/admin/users/:id", authenticateUser, async (req: any, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    await storage.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Static file serving for uploads
router.use('/uploads', (req, res, next) => {
  // In production, you'd want proper static file serving
  res.status(404).json({ error: 'File not found' });
});

export { router as registerRoutes };
export default router;
