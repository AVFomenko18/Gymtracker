require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_init.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Миграция выполнена успешно');
  } catch (err) {
    console.error('❌ Ошибка миграции:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
