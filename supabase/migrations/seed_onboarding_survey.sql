-- ============================================
-- SEED: Onboarding Survey
-- Description: Initial onboarding survey with 5 steps
-- ============================================

-- Create the onboarding survey
INSERT INTO surveys (slug, title, description, is_required, trigger_type) VALUES
  ('onboarding', 'Welcome to Nova', 'Help us understand you better so we can personalize your experience', true, 'onboarding');

-- Insert questions (5 steps)
-- Step 1: Proud traits
INSERT INTO survey_questions (survey_id, slug, question_text, question_type, step_number, display_order, placeholder, help_text, metadata) VALUES
  ((SELECT id FROM surveys WHERE slug = 'onboarding'), 
   'proud_traits', 
   'What actions or character traits are you currently proud of?', 
   'tags', 1, 1,
   'Type a trait and press Enter...',
   'These are your strengths. Nova will help you leverage them.',
   '{"suggestions": ["Patience", "Creativity", "Discipline", "Kindness", "Resilience", "Curiosity", "Empathy", "Honesty", "Determination", "Compassion", "Perseverance", "Optimism", "Adaptability", "Integrity", "Generosity"], "minItems": 1}');

-- Step 2: Improvement traits
INSERT INTO survey_questions (survey_id, slug, question_text, question_type, step_number, display_order, placeholder, help_text, metadata) VALUES
  ((SELECT id FROM surveys WHERE slug = 'onboarding'), 
   'improvement_traits', 
   'What actions or character traits are you currently not proud of?', 
   'tags', 2, 1,
   'Type a trait and press Enter...',
   'Be honest with yourself. This is the first step to growth.',
   '{"suggestions": ["Procrastination", "Impatience", "Overthinking", "Avoidance", "Negativity", "Inconsistency", "Self-doubt", "Anger", "Jealousy", "Laziness", "Perfectionism", "People-pleasing", "Defensiveness", "Stubbornness"], "minItems": 1}');

-- Step 3: Desired traits
INSERT INTO survey_questions (survey_id, slug, question_text, question_type, step_number, display_order, placeholder, help_text, metadata) VALUES
  ((SELECT id FROM surveys WHERE slug = 'onboarding'), 
   'desired_traits', 
   'What actions or character traits do you want to incorporate into your life?', 
   'tags', 3, 1,
   'Type a trait and press Enter...',
   'These are your aspirations. We''ll help you build them.',
   '{"suggestions": ["Mindfulness", "Consistency", "Assertiveness", "Gratitude", "Focus", "Confidence", "Vulnerability", "Presence", "Discipline", "Optimism", "Courage", "Authenticity", "Self-compassion", "Boundaries"], "minItems": 1}');

-- Step 4: Goals by timeframe
INSERT INTO survey_questions (survey_id, slug, question_text, question_type, step_number, display_order, placeholder, help_text, metadata) VALUES
  ((SELECT id FROM surveys WHERE slug = 'onboarding'), 
   'timeframe_goals', 
   'What goals do you have for the next week, month, year, and lifetime?', 
   'goals_timeframe', 4, 1,
   NULL,
   'Think both big and small. All goals matter.',
   '{"timeframes": [
     {"key": "week", "label": "This Week", "placeholder": "What do you want to accomplish this week?"},
     {"key": "month", "label": "This Month", "placeholder": "Where do you want to be in 30 days?"},
     {"key": "year", "label": "This Year", "placeholder": "What will you achieve this year?"},
     {"key": "lifetime", "label": "Lifetime", "placeholder": "What legacy do you want to leave?"}
   ]}');

-- Step 5: Daily goals
INSERT INTO survey_questions (survey_id, slug, question_text, question_type, step_number, display_order, placeholder, help_text, metadata) VALUES
  ((SELECT id FROM surveys WHERE slug = 'onboarding'), 
   'daily_goals', 
   'What daily goals do you want to achieve to maximize your potential?', 
   'daily_goals', 5, 1,
   NULL,
   'Include habits to build AND habits to break or minimize.',
   '{"enableAiRecommendations": true, "goalTypes": [
     {"key": "add", "label": "Habits to Build", "description": "Things you want to start doing daily", "icon": "plus"},
     {"key": "remove", "label": "Habits to Break", "description": "Things you want to stop doing completely", "icon": "x"},
     {"key": "minimize", "label": "Habits to Minimize", "description": "Things you want to reduce or limit", "icon": "minus"}
   ], "categories": ["health", "productivity", "relationships", "mindset", "learning", "finance", "creativity", "other"]}');
