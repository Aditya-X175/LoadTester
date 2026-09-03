/**
 * authMiddleware.js — JWT verification middleware
 */
const jwt = require('jsonwebtoken');
const { findById } = require('../db/usersRepo');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

/**
 * Require a valid JWT Bearer token.
 * Attaches req.user = { id, name, email, role } on success.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}

/**
 * Require admin role.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Sign a JWT for a user.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken };
