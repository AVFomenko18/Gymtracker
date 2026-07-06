const express = require('express');
const router = express.Router();
const pool = require('../db');
const { randomUUID } = require('crypto');

router.post('/login', async (req, res) => {
  const { pin, name } = req.body;
  const correctPin = process.env.USER_PIN;
  if (!correctPin) return res.status(500).json({ error: 'USER_PIN не настроен на сервере' });
  if (String(pin) !== String(correctPin)) {
    return res.status(401).json({ error: 'Неверный PIN' });
  }

  const existing = await pool.query('SELECT * FROM users LIMIT 1');

  if (existing.rows.length) {
    const user = existing.rows[0];
    if (!user.device_token) {
      const token = randomUUID();
      await pool.query('UPDATE users SET device_token = $1 WHERE id = $2', [token, user.id]);
      return res.json({ token, name: user.name || user.first_name || 'Пользователь' });
    }
    return res.json({ token: user.device_token, name: user.name || user.first_name || 'Пользователь' });
  }

  // First time — create user
  const token = randomUUID();
  const userName = (name || '').trim() || 'Пользователь';
  await pool.query(
    `INSERT INTO users (name, device_token) VALUES ($1, $2)`,
    [userName, token]
  );
  res.json({ token, name: userName });
});

module.exports = router;
