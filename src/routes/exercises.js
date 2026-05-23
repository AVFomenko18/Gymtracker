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

// Exercise stats
router.get('/:id/stats', async (req, res) => {
  const { period } = req.query;
  let dateFilter = '';
  if (period === 'week')  dateFilter = `AND w.date >= CURRENT_DATE - INTERVAL '7 days'`;
  if (period === 'month') dateFilter = `AND w.date >= CURRENT_DATE - INTERVAL '30 days'`;
  if (period === 'year')  dateFilter = `AND w.date >= CURRENT_DATE - INTERVAL '1 year'`;

  const sets = await pool.query(
    `SELECT TO_CHAR(w.date, 'YYYY-MM-DD') AS date, s.weight, s.reps, s.set_order
     FROM sets s
     JOIN workouts w ON w.id = s.workout_id
     WHERE s.exercise_id = $1 AND w.user_id = $2 ${dateFilter}
     ORDER BY w.date ASC, s.set_order ASC`,
    [req.params.id, req.dbUser.id]
  );

  const sessionMap = {};
  for (const row of sets.rows) {
    const d = String(row.date).slice(0, 10);
    if (!sessionMap[d]) sessionMap[d] = [];
    sessionMap[d].push({ weight: parseFloat(row.weight), reps: parseInt(row.reps) });
  }
  const sessions = Object.entries(sessionMap).map(([date, s]) => ({ date, sets: s }));
  res.json({ sessions });
});

// Delete custom exercise (only user's own)
router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM exercises WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
