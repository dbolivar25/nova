-- Seed journal prompts with thoughtful questions
INSERT INTO journal_prompts (prompt_text, category, is_active) VALUES
-- Self-Reflection
('What moment from today would you want to relive, and why?', 'self-reflection', true),
('What challenged you today, and how did you respond to it?', 'self-reflection', true),
('If today had a theme song, what would it be and why?', 'self-reflection', true),
('What did you learn about yourself today?', 'self-reflection', true),
('What would you tell your morning self, knowing what you know now?', 'self-reflection', true),

-- Gratitude
('What three things are you grateful for today?', 'gratitude', true),
('Who made a positive impact on your day, even in a small way?', 'gratitude', true),
('What simple pleasure did you enjoy today?', 'gratitude', true),
('What aspect of your health or body are you thankful for today?', 'gratitude', true),

-- Growth & Goals
('What progress did you make toward your goals today, however small?', 'growth', true),
('What habit are you building, and how did it go today?', 'growth', true),
('What would make tomorrow even better than today?', 'growth', true),
('What skill did you practice or improve today?', 'growth', true),

-- Emotions & Mindfulness
('How would you describe your emotional weather today?', 'emotions', true),
('What emotion visited you today that surprised you?', 'emotions', true),
('When did you feel most like yourself today?', 'emotions', true),
('What thoughts have been occupying your mind lately?', 'emotions', true),

-- Relationships
('How did you connect with someone meaningful today?', 'relationships', true),
('What relationship in your life deserves more attention?', 'relationships', true),
('How did you show love or kindness today?', 'relationships', true),

-- Creativity & Dreams
('What inspired you today?', 'creativity', true),
('If you could change one thing about today, what would it be?', 'creativity', true),
('What dream or aspiration feels especially alive right now?', 'creativity', true),

-- Life Perspective
('What would you like to remember about this phase of your life?', 'perspective', true),
('How are you different from who you were a year ago?', 'perspective', true),
('What advice would you give to someone experiencing what you experienced today?', 'perspective', true);