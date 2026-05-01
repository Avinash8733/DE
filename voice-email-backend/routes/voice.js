const express = require('express');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validateVoiceSession } = require('../middleware/validation');

const router = express.Router();

// Save voice session data
router.post('/session', authenticateToken, validateVoiceSession, async (req, res) => {
  try {
    const { sessionType, transcript, audioDuration, confidenceScore } = req.body;
    const userId = req.user.id;

    const result = await database.run(
      `INSERT INTO voice_sessions (user_id, session_type, transcript, 
                                  audio_duration, confidence_score)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, sessionType, transcript || null, audioDuration || null, confidenceScore || null]
    );

    res.status(201).json({
      message: 'Voice session saved successfully',
      sessionId: result.id
    });

  } catch (error) {
    console.error('Save voice session error:', error);
    res.status(500).json({
      error: 'Failed to save voice session',
      message: 'Unable to save voice session data'
    });
  }
});

// Get voice session history
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionType, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (sessionType) {
      whereClause += ' AND session_type = ?';
      params.push(sessionType);
    }

    const sessions = await database.all(
      `SELECT id, session_type, transcript, audio_duration, 
              confidence_score, created_at
       FROM voice_sessions 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      sessions
    });

  } catch (error) {
    console.error('Get voice sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve voice sessions',
      message: 'Unable to fetch voice session history'
    });
  }
});

// Process voice command (for advanced voice processing)
router.post('/command', authenticateToken, async (req, res) => {
  try {
    const { command, context } = req.body;
    const userId = req.user.id;

    if (!command) {
      return res.status(400).json({
        error: 'Missing command',
        message: 'Voice command is required'
      });
    }

    // Simple command processing logic
    const processedCommand = await processVoiceCommand(command, context, userId);

    // Save the command session
    await database.run(
      `INSERT INTO voice_sessions (user_id, session_type, transcript)
       VALUES (?, 'command', ?)`,
      [userId, command]
    );

    res.json({
      message: 'Voice command processed',
      command: processedCommand
    });

  } catch (error) {
    console.error('Process voice command error:', error);
    res.status(500).json({
      error: 'Failed to process voice command',
      message: 'Unable to process voice command'
    });
  }
});

// Voice analytics for the user
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get session counts by type
    const sessionCounts = await database.all(
      `SELECT session_type, COUNT(*) as count
       FROM voice_sessions 
       WHERE user_id = ?
       GROUP BY session_type`,
      [userId]
    );

    // Get average confidence score
    const avgConfidence = await database.get(
      `SELECT AVG(confidence_score) as avg_confidence
       FROM voice_sessions 
       WHERE user_id = ? AND confidence_score IS NOT NULL`,
      [userId]
    );

    // Get total audio duration
    const totalDuration = await database.get(
      `SELECT SUM(audio_duration) as total_duration
       FROM voice_sessions 
       WHERE user_id = ? AND audio_duration IS NOT NULL`,
      [userId]
    );

    // Get recent activity (last 7 days)
    const recentActivity = await database.all(
      `SELECT DATE(created_at) as date, COUNT(*) as sessions
       FROM voice_sessions 
       WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      analytics: {
        sessionCounts: sessionCounts.reduce((acc, row) => {
          acc[row.session_type] = row.count;
          return acc;
        }, {}),
        averageConfidence: avgConfidence?.avg_confidence || 0,
        totalAudioDuration: totalDuration?.total_duration || 0,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get voice analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics',
      message: 'Unable to fetch voice analytics'
    });
  }
});

// Text-to-speech preferences
router.get('/tts-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await database.get(
      'SELECT voice_settings FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    const voiceSettings = JSON.parse(user.voice_settings || '{}');

    res.json({
      preferences: {
        speechRate: voiceSettings.speechRate || 1.0,
        speechPitch: voiceSettings.speechPitch || 1.0,
        speechVolume: voiceSettings.speechVolume || 1.0,
        preferredVoice: voiceSettings.preferredVoice || 'default',
        autoRead: voiceSettings.autoRead !== false
      }
    });

  } catch (error) {
    console.error('Get TTS preferences error:', error);
    res.status(500).json({
      error: 'Failed to retrieve TTS preferences',
      message: 'Unable to fetch text-to-speech preferences'
    });
  }
});

// Update text-to-speech preferences
router.put('/tts-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { speechRate, speechPitch, speechVolume, preferredVoice, autoRead } = req.body;

    // Get current voice settings
    const user = await database.get(
      'SELECT voice_settings FROM users WHERE id = ?',
      [userId]
    );

    const currentSettings = JSON.parse(user?.voice_settings || '{}');

    // Update with new values
    const updatedSettings = {
      ...currentSettings,
      ...(speechRate !== undefined && { speechRate: parseFloat(speechRate) }),
      ...(speechPitch !== undefined && { speechPitch: parseFloat(speechPitch) }),
      ...(speechVolume !== undefined && { speechVolume: parseFloat(speechVolume) }),
      ...(preferredVoice !== undefined && { preferredVoice }),
      ...(autoRead !== undefined && { autoRead: Boolean(autoRead) })
    };

    await database.run(
      'UPDATE users SET voice_settings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedSettings), userId]
    );

    res.json({
      message: 'TTS preferences updated successfully',
      preferences: updatedSettings
    });

  } catch (error) {
    console.error('Update TTS preferences error:', error);
    res.status(500).json({
      error: 'Failed to update TTS preferences',
      message: 'Unable to update text-to-speech preferences'
    });
  }
});

// Helper function to process voice commands
async function processVoiceCommand(command, context, userId) {
  const cmd = command.toLowerCase().trim();
  
  // Navigation commands
  if (cmd.includes('compose') || cmd.includes('write email')) {
    return {
      action: 'navigate',
      target: 'compose',
      response: 'Navigating to compose email'
    };
  }
  
  if (cmd.includes('inbox') || cmd.includes('read emails')) {
    return {
      action: 'navigate',
      target: 'inbox',
      response: 'Opening inbox'
    };
  }
  
  if (cmd.includes('contacts') || cmd.includes('contact list')) {
    return {
      action: 'navigate',
      target: 'contacts',
      response: 'Opening contacts'
    };
  }
  
  if (cmd.includes('sent') || cmd.includes('sent emails')) {
    return {
      action: 'navigate',
      target: 'sent',
      response: 'Opening sent emails'
    };
  }
  
  if (cmd.includes('drafts') || cmd.includes('draft emails')) {
    return {
      action: 'navigate',
      target: 'drafts',
      response: 'Opening drafts'
    };
  }
  
  if (cmd.includes('trash') || cmd.includes('deleted emails')) {
    return {
      action: 'navigate',
      target: 'trash',
      response: 'Opening trash'
    };
  }
  
  if (cmd.includes('settings') || cmd.includes('preferences')) {
    return {
      action: 'navigate',
      target: 'settings',
      response: 'Opening settings'
    };
  }

  // Email actions
  if (cmd.includes('send email') || cmd.includes('send message')) {
    return {
      action: 'email_action',
      target: 'send',
      response: 'Ready to send email'
    };
  }

  if (cmd.includes('read email') || cmd.includes('read message')) {
    return {
      action: 'email_action',
      target: 'read',
      response: 'Reading email'
    };
  }

  if (cmd.includes('delete email') || cmd.includes('delete message')) {
    return {
      action: 'email_action',
      target: 'delete',
      response: 'Email will be deleted'
    };
  }

  // Contact actions
  if (cmd.includes('add contact') || cmd.includes('new contact')) {
    return {
      action: 'contact_action',
      target: 'add',
      response: 'Ready to add new contact'
    };
  }

  if (cmd.includes('call') || cmd.includes('phone')) {
    // Extract potential name or number
    const words = cmd.split(' ');
    const nameIndex = words.findIndex(word => word === 'call' || word === 'phone');
    const contactName = words.slice(nameIndex + 1).join(' ');
    
    return {
      action: 'contact_action',
      target: 'call',
      contactName,
      response: contactName ? `Calling ${contactName}` : 'Who would you like to call?'
    };
  }

  // Help commands
  if (cmd.includes('help') || cmd.includes('what can you do')) {
    return {
      action: 'help',
      response: 'I can help you navigate, compose emails, manage contacts, and more. Try saying "compose email", "read inbox", or "add contact".'
    };
  }

  // Default response for unrecognized commands
  return {
    action: 'unknown',
    response: 'I didn\'t understand that command. Try saying "help" for available commands.'
  };
}

module.exports = router;
