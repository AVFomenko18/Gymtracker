const express = require('express');
const router = express.Router();
const pool = require('../db');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HABIT_FIELDS = new Set(['english', 'activity', 'nutrition']);

function isValidDate(value) {
  if (!DATE_RE.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

router.get('/', async (req, res) => {
  const { from, to } = req.query;
  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return res.status(400).json({ error: 'Укажите корректный диапазон дат' });
  }

  const result = await pool.query(
    `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, english, activity, nutrition
     FROM daily_habits
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date`,
    [req.dbUser.id, from, to]
  );
  res.json(result.rows);
});

router.put('/:date', async (req, res) => {
  const { date } = req.params;
  const { habit, checked } = req.body;
  if (!isValidDate(date) || !HABIT_FIELDS.has(habit) || typeof checked !== 'boolean') {
    return res.status(400).json({ error: 'Некорректная отметка привычки' });
  }

  const result = await pool.query(
    `INSERT INTO daily_habits (user_id, date, ${habit})
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, date)
     DO UPDATE SET ${habit} = EXCLUDED.${habit}, updated_at = NOW()
     RETURNING TO_CHAR(date, 'YYYY-MM-DD') AS date, english, activity, nutrition`,
    [req.dbUser.id, date, checked]
  );
  res.json(result.rows[0]);
});

module.exports = router;
