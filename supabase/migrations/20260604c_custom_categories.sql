-- ── custom_categories ────────────────────────────────────────────────────────
-- User-defined activity categories (label + color).

CREATE TABLE IF NOT EXISTS custom_categories (
  id         TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  color      JSONB       NOT NULL,  -- { bg: string, ink: string }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom categories"
  ON custom_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── user_activities — add custom_cat_id column ────────────────────────────────
ALTER TABLE user_activities
  ADD COLUMN IF NOT EXISTS custom_cat_id TEXT REFERENCES custom_categories(id) ON DELETE SET NULL;
