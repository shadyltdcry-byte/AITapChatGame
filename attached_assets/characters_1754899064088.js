
const express = require('express');
const { authenticateToken, requireAdmin } = require('./auth');
const database = require('./database');
const errorHandler = require('./errorHandler');

const router = express.Router();

// Get all characters for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const characters = await database.all(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM media_files WHERE character_id = c.id) as media_count,
             CASE WHEN uc.character_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
      FROM characters c
      LEFT JOIN user_characters uc ON c.id = uc.character_id AND uc.user_id = ?
      ORDER BY c.required_level ASC
    `, [req.user.id]);

    res.json({ success: true, characters });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to get characters' });
  }
});

// Get character details with media
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const character = await database.get(`
      SELECT c.*,
             CASE WHEN uc.character_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
      FROM characters c
      LEFT JOIN user_characters uc ON c.id = uc.character_id AND uc.user_id = ?
      WHERE c.id = ?
    `, [req.user.id, req.params.id]);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    // Get character media
    const media = await database.all(`
      SELECT id, filename, url, file_type, size
      FROM media_files 
      WHERE character_id = ?
      ORDER BY upload_date DESC
    `, [req.params.id]);

    res.json({ 
      success: true, 
      character: { 
        ...character, 
        media: media 
      }
    });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to get character' });
  }
});

// Unlock character
router.post('/:id/unlock', authenticateToken, async (req, res) => {
  try {
    const characterId = req.params.id;
    const userId = req.user.id;

    // Check if character exists and requirements
    const character = await database.get('SELECT * FROM characters WHERE id = ?', [characterId]);
    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    // Check user level requirement
    const user = await database.get('SELECT level FROM users WHERE id = ?', [userId]);
    if (user.level < character.required_level) {
      return res.status(400).json({ 
        success: false, 
        message: `Level ${character.required_level} required to unlock this character` 
      });
    }

    // Check if already unlocked
    const existing = await database.get(`
      SELECT id FROM user_characters WHERE user_id = ? AND character_id = ?
    `, [userId, characterId]);

    if (existing) {
      return res.status(400).json({ success: false, message: 'Character already unlocked' });
    }

    // Unlock character
    await database.run(`
      INSERT INTO user_characters (user_id, character_id, unlocked_at)
      VALUES (?, ?, ?)
    `, [userId, characterId, new Date().toISOString()]);

    res.json({ success: true, message: 'Character unlocked successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to unlock character' });
  }
});

// Select active character
router.post('/:id/select', authenticateToken, async (req, res) => {
  try {
    const characterId = req.params.id;
    const userId = req.user.id;

    // Check if character is unlocked
    const unlocked = await database.get(`
      SELECT id FROM user_characters WHERE user_id = ? AND character_id = ?
    `, [userId, characterId]);

    if (!unlocked) {
      return res.status(400).json({ success: false, message: 'Character not unlocked' });
    }

    // Update user's selected character
    await database.run(`
      UPDATE users SET selected_character_id = ? WHERE id = ?
    `, [characterId, userId]);

    res.json({ success: true, message: 'Character selected' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to select character' });
  }
});

// Admin: Create character
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, bio, requiredLevel, bonusType, bonusValue, imageUrl } = req.body;
    const characterId = require('crypto').randomUUID();

    await database.run(`
      INSERT INTO characters (id, name, bio, required_level, bonus_type, bonus_value, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [characterId, name, bio, requiredLevel || 1, bonusType || 'none', bonusValue || 0, imageUrl || '', new Date().toISOString()]);

    res.json({ success: true, characterId, message: 'Character created successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to create character' });
  }
});

// Admin: Update character
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, bio, requiredLevel, bonusType, bonusValue, imageUrl } = req.body;
    const characterId = req.params.id;

    await database.run(`
      UPDATE characters 
      SET name = ?, bio = ?, required_level = ?, bonus_type = ?, bonus_value = ?, image_url = ?
      WHERE id = ?
    `, [name, bio, requiredLevel, bonusType, bonusValue, imageUrl, characterId]);

    res.json({ success: true, message: 'Character updated successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to update character' });
  }
});

// Admin: Delete character
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const characterId = req.params.id;

    // Delete character and related data
    await database.run('DELETE FROM user_characters WHERE character_id = ?', [characterId]);
    await database.run('DELETE FROM chat_logs WHERE character_id = ?', [characterId]);
    await database.run('UPDATE media_files SET character_id = NULL WHERE character_id = ?', [characterId]);
    await database.run('DELETE FROM characters WHERE id = ?', [characterId]);

    res.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to delete character' });
  }
});

module.exports = router;
