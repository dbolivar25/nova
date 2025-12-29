-- ============================================
-- DAILY GOAL COMPLETION TRACKING
-- Migration: add_goal_completions.sql
-- Description: Track daily completion status for goals
-- ============================================

CREATE TABLE user_goal_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES user_daily_goals(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,                              -- Optional: why skipped, how it went
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, completion_date)
);

-- Index for efficient querying by date range
CREATE INDEX idx_goal_completions_goal_date ON user_goal_completions(goal_id, completion_date DESC);
CREATE INDEX idx_goal_completions_date ON user_goal_completions(completion_date);

-- RLS
ALTER TABLE user_goal_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions" ON user_goal_completions
  FOR ALL USING (goal_id IN (
    SELECT id FROM user_daily_goals 
    WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  ));

CREATE POLICY "Service role access completions" ON user_goal_completions 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger
CREATE TRIGGER update_goal_completions_updated_at BEFORE UPDATE ON user_goal_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
