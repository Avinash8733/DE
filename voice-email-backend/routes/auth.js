const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../models/database');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await database.run(
      `INSERT INTO users (email, password, name, voice_settings, accessibility_settings) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        name,
        JSON.stringify({
          speechRate: 1.0,
          speechPitch: 1.0,
          speechVolume: 1.0,
          preferredVoice: 'default',
          autoRead: true
        }),
        JSON.stringify({
          highContrast: false,
          largeText: false,
          screenReaderOptimized: true,
          keyboardNavigation: true
        })
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.id,
        email,
        name
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create user account'
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await database.get(
      'SELECT id, email, password, name FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to authenticate user'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await database.get(
      `SELECT id, email, name, profile_picture, voice_settings, 
              accessibility_settings, created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Parse JSON settings
    user.voice_settings = JSON.parse(user.voice_settings || '{}');
    user.accessibility_settings = JSON.parse(user.accessibility_settings || '{}');

    res.json({
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Unable to retrieve user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, voice_settings, accessibility_settings } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (voice_settings !== undefined) {
      updates.push('voice_settings = ?');
      values.push(JSON.stringify(voice_settings));
    }

    if (accessibility_settings !== undefined) {
      updates.push('accessibility_settings = ?');
      values.push(JSON.stringify(accessibility_settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated user
    const updatedUser = await database.get(
      `SELECT id, email, name, profile_picture, voice_settings, 
              accessibility_settings, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    updatedUser.voice_settings = JSON.parse(updatedUser.voice_settings || '{}');
    updatedUser.accessibility_settings = JSON.parse(updatedUser.accessibility_settings || '{}');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Unable to update user profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    const user = await database.get(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await database.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'Unable to change password'
    });
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Logout (client-side token removal, but we can log the event)
router.post('/logout', authenticateToken, (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we just acknowledge the logout
  res.json({
    message: 'Logged out successfully'
  });
});

module.exports = router;
