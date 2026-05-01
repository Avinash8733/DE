const express = require('express');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validateContact, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all contacts with pagination and search
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { search, favorites } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (favorites === 'true') {
      whereClause += ' AND is_favorite = TRUE';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM contacts ${whereClause}`;
    const countResult = await database.get(countQuery, params);
    const total = countResult.total;

    // Get contacts
    const contactsQuery = `
      SELECT id, name, email, phone, notes, avatar, is_favorite, 
             created_at, updated_at
      FROM contacts 
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;
    
    const contacts = await database.all(contactsQuery, [...params, limit, offset]);

    res.json({
      contacts,
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
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve contacts',
      message: 'Unable to fetch contacts'
    });
  }
});

// Get single contact
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const contact = await database.get(
      `SELECT id, name, email, phone, notes, avatar, is_favorite, 
              created_at, updated_at
       FROM contacts 
       WHERE id = ? AND user_id = ?`,
      [contactId, userId]
    );

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        message: 'The requested contact does not exist'
      });
    }

    res.json({ contact });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      error: 'Failed to retrieve contact',
      message: 'Unable to fetch contact'
    });
  }
});

// Create new contact
router.post('/', authenticateToken, validateContact, async (req, res) => {
  try {
    const { name, email, phone, notes, avatar, isFavorite } = req.body;
    const userId = req.user.id;

    // Check if contact with same email already exists for this user
    const existingContact = await database.get(
      'SELECT id FROM contacts WHERE user_id = ? AND email = ?',
      [userId, email]
    );

    if (existingContact) {
      return res.status(409).json({
        error: 'Contact already exists',
        message: 'A contact with this email address already exists'
      });
    }

    const result = await database.run(
      `INSERT INTO contacts (user_id, name, email, phone, notes, avatar, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, phone || null, notes || null, avatar || null, isFavorite || false]
    );

    // Fetch the created contact
    const newContact = await database.get(
      `SELECT id, name, email, phone, notes, avatar, is_favorite, 
              created_at, updated_at
       FROM contacts WHERE id = ?`,
      [result.id]
    );

    res.status(201).json({
      message: 'Contact created successfully',
      contact: newContact
    });

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      error: 'Failed to create contact',
      message: 'Unable to create contact'
    });
  }
});

// Update contact
router.put('/:id', authenticateToken, validateId, validateContact, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;
    const { name, email, phone, notes, avatar, isFavorite } = req.body;

    // Check if contact exists and belongs to user
    const existingContact = await database.get(
      'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId]
    );

    if (!existingContact) {
      return res.status(404).json({
        error: 'Contact not found',
        message: 'The requested contact does not exist'
      });
    }

    // Check if email is being changed to one that already exists
    const emailConflict = await database.get(
      'SELECT id FROM contacts WHERE user_id = ? AND email = ? AND id != ?',
      [userId, email, contactId]
    );

    if (emailConflict) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'Another contact with this email address already exists'
      });
    }

    await database.run(
      `UPDATE contacts 
       SET name = ?, email = ?, phone = ?, notes = ?, avatar = ?, 
           is_favorite = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, email, phone || null, notes || null, avatar || null, isFavorite || false, contactId, userId]
    );

    // Fetch updated contact
    const updatedContact = await database.get(
      `SELECT id, name, email, phone, notes, avatar, is_favorite, 
              created_at, updated_at
       FROM contacts WHERE id = ?`,
      [contactId]
    );

    res.json({
      message: 'Contact updated successfully',
      contact: updatedContact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      error: 'Failed to update contact',
      message: 'Unable to update contact'
    });
  }
});

// Toggle favorite status
router.put('/:id/favorite', authenticateToken, validateId, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    // Get current favorite status
    const contact = await database.get(
      'SELECT is_favorite FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId]
    );

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        message: 'The requested contact does not exist'
      });
    }

    const newFavoriteStatus = !contact.is_favorite;

    await database.run(
      'UPDATE contacts SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [newFavoriteStatus, contactId, userId]
    );

    res.json({
      message: `Contact ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`,
      isFavorite: newFavoriteStatus
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: 'Failed to toggle favorite',
      message: 'Unable to update contact favorite status'
    });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const result = await database.run(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Contact not found',
        message: 'The requested contact does not exist'
      });
    }

    res.json({
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      error: 'Failed to delete contact',
      message: 'Unable to delete contact'
    });
  }
});

// Bulk operations
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { action, contactIds } = req.body;
    const userId = req.user.id;

    if (!action || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Action and contactIds array are required'
      });
    }

    const placeholders = contactIds.map(() => '?').join(',');
    const params = [userId, ...contactIds];

    let query;
    let message;

    switch (action) {
      case 'delete':
        query = `DELETE FROM contacts WHERE user_id = ? AND id IN (${placeholders})`;
        message = 'Contacts deleted successfully';
        break;
      
      case 'favorite':
        query = `UPDATE contacts SET is_favorite = TRUE, updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = ? AND id IN (${placeholders})`;
        message = 'Contacts added to favorites';
        break;
      
      case 'unfavorite':
        query = `UPDATE contacts SET is_favorite = FALSE, updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = ? AND id IN (${placeholders})`;
        message = 'Contacts removed from favorites';
        break;
      
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Action must be one of: delete, favorite, unfavorite'
        });
    }

    const result = await database.run(query, params);

    res.json({
      message,
      affectedCount: result.changes
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      error: 'Bulk operation failed',
      message: 'Unable to perform bulk operation'
    });
  }
});

// Import contacts (for future CSV import functionality)
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { contacts } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Contacts array is required'
      });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const contactData of contacts) {
      try {
        const { name, email, phone, notes } = contactData;

        // Validate required fields
        if (!name || !email) {
          results.errors.push(`Skipped contact: name and email are required`);
          results.skipped++;
          continue;
        }

        // Check if contact already exists
        const existingContact = await database.get(
          'SELECT id FROM contacts WHERE user_id = ? AND email = ?',
          [userId, email]
        );

        if (existingContact) {
          results.skipped++;
          continue;
        }

        // Create contact
        await database.run(
          `INSERT INTO contacts (user_id, name, email, phone, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, name, email, phone || null, notes || null]
        );

        results.imported++;

      } catch (error) {
        results.errors.push(`Error importing ${contactData.email}: ${error.message}`);
        results.skipped++;
      }
    }

    res.json({
      message: 'Import completed',
      results
    });

  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: 'Unable to import contacts'
    });
  }
});

// Export contacts
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await database.all(
      `SELECT name, email, phone, notes, is_favorite, created_at
       FROM contacts 
       WHERE user_id = ?
       ORDER BY name ASC`,
      [userId]
    );

    // Generate CSV
    const csvHeader = 'Name,Email,Phone,Notes,Favorite,Created\n';
    const csvRows = contacts.map(contact => {
      const name = `"${(contact.name || '').replace(/"/g, '""')}"`;
      const email = `"${(contact.email || '').replace(/"/g, '""')}"`;
      const phone = `"${(contact.phone || '').replace(/"/g, '""')}"`;
      const notes = `"${(contact.notes || '').replace(/"/g, '""')}"`;
      const favorite = contact.is_favorite ? 'Yes' : 'No';
      const created = contact.created_at;
      
      return `${name},${email},${phone},${notes},${favorite},${created}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send(csv);

  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Unable to export contacts'
    });
  }
});

module.exports = router;
