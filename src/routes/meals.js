const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get meals for a date (default today)
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    `SELECT * FROM meals
     WHERE user_id = $1 AND eaten_at::date = $2
     ORDER BY eaten_at ASC`,
    [req.dbUser.id, date]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, calories, protein, fat, carbs, eaten_at } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const result = await pool.query(
    `INSERT INTO meals (user_id, name, calories, protein, fat, carbs, eaten_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.dbUser.id, name,
     calories||0, protein||0, fat||0, carbs||0,
     eaten_at || new Date().toISOString()]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM meals WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
