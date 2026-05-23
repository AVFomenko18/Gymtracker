require('dotenv').config();
const express = require('express');
const path = require('path');
const authMiddleware = require('./src/middleware/verifyTelegram');
const meRouter = require('./src/routes/me');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/me', authMiddleware, meRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
