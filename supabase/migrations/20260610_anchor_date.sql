-- Anchor date for recurrence computation: one-off ('none') activities only
-- show during their creation week; N-weekly activities repeat relative to it.
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS anchor_date TEXT;
