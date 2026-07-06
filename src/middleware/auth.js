const pool = require('../db');

async function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = auth.slice(7);
  const result = await pool.query('SELECT * FROM users WHERE device_token = $1', [token]);
  if (!result.rows.length) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
  req.dbUser = result.rows[0];
  next();
}

module.exports = authMiddleware;
