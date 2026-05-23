require('dotenv').config();
const express = require('express');
const path = require('path');
const authMiddleware = require('./src/middleware/verifyTelegram');
const meRouter = require('./src/routes/me');
const exercisesRouter = require('./src/routes/exercises');
const workoutsRouter = require('./src/routes/workouts');

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
