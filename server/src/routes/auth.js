/**
 * auth.js — Authentication routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout  (client-side, just for completeness)
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { createUser, verifyPassword } = require('../db/usersRepo');
const { requireAuth, signToken } = require('../middleware/authMiddleware');

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register — create new account
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { name, email, password } = parsed.data;
    const user = await createUser({ name, email, password });
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully! Welcome aboard 🎉',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — authenticate
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { email, password } = parsed.data;
    const user = await verifyPassword(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    const token = signToken(user);
    res.json({
      message: `Welcome back, ${user.name}!`,
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout — (token invalidation is client-side for JWT)
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
