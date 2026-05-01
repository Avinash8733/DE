const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './database/voice_email.db';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('📊 Connected to SQLite database');
          this.initializeTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  async initializeTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        profile_picture TEXT,
        voice_settings TEXT DEFAULT '{}',
        accessibility_settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Emails table
      `CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        from_email TEXT NOT NULL,
        to_email TEXT NOT NULL,
        cc_email TEXT,
        bcc_email TEXT,
        subject TEXT,
        body TEXT NOT NULL,
        html_body TEXT,
        folder TEXT DEFAULT 'inbox',
        is_read BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        attachments TEXT DEFAULT '[]',
        voice_transcript TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        notes TEXT,
        avatar TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Voice sessions table (for tracking voice interactions)
      `CREATE TABLE IF NOT EXISTS voice_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_type TEXT NOT NULL,
        transcript TEXT,
        audio_duration INTEGER,
        confidence_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Email drafts table
      `CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        to_email TEXT,
        cc_email TEXT,
        bcc_email TEXT,
        subject TEXT,
        body TEXT,
        voice_transcript TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder)',
      'CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)',
      'CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }

    console.log('✅ Database tables initialized');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('📊 Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
