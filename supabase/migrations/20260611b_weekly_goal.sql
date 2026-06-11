-- Quantified goals: target completed sessions per week for an activity
-- (e.g. 3 = "3 sessions de sport/semaine", shown as a progress bar).
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS weekly_goal INTEGER;
