const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('./database'); // Assuming you have a database module

// Secret key for JWT
const JWT_SECRET = 'your-super-secret-key'; // Replace with a strong, securely stored secret

// User registration
router.post('/register', async (req, res) => {
  const { username, password, is_admin } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await database.run('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', [username, hashedPassword, is_admin || false]);
    res.status(201).json({ success: true, message: 'User registered successfully', userId: result.lastID });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to register user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const user = await database.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'Login successful', token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // If no token is provided

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.sendStatus(403); // If token is invalid
    }
    req.user = user; // Attach user info to the request object
    next();
  });
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    // Fetch user from the database using the ID from the authenticated token
    const user = await database.get('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);

    if (!user || !user.is_admin) {
      // If user is not found or not an admin, send a 403 Forbidden response
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // If the user is an admin, proceed to the next middleware or route handler
    next();
  } catch (error) {
    // If there's a database error during the authorization check
    console.error('Admin authorization check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};


module.exports = { router, authenticateToken, requireAdmin };