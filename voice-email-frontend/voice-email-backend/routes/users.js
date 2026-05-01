const express = require('express');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get email counts by folder
    const emailCounts = await database.all(
      `SELECT folder, COUNT(*) as count
       FROM emails 
       WHERE user_id = ?
       GROUP BY folder`,
      [userId]
    );

    // Get unread email count
    const unreadCount = await database.get(
      `SELECT COUNT(*) as count
       FROM emails 
       WHERE user_id = ? AND is_read = FALSE AND folder != 'trash'`,
      [userId]
    );

    // Get contact count
    const contactCount = await database.get(
      `SELECT COUNT(*) as count
       FROM contacts 
       WHERE user_id = ?`,
      [userId]
    );

    // Get favorite contacts count
    const favoriteContactsCount = await database.get(
      `SELECT COUNT(*) as count
       FROM contacts 
       WHERE user_id = ? AND is_favorite = TRUE`,
      [userId]
    );

    // Get draft count
    const draftCount = await database.get(
      `SELECT COUNT(*) as count
       FROM drafts 
       WHERE user_id = ?`,
      [userId]
    );

    // Get voice session count (last 30 days)
    const voiceSessionCount = await database.get(
      `SELECT COUNT(*) as count
       FROM voice_sessions 
       WHERE user_id = ? AND created_at >= datetime('now', '-30 days')`,
      [userId]
    );

    // Get recent activity
    const recentEmails = await database.all(
      `SELECT id, from_email, subject, created_at, folder
       FROM emails 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      stats: {
        emails: emailCounts.reduce((acc, row) => {
          acc[row.folder] = row.count;
          return acc;
        }, {}),
        unreadEmails: unreadCount.count,
        totalContacts: contactCount.count,
        favoriteContacts: favoriteContactsCount.count,
        drafts: draftCount.count,
        voiceSessionsThisMonth: voiceSessionCount.count,
        recentEmails
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: 'Unable to fetch user statistics'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await database.get(
      `SELECT voice_settings, accessibility_settings
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    const voiceSettings = JSON.parse(user.voice_settings || '{}');
    const accessibilitySettings = JSON.parse(user.accessibility_settings || '{}');

    res.json({
      preferences: {
        voice: voiceSettings,
        accessibility: accessibilitySettings
      }
    });

  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      error: 'Failed to retrieve preferences',
      message: 'Unable to fetch user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { voice, accessibility } = req.body;

    // Get current settings
    const user = await database.get(
      `SELECT voice_settings, accessibility_settings
       FROM users WHERE id = ?`,
      [userId]
    );

    const currentVoiceSettings = JSON.parse(user?.voice_settings || '{}');
    const currentAccessibilitySettings = JSON.parse(user?.accessibility_settings || '{}');

    // Build update query
    const updates = [];
    const values = [];

    if (voice !== undefined) {
      updates.push('voice_settings = ?');
      values.push(JSON.stringify({ ...currentVoiceSettings, ...voice }));
    }

    if (accessibility !== undefined) {
      updates.push('accessibility_settings = ?');
      values.push(JSON.stringify({ ...currentAccessibilitySettings, ...accessibility }));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No preferences provided',
        message: 'Please provide voice or accessibility preferences to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated preferences
    const updatedUser = await database.get(
      `SELECT voice_settings, accessibility_settings
       FROM users WHERE id = ?`,
      [userId]
    );

    const updatedVoiceSettings = JSON.parse(updatedUser.voice_settings || '{}');
    const updatedAccessibilitySettings = JSON.parse(updatedUser.accessibility_settings || '{}');

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        voice: updatedVoiceSettings,
        accessibility: updatedAccessibilitySettings
      }
    });

  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'Unable to update user preferences'
    });
  }
});

// Get user activity log
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Get recent emails
    const recentEmails = await database.all(
      `SELECT 'email' as type, 'sent' as action, to_email as target, 
              subject, created_at
       FROM emails 
       WHERE user_id = ? AND folder = 'sent'
       UNION ALL
       SELECT 'email' as type, 'received' as action, from_email as target, 
              subject, created_at
       FROM emails 
       WHERE user_id = ? AND folder = 'inbox'
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), parseInt(offset)]
    );

    // Get recent voice sessions
    const recentVoiceSessions = await database.all(
      `SELECT 'voice' as type, session_type as action, 
              transcript as target, created_at
       FROM voice_sessions 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Get recent contact changes
    const recentContacts = await database.all(
      `SELECT 'contact' as type, 'added' as action, 
              name as target, created_at
       FROM contacts 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Combine and sort all activities
    const allActivities = [
      ...recentEmails,
      ...recentVoiceSessions,
      ...recentContacts
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, parseInt(limit));

    res.json({
      activities: allActivities
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      error: 'Failed to retrieve activity',
      message: 'Unable to fetch user activity log'
    });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        error: 'Password confirmation required',
        message: 'Please provide your password to confirm account deletion'
      });
    }

    // Verify password
    const user = await database.get(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(confirmPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Incorrect password'
      });
    }

    // Delete user (cascade will handle related records)
    await database.run('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: 'Unable to delete user account'
    });
  }
});

// Export user data (GDPR compliance)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const user = await database.get(
      `SELECT id, email, name, profile_picture, voice_settings, 
              accessibility_settings, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    // Get all emails
    const emails = await database.all(
      `SELECT id, from_email, to_email, cc_email, bcc_email, subject, body,
              folder, is_read, is_starred, is_important, attachments,
              voice_transcript, created_at, updated_at
       FROM emails WHERE user_id = ?`,
      [userId]
    );

    // Get all contacts
    const contacts = await database.all(
      `SELECT id, name, email, phone, notes, avatar, is_favorite,
              created_at, updated_at
       FROM contacts WHERE user_id = ?`,
      [userId]
    );

    // Get all drafts
    const drafts = await database.all(
      `SELECT id, to_email, cc_email, bcc_email, subject, body,
              voice_transcript, created_at, updated_at
       FROM drafts WHERE user_id = ?`,
      [userId]
    );

    // Get voice sessions
    const voiceSessions = await database.all(
      `SELECT id, session_type, transcript, audio_duration,
              confidence_score, created_at
       FROM voice_sessions WHERE user_id = ?`,
      [userId]
    );

    const exportData = {
      user: {
        ...user,
        voice_settings: JSON.parse(user.voice_settings || '{}'),
        accessibility_settings: JSON.parse(user.accessibility_settings || '{}')
      },
      emails: emails.map(email => ({
        ...email,
        attachments: JSON.parse(email.attachments || '[]')
      })),
      contacts,
      drafts,
      voiceSessions,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="voice-email-data.json"');
    res.json(exportData);

  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: 'Unable to export user data'
    });
  }
});

module.exports = router;
