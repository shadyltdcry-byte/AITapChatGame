
const express = require('express');
const { authenticateToken, requireAdmin } = require('./auth');
const database = require('./database');
const errorHandler = require('./errorHandler');

const router = express.Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    const characterCount = await database.get('SELECT COUNT(*) as count FROM characters');
    const mediaCount = await database.get('SELECT COUNT(*) as count FROM media_files');
    const totalTaps = await database.get('SELECT SUM(total_taps) as total FROM game_stats');
    const totalEarned = await database.get('SELECT SUM(total_earned) as total FROM game_stats');

    res.json({
      success: true,
      stats: {
        totalUsers: userCount.count,
        totalCharacters: characterCount.count,
        totalMediaFiles: mediaCount.count,
        totalTaps: totalTaps.total || 0,
        totalEarned: totalEarned.total || 0
      }
    });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to get system stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await database.all(`
      SELECT u.id, u.username, u.level, u.points, u.energy, u.is_admin, 
             u.account_status, u.created_at, u.last_active,
             COUNT(uc.character_id) as unlocked_characters
      FROM users u
      LEFT JOIN user_characters uc ON u.id = uc.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await database.get(`
      SELECT * FROM users WHERE id = ?
    `, [req.params.id]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const stats = await database.get(`
      SELECT * FROM game_stats WHERE user_id = ?
    `, [req.params.id]);

    const characters = await database.all(`
      SELECT c.name, uc.unlocked_at 
      FROM user_characters uc
      JOIN characters c ON uc.character_id = c.id
      WHERE uc.user_id = ?
    `, [req.params.id]);

    res.json({ 
      success: true, 
      user: { 
        ...user, 
        stats: stats || {}, 
        unlockedCharacters: characters 
      }
    });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to get user details' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { points, level, energy, isAdmin, accountStatus, banReason } = req.body;
    
    await database.run(`
      UPDATE users 
      SET points = ?, level = ?, energy = ?, is_admin = ?, account_status = ?, ban_reason = ?
      WHERE id = ?
    `, [points, level, energy, isAdmin ? 1 : 0, accountStatus, banReason, req.params.id]);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Get error logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await database.all(`
      SELECT el.*, u.username 
      FROM error_logs el
      LEFT JOIN users u ON el.user_id = u.id
      ORDER BY el.timestamp DESC
      LIMIT 100
    `);

    res.json({ success: true, logs });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to get error logs' });
  }
});

// Clear error logs
router.delete('/logs', async (req, res) => {
  try {
    await database.run('DELETE FROM error_logs');
    res.json({ success: true, message: 'Error logs cleared' });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to clear logs' });
  }
});

// Export all data
router.get('/export', async (req, res) => {
  try {
    const users = await database.all('SELECT * FROM users');
    const characters = await database.all('SELECT * FROM characters');
    const mediaFiles = await database.all('SELECT * FROM media_files');
    const chatLogs = await database.all('SELECT * FROM chat_logs');
    const gameStats = await database.all('SELECT * FROM game_stats');

    const exportData = {
      users,
      characters,
      mediaFiles,
      chatLogs,
      gameStats,
      exportDate: new Date().toISOString()
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    errorHandler.logError(error, req.user.id);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

module.exports = router;
