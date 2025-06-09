-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE mood_type AS ENUM ('positive', 'neutral', 'negative', 'thoughtful', 'grateful', 'anxious', 'excited', 'sad', 'angry', 'peaceful');
CREATE TYPE insight_type AS ENUM ('emotional_trends', 'key_themes', 'growth_moments', 'patterns');

-- Users table (extends Clerk user data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '09:00:00',
  auto_dark_mode BOOLEAN DEFAULT true,
  prompt_count INTEGER DEFAULT 3 CHECK (prompt_count >= 1 AND prompt_count <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Journal prompts table (master list)
CREATE TABLE journal_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  freeform_text TEXT,
  mood mood_type,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- User responses to prompts
CREATE TABLE prompt_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES journal_prompts(id),
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversations (Nova chat history)
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly insights table
CREATE TABLE weekly_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  insight_type insight_type NOT NULL,
  insight_content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date, insight_type)
);

-- User personality analysis
CREATE TABLE user_personality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  traits JSONB NOT NULL DEFAULT '{}',
  last_analysis_date TIMESTAMPTZ,
  analysis_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_entries_created ON journal_entries(created_at DESC);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_weekly_insights_user_week ON weekly_insights(user_id, week_start_date DESC);
CREATE INDEX idx_prompt_responses_entry ON prompt_responses(journal_entry_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_personality_updated_at BEFORE UPDATE ON user_personality
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personality ENABLE ROW LEVEL SECURITY;

-- RLS policies for Clerk integration
-- The JWT from Clerk contains the user ID in the 'sub' claim
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage own journal entries" ON journal_entries
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage own prompt responses" ON prompt_responses
    FOR ALL USING (journal_entry_id IN (
        SELECT id FROM journal_entries 
        WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Users can view own AI conversations" ON ai_conversations
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can view own weekly insights" ON weekly_insights
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can view own personality analysis" ON user_personality
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Public read access for journal prompts
CREATE POLICY "Everyone can read active prompts" ON journal_prompts
    FOR SELECT USING (is_active = true);

-- Insert default journal prompts
INSERT INTO journal_prompts (prompt_text, category) VALUES
  -- Self-Awareness
  ('What emotion did you try to avoid today, and why?', 'self-awareness'),
  ('When did you feel most authentic today?', 'self-awareness'),
  ('What part of yourself did you hide or suppress today?', 'self-awareness'),
  ('What triggered the strongest emotional response in you today?', 'self-awareness'),
  ('How did your body feel at different points throughout the day?', 'self-awareness'),
  
  -- Growth & Purpose
  ('What challenged your assumptions today?', 'growth'),
  ('What small step did you take toward a larger goal?', 'growth'),
  ('What failure or setback taught you something valuable today?', 'growth'),
  ('How did you grow as a person today, even in a small way?', 'growth'),
  ('What would you do differently if you could relive today?', 'growth'),
  
  -- Relationships
  ('How did you show up for someone today?', 'relationships'),
  ('What boundary did you set or wish you had set?', 'relationships'),
  ('Who made a positive impact on your day and how?', 'relationships'),
  ('What unspoken tension exists in one of your relationships?', 'relationships'),
  ('How did you contribute to someone else''s happiness today?', 'relationships'),
  
  -- Gratitude & Presence
  ('What subtle beauty did you notice today?', 'gratitude'),
  ('What ordinary moment felt extraordinary?', 'gratitude'),
  ('What are you taking for granted that you''d miss if it were gone?', 'gratitude'),
  ('What simple pleasure brought you unexpected joy?', 'gratitude'),
  ('When did you feel most present and alive today?', 'gratitude');