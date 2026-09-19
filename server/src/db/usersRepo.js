/**
 * usersRepo.js — Repository for user accounts
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

function resolveDataDir() {
  if (process.env.DATA_DIR) {
    if (path.isAbsolute(process.env.DATA_DIR)) return process.env.DATA_DIR;
    const fromCwd = path.resolve(process.env.DATA_DIR);
    if (fs.existsSync(fromCwd)) return fromCwd;
  }
  return path.resolve(__dirname, '..', '..', 'data');
}

const DATA_DIR = resolveDataDir();
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function ensureUsersFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    await fsp.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), 'utf-8');
  }
}

async function readUsers() {
  await ensureUsersFile();
  const raw = await fsp.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(raw).users || [];
}

async function writeUsers(users) {
  await ensureUsersFile();
  const tmp = path.join(DATA_DIR, `users-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await fsp.writeFile(tmp, JSON.stringify({ users }, null, 2), 'utf-8');
  await fsp.rename(tmp, USERS_FILE);
}

/**
 * Find user by email (case-insensitive).
 */
async function findByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Find user by ID.
 */
async function findById(id) {
  const users = await readUsers();
  return users.find(u => u.id === id) || null;
}

/**
 * Create a new user (hashes password).
 */
async function createUser({ name, email, password, role = 'tester' }) {
  const existing = await findByEmail(email);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const users = await readUsers();
  const now = new Date().toISOString();

  const user = {
    id: uuidv4(),
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,                // 'admin' | 'tester'
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  users.push(user);
  await writeUsers(users);

  // Return without password
  const { passwordHash: _, ...safe } = user;
  return safe;
}

/**
 * Verify a password against a stored hash.
 */
async function verifyPassword(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  // Update lastLoginAt
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === user.id);
  users[idx].lastLoginAt = new Date().toISOString();
  await writeUsers(users);

  const { passwordHash: _, ...safe } = users[idx];
  return safe;
}

/**
 * Get all users (admin view, no password hashes).
 */
async function getAllUsers() {
  const users = await readUsers();
  return users.map(({ passwordHash: _, ...u }) => u);
}

/**
 * Update user profile fields (name, role).
 */
async function updateUser(id, data) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  if (data.password) {
    users[idx].passwordHash = await bcrypt.hash(data.password, 12);
  }
  if (data.name) users[idx].name = data.name;
  if (data.role) users[idx].role = data.role;
  users[idx].updatedAt = new Date().toISOString();

  await writeUsers(users);
  const { passwordHash: _, ...safe } = users[idx];
  return safe;
}

async function ensureDefaultDemoUser() {
  const existing = await findByEmail('demo@loadportal.io');
  if (!existing) {
    await createUser({
      name: 'Demo Engineer',
      email: 'demo@loadportal.io',
      password: 'Password123!',
      role: 'tester',
    });
    console.log('✅ Default demo user verified: demo@loadportal.io / Password123!');
  }
}

module.exports = { createUser, findByEmail, findById, verifyPassword, getAllUsers, updateUser, ensureDefaultDemoUser };
