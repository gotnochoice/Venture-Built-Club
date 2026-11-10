-- Run once in the Supabase SQL Editor (safe to run more than once).
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cohort_pick BOOLEAN;
