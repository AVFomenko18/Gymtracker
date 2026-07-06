const express = require('express');
const router = express.Router();
const pool = require('../db');
const { randomUUID, scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashBuf = await scryptAsync(password, salt, 64);
  const storedBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(hashBuf, storedBuf);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Заполни все поля' });
  }
  if (username.length < 3) return res.status(400).json({ error: 'Логин минимум 3 символа' });
  if (password.length < 4) return res.status(400).json({ error: 'Пароль минимум 4 символа' });

  const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
  if (exists.rows.length) return res.status(409).json({ error: 'Логин уже занят' });

  const password_hash = await hashPassword(password);
  const token = randomUUID();

  const result = await pool.query(
    `INSERT INTO users (username, password_hash, name, device_token)
     VALUES ($1, $2, $3, $4) RETURNING id, name, username, avatar_data`,
    [username.toLowerCase(), password_hash, name.trim(), token]
  );

  const user = result.rows[0];
  res.json({ token, name: user.name, username: user.username, avatar_data: user.avatar_data });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Введи логин и пароль' });

  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
  if (!result.rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const user = result.rows[0];
  if (!user.password_hash) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

  // Refresh token on each login for security
  const token = randomUUID();
  await pool.query('UPDATE users SET device_token = $1 WHERE id = $2', [token, user.id]);

  res.json({ token, name: user.name, username: user.username, avatar_data: user.avatar_data });
});

module.exports = router;
