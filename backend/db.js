const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'nexkittool.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Auto-initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      plan TEXT DEFAULT 'free',
      verified INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Table creation failed:', err.message);
    } else {
      console.log('Users table ready.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT,
      createdAt TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Sessions table creation failed:', err.message);
    } else {
      console.log('Sessions table ready.');
    }
  });
});

// Helper wrapper to run queries with promises
const dbHelper = {
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  // DB Methods
  async getUserByEmail(email) {
    if (!email) return null;
    const row = await this.get('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
    if (row) {
      row.verified = row.verified === 1;
    }
    return row;
  },

  async getUserById(id) {
    if (!id) return null;
    const row = await this.get('SELECT * FROM users WHERE id = ?', [id]);
    if (row) {
      row.verified = row.verified === 1;
    }
    return row;
  },

  async createUser(id, name, email, password, plan = 'free', verified = false) {
    await this.run(
      'INSERT INTO users (id, name, email, password, plan, verified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), email.toLowerCase().trim(), password, plan, verified ? 1 : 0, new Date().toISOString()]
    );
    return this.getUserById(id);
  },

  async updateUserPlan(userId, plan) {
    await this.run('UPDATE users SET plan = ? WHERE id = ?', [plan, userId]);
    return this.getUserById(userId);
  },

  async verifyUserEmail(email) {
    await this.run('UPDATE users SET verified = 1 WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
  },

  async updateUserPassword(email, hashedPassword) {
    await this.run('UPDATE users SET password = ? WHERE LOWER(email) = ?', [hashedPassword, email.toLowerCase().trim()]);
  },

  async createSession(token, userId) {
    await this.run('INSERT INTO sessions (token, userId, createdAt) VALUES (?, ?, ?)', [token, userId, new Date().toISOString()]);
  },

  async deleteSession(token) {
    await this.run('DELETE FROM sessions WHERE token = ?', [token]);
  }
};

module.exports = dbHelper;
