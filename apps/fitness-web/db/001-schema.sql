-- New installation bootstrap. For later schema changes use versioned migrations.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS fitness_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_on date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('desayuno','almuerzo','cena','colacion','otro')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 2 AND 2000),
  portions jsonb NOT NULL DEFAULT '[]'::jsonb,
  calories numeric(8,1) CHECK (calories IS NULL OR calories >= 0),
  protein_g numeric(7,1) CHECK (protein_g IS NULL OR protein_g >= 0),
  calories_estimated boolean NOT NULL DEFAULT true,
  protein_estimated boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'chatgpt',
  external_id text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meals_by_day ON fitness_meals (occurred_on DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS fitness_garmin_days (
  day date PRIMARY KEY,
  daily_stats jsonb,
  sleep jsonb,
  hrv jsonb,
  readiness jsonb,
  activities jsonb,
  scheduled_workouts jsonb,
  sync_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fitness_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_on date NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  steps jsonb NOT NULL CHECK (jsonb_typeof(steps) = 'array'),
  garmin_workout_id text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plans_by_day ON fitness_plans (planned_on DESC);

CREATE TABLE IF NOT EXISTS fitness_weight (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measured_on date NOT NULL,
  kg numeric(5,2) NOT NULL CHECK (kg > 0 AND kg < 500),
  source text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS weight_by_day ON fitness_weight (measured_on DESC);
