const express = require('express');
const router = express.Router();
const pool = require('../db');

// List workouts — one per date, prefer the one with most sets
router.get('/', async (req, res) => {
  const result = await pool.query(
    `WITH stats AS (
       SELECT w.id, w.date, w.note, w.created_at,
              COALESCE(SUM(s.weight * s.reps), 0) AS tonnage,
              COUNT(DISTINCT s.id) AS total_sets
       FROM workouts w
       LEFT JOIN sets s ON s.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
     )
     SELECT DISTINCT ON (date) id, date, note, created_at, tonnage, total_sets
     FROM stats
     ORDER BY date DESC, total_sets DESC, created_at DESC`,
    [req.dbUser.id]
  );
  res.json(result.rows);
});

// Create workout
router.post('/', async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    `INSERT INTO workouts (user_id, date) VALUES ($1, $2) RETURNING *`,
    [req.dbUser.id, date]
  );
  res.status(201).json(result.rows[0]);
});

// Get workout with all sets + supersets
router.get('/:id', async (req, res) => {
  const workout = await pool.query(
    `SELECT * FROM workouts WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!workout.rows.length) return res.status(404).json({ error: 'Not found' });

  const sets = await pool.query(
    `SELECT s.id, s.exercise_id, s.weight, s.reps, s.set_order,
            e.name AS exercise_name, e.muscle_group
     FROM sets s
     JOIN exercises e ON e.id = s.exercise_id
     WHERE s.workout_id = $1
     ORDER BY s.exercise_id, s.set_order`,
    [req.params.id]
  );

  const supersets = await pool.query(
    `SELECT * FROM supersets WHERE workout_id = $1`,
    [req.params.id]
  );

  res.json({ ...workout.rows[0], sets: sets.rows, supersets: supersets.rows });
});

// Create superset
router.post('/:id/supersets', async (req, res) => {
  const { exercise_id_1, exercise_id_2 } = req.body;
  if (!exercise_id_1 || !exercise_id_2) {
    return res.status(400).json({ error: 'exercise_id_1 and exercise_id_2 required' });
  }
  const own = await pool.query(
    `SELECT id FROM workouts WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!own.rows.length) return res.status(404).json({ error: 'Workout not found' });

  await pool.query(
    `DELETE FROM supersets WHERE workout_id = $1
     AND (exercise_id_1 IN ($2,$3) OR exercise_id_2 IN ($2,$3))`,
    [req.params.id, exercise_id_1, exercise_id_2]
  );
  const result = await pool.query(
    `INSERT INTO supersets (workout_id, exercise_id_1, exercise_id_2)
     VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, exercise_id_1, exercise_id_2]
  );
  res.status(201).json(result.rows[0]);
});

// Delete superset
router.delete('/:id/supersets/:supersetId', async (req, res) => {
  await pool.query(
    `DELETE FROM supersets WHERE id = $1 AND workout_id = $2
     AND workout_id IN (SELECT id FROM workouts WHERE user_id = $3)`,
    [req.params.supersetId, req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

// Update workout date
router.put('/:id', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  const result = await pool.query(
    `UPDATE workouts SET date = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [date, req.params.id, req.dbUser.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// Delete workout
router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM workouts WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

// Add set to workout
router.post('/:id/sets', async (req, res) => {
  const { exercise_id, weight, reps } = req.body;
  if (!exercise_id || !weight || !reps) {
    return res.status(400).json({ error: 'exercise_id, weight, reps required' });
  }

  // Verify workout belongs to user
  const workout = await pool.query(
    `SELECT id FROM workouts WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!workout.rows.length) return res.status(404).json({ error: 'Workout not found' });

  const orderResult = await pool.query(
    `SELECT COALESCE(MAX(set_order), 0) + 1 AS next_order
     FROM sets WHERE workout_id = $1 AND exercise_id = $2`,
    [req.params.id, exercise_id]
  );
  const setOrder = orderResult.rows[0].next_order;

  const result = await pool.query(
    `INSERT INTO sets (workout_id, exercise_id, weight, reps, set_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.id, exercise_id, weight, reps, setOrder]
  );
  res.status(201).json(result.rows[0]);
});

// Delete set
router.delete('/sets/:setId', async (req, res) => {
  await pool.query(
    `DELETE FROM sets WHERE id = $1
     AND workout_id IN (SELECT id FROM workouts WHERE user_id = $2)`,
    [req.params.setId, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
