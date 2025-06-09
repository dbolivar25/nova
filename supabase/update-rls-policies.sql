-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can manage own prompt responses" ON prompt_responses;
DROP POLICY IF EXISTS "Users can view own AI conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can view own weekly insights" ON weekly_insights;
DROP POLICY IF EXISTS "Users can view own personality analysis" ON user_personality;

-- Recreate policies with correct JWT claim
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