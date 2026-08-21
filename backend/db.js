const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nexkittool_db.json');

// Helper to read database directly from disk
function readDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (!data.users) data.users = [];
      if (!data.sessions) data.sessions = [];
      return data;
    }
  } catch (err) {
    console.error('Database read failed:', err.message);
  }
  return { users: [], sessions: [] };
}

// Helper to write database directly to disk
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Database write failed:', err.message);
  }
}

// Auto-initialize DB structure on file creation
if (!fs.existsSync(DB_PATH)) {
  writeDatabase({ users: [], sessions: [] });
}

const dbHelper = {
  // Mock standard SQL get helper
  async get(query, params = []) {
    const data = readDatabase();
    if (query.includes('FROM sessions')) {
      const token = params[0];
      return data.sessions.find(s => s.token === token) || null;
    }
    return null;
  },

  // Mock standard SQL run helper
  async run(query, params = []) {
    const data = readDatabase();
    if (query.includes('INSERT INTO sessions')) {
      const [token, userId, createdAt] = params;
      data.sessions = data.sessions.filter(s => s.token !== token);
      data.sessions.push({ token, userId, createdAt });
      writeDatabase(data);
    } else if (query.includes('DELETE FROM sessions')) {
      const token = params[0];
      data.sessions = data.sessions.filter(s => s.token !== token);
      writeDatabase(data);
    } else if (query.includes('UPDATE users SET verified = 1')) {
      const id = params[0];
      const user = data.users.find(u => u.id === id);
      if (user) {
        user.verified = 1;
        writeDatabase(data);
      }
    }
    return { changes: 1 };
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const data = readDatabase();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (user) {
      return { ...user, verified: user.verified === 1 };
    }
    return null;
  },

  async getUserById(id) {
    if (!id) return null;
    const data = readDatabase();
    const user = data.users.find(u => u.id === id);
    if (user) {
      return { ...user, verified: user.verified === 1 };
    }
    return null;
  },

  async createUser(id, name, email, password, plan = 'free', verified = false) {
    const data = readDatabase();
    const newUser = {
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      plan,
      verified: verified ? 1 : 0,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeDatabase(data);
    return this.getUserById(id);
  },

  async updateUserPlan(userId, plan) {
    const data = readDatabase();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.plan = plan;
      writeDatabase(data);
    }
    return this.getUserById(userId);
  },

  async verifyUserEmail(email) {
    const data = readDatabase();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (user) {
      user.verified = 1;
      writeDatabase(data);
    }
  },

  async updateUserPassword(email, hashedPassword) {
    const data = readDatabase();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (user) {
      user.password = hashedPassword;
      writeDatabase(data);
    }
  },

  async createSession(token, userId) {
    const data = readDatabase();
    data.sessions = data.sessions.filter(s => s.token !== token);
    data.sessions.push({ token, userId, createdAt: new Date().toISOString() });
    writeDatabase(data);
  },

  async deleteSession(token) {
    const data = readDatabase();
    data.sessions = data.sessions.filter(s => s.token !== token);
    writeDatabase(data);
  }
};

module.exports = dbHelper;
