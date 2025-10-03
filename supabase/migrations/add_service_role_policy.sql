-- Nova AI - Required Database Changes
-- Run this after applying schema.sql and update-rls-policies.sql

-- 1. Add service role INSERT policy for weekly_insights cron job
-- This allows the Vercel cron job to insert insights using the service role
CREATE POLICY IF NOT EXISTS "Service role can insert weekly insights"
  ON weekly_insights
  FOR INSERT
  WITH CHECK (true);

-- 2. Add optional performance index for insight type queries
-- Improves performance when filtering insights by type
CREATE INDEX IF NOT EXISTS idx_weekly_insights_type
  ON weekly_insights(user_id, insight_type, week_start_date DESC);
