const express = require('express');
const pool = require('../db');
const router = express.Router();

// List assessments (for the client list view)
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT id, client_name, TO_CHAR(test_date, 'YYYY-MM-DD') AS test_date,
            total_score, updated_at
     FROM assessments
     WHERE user_id = $1
     ORDER BY client_name, test_date DESC`,
    [req.dbUser.id]
  );
  res.json(result.rows);
});

// Full record (for viewing/editing)
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT id, client_name, TO_CHAR(test_date, 'YYYY-MM-DD') AS test_date,
            total_score, data
     FROM assessments WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Не найдено' });
  res.json(result.rows[0]);
});

// Create
router.post('/', async (req, res) => {
  const { client_name, test_date, total_score, data } = req.body;
  if (!client_name || !data) {
    return res.status(400).json({ error: 'client_name, data required' });
  }
  const result = await pool.query(
    `INSERT INTO assessments (user_id, client_name, test_date, total_score, data)
     VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5)
     RETURNING id`,
    [req.dbUser.id, client_name, test_date || null, total_score || null, data]
  );
  res.json({ id: result.rows[0].id });
});

// Update
router.put('/:id', async (req, res) => {
  const { client_name, test_date, total_score, data } = req.body;
  if (!client_name || !data) {
    return res.status(400).json({ error: 'client_name, data required' });
  }
  const result = await pool.query(
    `UPDATE assessments
     SET client_name = $1, test_date = COALESCE($2, test_date),
         total_score = $3, data = $4, updated_at = NOW()
     WHERE id = $5 AND user_id = $6
     RETURNING id`,
    [client_name, test_date || null, total_score || null, data, req.params.id, req.dbUser.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Не найдено' });
  res.json({ ok: true });
});

// Delete
router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM assessments WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
