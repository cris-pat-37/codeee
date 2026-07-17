import mongoose from 'mongoose';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Optional MongoDB Connection
export const connectMongoDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI configured, skipping MongoDB connection.');
    return;
  }
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Error: ${error.message}`);
  }
};

// 2. Core SQLite Database Connection
const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../cms/strapi/.tmp/data.db');
console.log(`Connecting to SQLite Database at: ${dbPath}`);

const sqliteDB = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`SQLite Connection Error: ${err.message}`);
  } else {
    console.log('SQLite Database Connected.');
    
    // Auto-create leads table if it doesn't exist
    sqliteDB.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        property_title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error(`Error initializing SQLite leads table: ${err.message}`);
      } else {
        console.log('SQLite leads table initialized.');
      }
    });
  }
});

// Promise-based wrappers for SQLite operations
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDB.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDB.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDB.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export default sqliteDB;
