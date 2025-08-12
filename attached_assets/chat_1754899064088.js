
const express = require('express');
const { authenticateToken } = require('./auth');
const database = require('./database');
const errorHandler = require('./errorHandler');

const router = express.Router();

// Get chat history
router.get('/history/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.id;

    // Check if user has unlocked this character
    const unlocked = await database.get(`
      SELECT id FROM user_characters WHERE user_id = ? AND character_id = ?
    `, [userId, characterId]);

    if (!unlocked) {
      return res.status(403).json({ success: false, message: 'Character not unlocked' });
    }

    const messages = await database.all(`
      SELECT id, message, response, is_user_message, created_at
      FROM chat_logs 
      WHERE user_id = ? AND character_id = ?
      ORDER BY created_at ASC
      LIMIT 50
    `, [userId, characterId]);

    res.json({ success: true, messages });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
});

// Send message to character
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { characterId, message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // Check if user has unlocked this character
    const unlocked = await database.get(`
      SELECT id FROM user_characters WHERE user_id = ? AND character_id = ?
    `, [userId, characterId]);

    if (!unlocked) {
      return res.status(403).json({ success: false, message: 'Character not unlocked' });
    }

    // Get character info for AI context
    const character = await database.get('SELECT name, bio FROM characters WHERE id = ?', [characterId]);
    
    // Get recent chat history for context
    const recentMessages = await database.all(`
      SELECT message, response FROM chat_logs 
      WHERE user_id = ? AND character_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId, characterId]);

    // Save user message
    const messageId = require('crypto').randomUUID();
    await database.run(`
      INSERT INTO chat_logs (id, user_id, character_id, message, is_user_message, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `, [messageId, userId, characterId, message.trim(), new Date().toISOString()]);

    // Generate AI response (mock for now - you can integrate with OpenAI later)
    const aiResponse = await generateAIResponse(character, message, recentMessages);

    // Save AI response
    const responseId = require('crypto').randomUUID();
    await database.run(`
      INSERT INTO chat_logs (id, user_id, character_id, response, is_user_message, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [responseId, userId, characterId, aiResponse, new Date().toISOString()]);

    res.json({ 
      success: true, 
      response: aiResponse,
      messageId: messageId,
      responseId: responseId
    });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Clear chat history
router.delete('/clear/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.id;

    await database.run(`
      DELETE FROM chat_logs 
      WHERE user_id = ? AND character_id = ?
    `, [userId, characterId]);

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
});

// Mock AI response generator (replace with actual AI integration)
async function generateAIResponse(character, userMessage, chatHistory) {
  // Simple mock responses based on character personality
  const responses = {
    default: [
      `That's interesting! As ${character.name}, I find your perspective quite intriguing.`,
      `*${character.name} smiles* I appreciate you sharing that with me.`,
      `${character.bio} What do you think about that?`,
      `*${character.name} tilts head thoughtfully* Tell me more about what you're thinking.`,
      `I love our conversations! You always give me something new to think about.`
    ]
  };

  const defaultResponses = responses.default;
  const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  
  return randomResponse;
}

module.exports = router;
