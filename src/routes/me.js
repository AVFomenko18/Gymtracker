const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
  res.json({
    id: req.dbUser.id,
    name: req.dbUser.name,
    username: req.dbUser.username,
    avatar_data: req.dbUser.avatar_data,
    goals: req.dbUser.goals_json,
  });
});

router.put('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Имя не может быть пустым' });
  const result = await pool.query(
    `UPDATE users SET name = $1 WHERE id = $2 RETURNING name, username, avatar_data, goals_json`,
    [name.trim(), req.dbUser.id]
  );
  res.json(result.rows[0]);
});

router.put('/avatar', async (req, res) => {
  const { avatar_data } = req.body;
  if (avatar_data && avatar_data.length > 300000) {
    return res.status(400).json({ error: 'Изображение слишком большое (макс 200КБ)' });
  }
  await pool.query('UPDATE users SET avatar_data = $1 WHERE id = $2', [avatar_data, req.dbUser.id]);
  res.json({ ok: true });
});

router.put('/goals', async (req, res) => {
  const { calories, protein, fat, carbs } = req.body;
  const result = await pool.query(
    `UPDATE users SET goals_json = $1 WHERE id = $2 RETURNING goals_json`,
    [JSON.stringify({ calories, protein, fat, carbs }), req.dbUser.id]
  );
  res.json(result.rows[0].goals_json);
});

module.exports = router;
