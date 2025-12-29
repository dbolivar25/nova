-- ============================================
-- SURVEY SYSTEM TABLES
-- Migration: add_survey_system.sql
-- Description: Creates the flexible survey system for onboarding and future surveys
-- ============================================

-- Question types enum
CREATE TYPE question_type AS ENUM (
  'text',              -- Single line input
  'textarea',          -- Multi-line input
  'tags',              -- Tag/chip input (array of strings)
  'select',            -- Single choice dropdown
  'multiselect',       -- Multiple choice checkboxes
  'scale',             -- 1-10 rating slider
  'checkbox',          -- Single yes/no toggle
  'date',              -- Date picker
  'ranking',           -- Drag to reorder items
  'goals_timeframe',   -- Special: week/month/year/lifetime goals
  'daily_goals'        -- Special: add/remove/minimize goals with AI
);

-- Goal types for daily goals
CREATE TYPE goal_type AS ENUM ('add', 'remove', 'minimize');

-- Goal categories
CREATE TYPE goal_category AS ENUM (
  'health', 'productivity', 'relationships', 
  'mindset', 'learning', 'finance', 'creativity', 'other'
);

-- Survey definitions (add new surveys via INSERT, no migrations needed)
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,              -- 'onboarding', 'monthly_checkin'
  title TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,      -- Must complete before accessing app?
  trigger_type TEXT DEFAULT 'manual',     -- 'onboarding', 'scheduled', 'manual'
  trigger_config JSONB DEFAULT '{}',      -- {"frequency": "monthly", "day": 1}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey questions (add new questions via INSERT, no migrations needed)
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  display_order INTEGER NOT NULL,
  step_number INTEGER DEFAULT 1,          -- Which step/page this appears on
  is_required BOOLEAN DEFAULT true,
  placeholder TEXT,
  help_text TEXT,
  metadata JSONB DEFAULT '{}',            -- Validation, suggestions, options
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, slug)
);

-- ============================================
-- USER RESPONSE TABLES
-- ============================================

-- User survey submissions (tracks each attempt, preserves history)
CREATE TABLE user_survey_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'archived')),
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual question responses (granular, queryable)
CREATE TABLE user_survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES user_survey_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id),
  response_value JSONB NOT NULL,          -- Flexible: string, array, object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

-- ============================================
-- DAILY GOALS (First-class entity, user-managed)
-- ============================================

CREATE TABLE user_daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  goal_type goal_type NOT NULL,
  category goal_category,
  is_ai_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  source_submission_id UUID REFERENCES user_survey_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI RECOMMENDATIONS (History tracking)
-- ============================================

CREATE TABLE user_goal_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES user_survey_submissions(id) ON DELETE SET NULL,
  recommendations JSONB NOT NULL,         -- Array of recommended goals
  context_snapshot JSONB,                 -- Survey data used for generation
  model_id TEXT,                          -- 'groq/gpt-oss-120b'
  accepted_count INTEGER DEFAULT 0,
  dismissed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TABLE UPDATE (onboarding flag)
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_surveys_active ON surveys(is_active, trigger_type);
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id, step_number, display_order);
CREATE INDEX idx_user_submissions_user ON user_survey_submissions(user_id, survey_id);
CREATE INDEX idx_user_submissions_status ON user_survey_submissions(status) WHERE status = 'in_progress';
CREATE INDEX idx_user_responses_submission ON user_survey_responses(submission_id);
CREATE INDEX idx_user_daily_goals_user ON user_daily_goals(user_id) WHERE is_active = true;
CREATE INDEX idx_user_daily_goals_type ON user_daily_goals(goal_type);
CREATE INDEX idx_user_recommendations_user ON user_goal_recommendations(user_id, created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_submissions_updated_at BEFORE UPDATE ON user_survey_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_responses_updated_at BEFORE UPDATE ON user_survey_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_goals_updated_at BEFORE UPDATE ON user_daily_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_survey_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goal_recommendations ENABLE ROW LEVEL SECURITY;

-- Surveys and questions are public read (anyone can see available surveys)
CREATE POLICY "Anyone can read active surveys" ON surveys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read survey questions" ON survey_questions
  FOR SELECT USING (survey_id IN (SELECT id FROM surveys WHERE is_active = true));

-- User data is private (RLS based on clerk_id)
CREATE POLICY "Users manage own submissions" ON user_survey_submissions
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users manage own responses" ON user_survey_responses
  FOR ALL USING (submission_id IN (
    SELECT id FROM user_survey_submissions 
    WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  ));

CREATE POLICY "Users manage own daily goals" ON user_daily_goals
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users view own recommendations" ON user_goal_recommendations
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Service role full access (for API routes)
CREATE POLICY "Service role access surveys" ON surveys 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access questions" ON survey_questions 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access submissions" ON user_survey_submissions 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access responses" ON user_survey_responses 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access goals" ON user_daily_goals 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access recommendations" ON user_goal_recommendations 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
