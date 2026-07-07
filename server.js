require('dotenv').config();
const express = require('express');
const path = require('path');
const authMiddleware = require('./src/middleware/auth');
const authRouter = require('./src/routes/auth');
const meRouter = require('./src/routes/me');
const exercisesRouter = require('./src/routes/exercises');
const workoutsRouter = require('./src/routes/workouts');
const measurementsRouter = require('./src/routes/measurements');
const mealsRouter = require('./src/routes/meals');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/me', authMiddleware, meRouter);
app.use('/api/exercises', authMiddleware, exercisesRouter);
app.use('/api/workouts', authMiddleware, workoutsRouter);
app.use('/api/measurements', authMiddleware, measurementsRouter);
app.use('/api/meals', authMiddleware, mealsRouter);

app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const pool = require('./src/db');

// Warm up DB immediately on startup so first user request isn't slow
pool.query('SELECT 1').catch(e => console.error('DB warmup failed:', e.message));

// Keep Neon warm — free tier auto-suspends after 5 min of inactivity
setInterval(async () => {
  try { await pool.query('SELECT 1'); } catch {}
}, 4 * 60 * 1000);
