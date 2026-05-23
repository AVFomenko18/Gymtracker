require('dotenv').config();
const express = require('express');
const path = require('path');
const authMiddleware = require('./src/middleware/verifyTelegram');
const meRouter = require('./src/routes/me');
const exercisesRouter = require('./src/routes/exercises');
const workoutsRouter = require('./src/routes/workouts');
const measurementsRouter = require('./src/routes/measurements');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/me', authMiddleware, meRouter);
app.use('/api/exercises', authMiddleware, exercisesRouter);
app.use('/api/workouts', authMiddleware, workoutsRouter);
app.use('/api/measurements', authMiddleware, measurementsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
