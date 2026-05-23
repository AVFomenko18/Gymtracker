const crypto = require('crypto');
const pool = require('../db');

function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (expectedHash !== hash) return null;

  const userParam = params.get('user');
  if (!userParam) return null;
  return JSON.parse(userParam);
}

async function authMiddleware(req, res, next) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'BOT_TOKEN env variable is not set on the server' });
  }

  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram auth' });
  }

  const user = verifyTelegramInitData(initData, botToken);
  if (!user) {
    return res.status(401).json({ error: 'Invalid Telegram auth' });
  }

  // Auto-register user on first request
  const result = await pool.query(
    `INSERT INTO users (telegram_user_id, username, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_user_id) DO UPDATE
       SET username = EXCLUDED.username,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name
     RETURNING *`,
    [user.id, user.username || null, user.first_name || null, user.last_name || null]
  );

  req.dbUser = result.rows[0];
  req.telegramUser = user;
  next();
}

module.exports = authMiddleware;
