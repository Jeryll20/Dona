-- ── activity_completions ──────────────────────────────────────────────────────
-- Tracks whether a user actually completed or skipped a scheduled activity
-- on a given date. Used by the behavioral analysis engine.

CREATE TABLE IF NOT EXISTS activity_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id  TEXT        NOT NULL,
  date         TEXT        NOT NULL,  -- "YYYY-MM-DD"
  completed    BOOLEAN     NOT NULL DEFAULT false,
  actual_start TEXT,                  -- "HH:MM" — if user started at a different time
  actual_end   TEXT,                  -- "HH:MM"
  note         TEXT,                  -- optional free text
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id, date)
);

ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions"
  ON activity_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
