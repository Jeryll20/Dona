-- ── Cloud extras: theme, premium flag, weekly reports archive, chat history ──

-- Theme preference (multi-device comfort) + premium flag (server-managed,
-- never written by the client)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- ── weekly_reports ────────────────────────────────────────────────────────────
-- Archive of generated weekly reports — needed for multi-week trend stats.

CREATE TABLE IF NOT EXISTS weekly_reports (
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start       TEXT        NOT NULL,  -- "YYYY-MM-DD" (Monday)
  completion_rate  DOUBLE PRECISION NOT NULL DEFAULT 0,
  category_stats   JSONB,
  custom_cat_stats JSONB,
  streak           INTEGER     NOT NULL DEFAULT 0,
  patterns         JSONB,
  mistral_insights TEXT,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly reports"
  ON weekly_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────
-- Mistral chat history — conversation continuity across devices.

CREATE TABLE IF NOT EXISTS chat_messages (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id         TEXT        NOT NULL,
  role       TEXT        NOT NULL,  -- 'bot' | 'user'
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
