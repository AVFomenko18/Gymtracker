const express = require('express');
const router = express.Router();
const pool = require('../db');

// List programs with exercise count
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.created_at, COUNT(pe.id)::int AS exercise_count
     FROM programs p
     LEFT JOIN program_exercises pe ON pe.program_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [req.dbUser.id]
  );
  res.json(result.rows);
});

// Create program
router.post('/', async (req, res) => {
  const { name, exercise_ids } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const prog = await pool.query(
    `INSERT INTO programs (user_id, name) VALUES ($1, $2) RETURNING *`,
    [req.dbUser.id, name.trim()]
  );
  const programId = prog.rows[0].id;
  const ids = Array.isArray(exercise_ids) ? exercise_ids : [];
  for (let i = 0; i < ids.length; i++) {
    await pool.query(
      `INSERT INTO program_exercises (program_id, exercise_id, exercise_order) VALUES ($1, $2, $3)`,
      [programId, ids[i], i + 1]
    );
  }
  res.status(201).json(prog.rows[0]);
});

// Get program with exercises
router.get('/:id', async (req, res) => {
  const prog = await pool.query(
    `SELECT * FROM programs WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!prog.rows.length) return res.status(404).json({ error: 'Not found' });

  const exs = await pool.query(
    `SELECT pe.id AS pe_id, pe.exercise_id, pe.exercise_order, e.name, e.muscle_group
     FROM program_exercises pe
     JOIN exercises e ON e.id = pe.exercise_id
     WHERE pe.program_id = $1
     ORDER BY pe.exercise_order`,
    [req.params.id]
  );
  res.json({ ...prog.rows[0], exercises: exs.rows });
});

// Update program name and/or exercises
router.put('/:id', async (req, res) => {
  const { name, exercise_ids } = req.body;
  const own = await pool.query(
    `SELECT id FROM programs WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  if (name !== undefined) {
    await pool.query(`UPDATE programs SET name = $1 WHERE id = $2`, [name.trim(), req.params.id]);
  }
  if (exercise_ids !== undefined) {
    await pool.query(`DELETE FROM program_exercises WHERE program_id = $1`, [req.params.id]);
    for (let i = 0; i < exercise_ids.length; i++) {
      await pool.query(
        `INSERT INTO program_exercises (program_id, exercise_id, exercise_order) VALUES ($1, $2, $3)`,
        [req.params.id, exercise_ids[i], i + 1]
      );
    }
  }
  res.json({ ok: true });
});

// Delete program
router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM programs WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
