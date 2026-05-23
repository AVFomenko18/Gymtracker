const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all exercises (global + user's own)
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, muscle_group, user_id
     FROM exercises
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY muscle_group, name`,
    [req.dbUser.id]
  );
  res.json(result.rows);
});

// Add custom exercise
router.post('/', async (req, res) => {
  const { name, muscle_group } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const result = await pool.query(
    `INSERT INTO exercises (user_id, name, muscle_group)
     VALUES ($1, $2, $3) RETURNING *`,
    [req.dbUser.id, name.trim(), muscle_group || 'Другое']
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
