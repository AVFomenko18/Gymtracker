const express = require('express');
const router = express.Router();
const pool = require('../db');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HABIT_FIELDS = new Set(['english', 'activity', 'nutrition', 'vibe_coding']);
const HABIT_STATUSES = new Set(['pending', 'done', 'missed']);

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
    `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date,
            CASE WHEN english THEN 'done' WHEN english_missed THEN 'missed' ELSE 'pending' END AS english,
            CASE WHEN activity THEN 'done' WHEN activity_missed THEN 'missed' ELSE 'pending' END AS activity,
            CASE WHEN nutrition THEN 'done' WHEN nutrition_missed THEN 'missed' ELSE 'pending' END AS nutrition,
            CASE WHEN vibe_coding THEN 'done' WHEN vibe_coding_missed THEN 'missed' ELSE 'pending' END AS vibe_coding
     FROM daily_habits
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date`,
    [req.dbUser.id, from, to]
  );
  res.json(result.rows);
});

router.put('/:date', async (req, res) => {
  const { date } = req.params;
  const { habit, status } = req.body;
  if (!isValidDate(date) || !HABIT_FIELDS.has(habit) || !HABIT_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Некорректная отметка привычки' });
  }

  const missedField = `${habit}_missed`;
  const done = status === 'done';
  const missed = status === 'missed';

  const result = await pool.query(
    `INSERT INTO daily_habits (user_id, date, ${habit}, ${missedField})
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, date)
     DO UPDATE SET ${habit} = EXCLUDED.${habit}, ${missedField} = EXCLUDED.${missedField}, updated_at = NOW()
     RETURNING TO_CHAR(date, 'YYYY-MM-DD') AS date,
       CASE WHEN english THEN 'done' WHEN english_missed THEN 'missed' ELSE 'pending' END AS english,
       CASE WHEN activity THEN 'done' WHEN activity_missed THEN 'missed' ELSE 'pending' END AS activity,
       CASE WHEN nutrition THEN 'done' WHEN nutrition_missed THEN 'missed' ELSE 'pending' END AS nutrition,
       CASE WHEN vibe_coding THEN 'done' WHEN vibe_coding_missed THEN 'missed' ELSE 'pending' END AS vibe_coding`,
    [req.dbUser.id, date, done, missed]
  );
  res.json(result.rows[0]);
});

module.exports = router;
