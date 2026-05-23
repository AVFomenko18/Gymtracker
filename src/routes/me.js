const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
  res.json({
    id: req.dbUser.id,
    telegram_user_id: req.dbUser.telegram_user_id,
    first_name: req.dbUser.first_name,
    last_name: req.dbUser.last_name,
    username: req.dbUser.username,
    goals: req.dbUser.goals_json,
    created_at: req.dbUser.created_at,
  });
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
