-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: extend profiles + create user_activities + activity_overrides
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extend profiles table ────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_location   JSONB,
  ADD COLUMN IF NOT EXISTS gender          TEXT,
  ADD COLUMN IF NOT EXISTS goal            TEXT,
  ADD COLUMN IF NOT EXISTS other_activity  JSONB;

-- ── 2. user_activities ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_activities (
  id                    TEXT        PRIMARY KEY,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT        NOT NULL,
  cat                   TEXT        NOT NULL,
  start_time            TEXT        NOT NULL,
  end_time              TEXT        NOT NULL,
  days                  TEXT[]      NOT NULL DEFAULT '{}',
  recurrence            TEXT        NOT NULL DEFAULT 'none',
  color                 JSONB,
  notify_week_end       BOOLEAN     NOT NULL DEFAULT FALSE,
  location              JSONB,
  departure_location    JSONB,
  trajet_minutes_before INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own activities" ON user_activities;
CREATE POLICY "Users manage own activities"
  ON user_activities FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. activity_overrides ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_overrides (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id  TEXT        NOT NULL,
  date         TEXT        NOT NULL,   -- "YYYY-MM-DD"
  title        TEXT,
  start_time   TEXT,
  end_time     TEXT,
  color        JSONB,
  cancelled    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_id, date)
);

ALTER TABLE activity_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own overrides" ON activity_overrides;
CREATE POLICY "Users manage own overrides"
  ON activity_overrides FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
