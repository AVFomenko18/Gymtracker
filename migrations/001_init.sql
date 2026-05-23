-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  goals_json JSONB DEFAULT '{"calories": 2000, "protein": 150, "fat": 70, "carbs": 250}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Упражнения (user_id = NULL → глобальное, иначе личное)
CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(user_id);

-- Тренировки
CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);

-- Подходы
CREATE TABLE IF NOT EXISTS sets (
  id BIGSERIAL PRIMARY KEY,
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id),
  weight NUMERIC(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  set_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id);

-- Замеры тела
CREATE TABLE IF NOT EXISTS body_measurements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  biceps_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  body_fat_pct NUMERIC(4,2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON body_measurements(user_id, date DESC);

-- Питание
CREATE TABLE IF NOT EXISTS meals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  calories NUMERIC(6,2) NOT NULL DEFAULT 0,
  protein NUMERIC(6,2) NOT NULL DEFAULT 0,
  fat NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, eaten_at DESC);
