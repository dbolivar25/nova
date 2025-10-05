-- Nova Chat Threads Migration
-- Adds threaded conversations with sources persistence
-- NOTE: This drops all existing chat history from ai_conversations

-- Drop old table (or rename if you want to keep backup)
DROP TABLE IF EXISTS ai_conversations CASCADE;

-- Chat threads table
CREATE TABLE nova_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  temporary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Messages table with full content + metadata
CREATE TABLE nova_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES nova_chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- Nullable for AI messages

  content JSONB NOT NULL,      -- Full UserContent/AgentContent with sources
  metadata JSONB DEFAULT '{}',  -- Processing time, model, tokens, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nova_chats_user_updated ON nova_chats(user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_nova_messages_chat_created ON nova_messages(chat_id, created_at ASC);
CREATE INDEX idx_nova_chats_user_created ON nova_chats(user_id, created_at DESC);

-- RLS Policies
CREATE POLICY "Users can manage own chats" ON nova_chats
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can view messages in own chats" ON nova_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT id FROM nova_chats
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    )
  );

-- Service role can insert messages (for AI responses)
CREATE POLICY "Service role can insert messages" ON nova_messages
  FOR INSERT WITH CHECK (true);

-- Service role can update chats (for title generation)
CREATE POLICY "Service role can update chats" ON nova_chats
  FOR UPDATE USING (true);
