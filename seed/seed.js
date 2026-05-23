require('dotenv').config();
const pool = require('../src/db');
const exercises = require('./exercises.json');

async function seed() {
  try {
    for (const ex of exercises) {
      await pool.query(
        `INSERT INTO exercises (user_id, name, muscle_group)
         VALUES (NULL, $1, $2)
         ON CONFLICT DO NOTHING`,
        [ex.name, ex.muscle_group]
      );
    }
    console.log(`✅ Добавлено ${exercises.length} упражнений`);
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
