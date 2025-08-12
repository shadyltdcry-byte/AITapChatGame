
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('./auth');
const database = require('./database');
const errorHandler = require('./errorHandler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get all media files
router.get('/files', authenticateToken, async (req, res) => {
  try {
    const images = await database.all(`
      SELECT id, filename, url, size, character_id, upload_date, file_type 
      FROM media_files 
      WHERE file_type LIKE 'image/%'
      ORDER BY upload_date DESC
    `);
    
    const videos = await database.all(`
      SELECT id, filename, url, size, character_id, upload_date, file_type 
      FROM media_files 
      WHERE file_type LIKE 'video/%'
      ORDER BY upload_date DESC
    `);

    res.json({
      success: true,
      images: images,
      videos: videos
    });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Failed to get media files' });
  }
});

// Upload media file
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const fileId = require('crypto').randomUUID();
    const fileExtension = path.extname(originalname);
    const filename = `${fileId}${fileExtension}`;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Ensure uploads directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Save file to disk
    await fs.writeFile(filePath, buffer);

    // Save to database
    const fileUrl = `/uploads/${filename}`;
    await database.run(`
      INSERT INTO media_files (id, filename, original_name, url, size, file_type, character_id, upload_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [fileId, filename, originalname, fileUrl, size, mimetype, req.body.characterId || null, new Date().toISOString()]);

    res.json({
      success: true,
      file: {
        id: fileId,
        filename: originalname,
        url: fileUrl,
        size: size,
        type: mimetype
      }
    });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Delete media file
router.delete('/files/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Get file info
    const file = await database.get('SELECT filename FROM media_files WHERE id = ?', [fileId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Delete from filesystem
    const filePath = path.join(__dirname, '../uploads', file.filename);
    try {
      await fs.unlink(filePath);
    } catch (fsError) {
      console.warn('Could not delete file from filesystem:', fsError.message);
    }

    // Delete from database
    await database.run('DELETE FROM media_files WHERE id = ?', [fileId]);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// Assign media to character
router.post('/assign-character', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fileId, characterId } = req.body;
    
    await database.run(`
      UPDATE media_files 
      SET character_id = ? 
      WHERE id = ?
    `, [characterId, fileId]);

    res.json({ success: true, message: 'Media assigned to character' });
  } catch (error) {
    errorHandler.logError(error, req.user?.id);
    res.status(500).json({ success: false, message: 'Assignment failed' });
  }
});

module.exports = router;
