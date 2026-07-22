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
const programsRouter = require('./src/routes/programs');
const assessmentsRouter = require('./src/routes/assessments');

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
app.use('/api/programs', authMiddleware, programsRouter);
app.use('/api/assessments', authMiddleware, assessmentsRouter);

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

// Auto-create programs tables (idempotent, safe to run on every startup)
pool.query(`
  CREATE TABLE IF NOT EXISTS programs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id);
  CREATE TABLE IF NOT EXISTS program_exercises (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_order INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_program_exercises_program ON program_exercises(program_id);
`).catch(e => console.error('Programs migration failed:', e.message));

// Auto-create assessments table (idempotent, safe to run on every startup)
pool.query(`
  CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_score INTEGER,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
`).catch(e => console.error('Assessments migration failed:', e.message));

// Keep Neon warm — free tier auto-suspends after 5 min of inactivity
setInterval(async () => {
  try { await pool.query('SELECT 1'); } catch {}
}, 4 * 60 * 1000);
