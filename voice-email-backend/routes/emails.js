const express = require('express');
const nodemailer = require('nodemailer');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateEmailComposition, 
  validateId, 
  validatePagination, 
  validateEmailFilters 
} = require('../middleware/validation');

const router = express.Router();

// Configure email transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Get emails with filtering and pagination
router.get('/', authenticateToken, validatePagination, validateEmailFilters, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { folder = 'inbox', isRead, isStarred, search } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE user_id = ? AND folder = ?';
    let params = [userId, folder];

    if (isRead !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(isRead === 'true');
    }

    if (isStarred !== undefined) {
      whereClause += ' AND is_starred = ?';
      params.push(isStarred === 'true');
    }

    if (search) {
      whereClause += ' AND (subject LIKE ? OR body LIKE ? OR from_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM emails ${whereClause}`;
    const countResult = await database.get(countQuery, params);
    const total = countResult.total;

    // Get emails
    const emailsQuery = `
      SELECT id, from_email, to_email, cc_email, bcc_email, subject, body, 
             folder, is_read, is_starred, is_important, attachments, 
             voice_transcript, created_at, updated_at
      FROM emails 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const emails = await database.all(emailsQuery, [...params, limit, offset]);

    // Parse JSON fields
    emails.forEach(email => {
      email.attachments = JSON.parse(email.attachments || '[]');
    });

    res.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      error: 'Failed to retrieve emails',
      message: 'Unable to fetch emails'
    });
  }
});

// Get single email
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.id;

    const email = await database.get(
      `SELECT id, from_email, to_email, cc_email, bcc_email, subject, body, html_body,
              folder, is_read, is_starred, is_important, attachments, 
              voice_transcript, created_at, updated_at
       FROM emails 
       WHERE id = ? AND user_id = ?`,
      [emailId, userId]
    );

    if (!email) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'The requested email does not exist'
      });
    }

    // Parse JSON fields
    email.attachments = JSON.parse(email.attachments || '[]');

    // Mark as read if it wasn't already
    if (!email.is_read) {
      await database.run(
        'UPDATE emails SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [emailId]
      );
      email.is_read = true;
    }

    res.json({ email });

  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({
      error: 'Failed to retrieve email',
      message: 'Unable to fetch email'
    });
  }
});

// Send email
router.post('/send', authenticateToken, validateEmailComposition, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, voiceTranscript } = req.body;
    const userId = req.user.id;
    const fromEmail = req.user.email;

    // Store email in database first
    const result = await database.run(
      `INSERT INTO emails (user_id, from_email, to_email, cc_email, bcc_email, 
                          subject, body, folder, is_read, voice_transcript)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', TRUE, ?)`,
      [userId, fromEmail, to, cc || null, bcc || null, subject || '', body, voiceTranscript || null]
    );

    // Try to send actual email if SMTP is configured
    let emailSent = false;
    let emailError = null;

    if (transporter) {
      try {
        const mailOptions = {
          from: fromEmail,
          to: to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject: subject || 'No Subject',
          text: body,
          html: `<p>${body.replace(/\n/g, '<br>')}</p>`
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (smtpError) {
        console.error('SMTP send error:', smtpError);
        emailError = smtpError.message;
      }
    }

    res.status(201).json({
      message: emailSent ? 'Email sent successfully' : 'Email saved (SMTP not configured)',
      emailId: result.id,
      sent: emailSent,
      ...(emailError && { warning: `Email saved but not sent: ${emailError}` })
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: 'Unable to send email'
    });
  }
});

// Save draft
router.post('/drafts', authenticateToken, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, voiceTranscript } = req.body;
    const userId = req.user.id;

    const result = await database.run(
      `INSERT INTO drafts (user_id, to_email, cc_email, bcc_email, 
                          subject, body, voice_transcript)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, to || null, cc || null, bcc || null, subject || '', body || '', voiceTranscript || null]
    );

    res.status(201).json({
      message: 'Draft saved successfully',
      draftId: result.id
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      error: 'Failed to save draft',
      message: 'Unable to save draft'
    });
  }
});

// Get drafts
router.get('/drafts/list', authenticateToken, validatePagination, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM drafts WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    // Get drafts
    const drafts = await database.all(
      `SELECT id, to_email, cc_email, bcc_email, subject, body, 
              voice_transcript, created_at, updated_at
       FROM drafts 
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve drafts',
      message: 'Unable to fetch drafts'
    });
  }
});

// Update draft
router.put('/drafts/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user.id;
    const { to, cc, bcc, subject, body, voiceTranscript } = req.body;

    // Check if draft exists and belongs to user
    const existingDraft = await database.get(
      'SELECT id FROM drafts WHERE id = ? AND user_id = ?',
      [draftId, userId]
    );

    if (!existingDraft) {
      return res.status(404).json({
        error: 'Draft not found',
        message: 'The requested draft does not exist'
      });
    }

    await database.run(
      `UPDATE drafts 
       SET to_email = ?, cc_email = ?, bcc_email = ?, subject = ?, 
           body = ?, voice_transcript = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [to || null, cc || null, bcc || null, subject || '', body || '', voiceTranscript || null, draftId, userId]
    );

    res.json({
      message: 'Draft updated successfully'
    });

  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({
      error: 'Failed to update draft',
      message: 'Unable to update draft'
    });
  }
});

// Delete draft
router.delete('/drafts/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user.id;

    const result = await database.run(
      'DELETE FROM drafts WHERE id = ? AND user_id = ?',
      [draftId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Draft not found',
        message: 'The requested draft does not exist'
      });
    }

    res.json({
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      error: 'Failed to delete draft',
      message: 'Unable to delete draft'
    });
  }
});

// Move email to folder (trash, archive, etc.)
router.put('/:id/move', authenticateToken, validateId, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.id;
    const { folder } = req.body;

    if (!['inbox', 'sent', 'drafts', 'trash'].includes(folder)) {
      return res.status(400).json({
        error: 'Invalid folder',
        message: 'Folder must be one of: inbox, sent, drafts, trash'
      });
    }

    const result = await database.run(
      'UPDATE emails SET folder = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [folder, emailId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'The requested email does not exist'
      });
    }

    res.json({
      message: `Email moved to ${folder} successfully`
    });

  } catch (error) {
    console.error('Move email error:', error);
    res.status(500).json({
      error: 'Failed to move email',
      message: 'Unable to move email'
    });
  }
});

// Toggle email star
router.put('/:id/star', authenticateToken, validateId, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.id;

    // Get current star status
    const email = await database.get(
      'SELECT is_starred FROM emails WHERE id = ? AND user_id = ?',
      [emailId, userId]
    );

    if (!email) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'The requested email does not exist'
      });
    }

    const newStarStatus = !email.is_starred;

    await database.run(
      'UPDATE emails SET is_starred = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [newStarStatus, emailId, userId]
    );

    res.json({
      message: `Email ${newStarStatus ? 'starred' : 'unstarred'} successfully`,
      isStarred: newStarStatus
    });

  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({
      error: 'Failed to toggle star',
      message: 'Unable to update email star status'
    });
  }
});

// Mark email as read/unread
router.put('/:id/read', authenticateToken, validateId, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.id;
    const { isRead } = req.body;

    if (typeof isRead !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid read status',
        message: 'isRead must be a boolean value'
      });
    }

    const result = await database.run(
      'UPDATE emails SET is_read = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [isRead, emailId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'The requested email does not exist'
      });
    }

    res.json({
      message: `Email marked as ${isRead ? 'read' : 'unread'} successfully`,
      isRead
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      error: 'Failed to update read status',
      message: 'Unable to update email read status'
    });
  }
});

// Delete email permanently
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.id;

    const result = await database.run(
      'DELETE FROM emails WHERE id = ? AND user_id = ?',
      [emailId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'The requested email does not exist'
      });
    }

    res.json({
      message: 'Email deleted permanently'
    });

  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      error: 'Failed to delete email',
      message: 'Unable to delete email'
    });
  }
});

module.exports = router;
