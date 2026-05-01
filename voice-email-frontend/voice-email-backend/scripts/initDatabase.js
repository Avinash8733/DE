#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes the SQLite database with all required tables
 */

require('dotenv').config();
const database = require('../models/database');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to database and initialize tables
    await database.connect();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('📊 Database location:', process.env.DB_PATH || './database/voice_email.db');
    
    // Test the database with a simple query
    const tables = await database.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
