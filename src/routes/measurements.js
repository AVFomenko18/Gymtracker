const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM body_measurements
     WHERE user_id = $1
     ORDER BY date DESC`,
    [req.dbUser.id]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { date, weight_kg, chest_cm, waist_cm, hips_cm, biceps_cm, thigh_cm, body_fat_pct, note } = req.body;
  const result = await pool.query(
    `INSERT INTO body_measurements
       (user_id, date, weight_kg, chest_cm, waist_cm, hips_cm, biceps_cm, thigh_cm, body_fat_pct, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [req.dbUser.id, date || new Date().toISOString().slice(0,10),
     weight_kg||null, chest_cm||null, waist_cm||null, hips_cm||null,
     biceps_cm||null, thigh_cm||null, body_fat_pct||null, note||null]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM body_measurements WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.dbUser.id]
  );
  res.json({ ok: true });
});

module.exports = router;
