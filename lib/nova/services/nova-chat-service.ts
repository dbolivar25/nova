/**
 * Nova Chat Service
 *
 * Manages threaded conversations and message persistence
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Message } from '@/lib/baml_client/types';
import type { Json } from '@/lib/supabase/types';

interface Chat {
  id: string;
  title: string | null;
  temporary: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatWithMessages extends Chat {
  messages: NovaMessage[];
}

interface NovaMessage {
  id: string;
  chat_id: string;
  sender_type: 'user' | 'assistant' | 'system';
  content: Json;
  metadata: Json;
  created_at: string;
}

export class NovaChatService {
  /**
   * Get or create a chat thread
   */
  static async getOrCreateChat(params: {
    chatId?: string;
    userId: string;
    temporary?: boolean;
  }): Promise<ChatWithMessages> {
    const supabase = await createServerSupabaseClient();

    // Get internal user UUID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', params.userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    if (params.chatId) {
      // Fetch existing chat with messages
      const { data: chat, error } = await supabase
        .from('nova_chats')
        .select(`
          *,
          messages:nova_messages(*)
        `)
        .eq('id', params.chatId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error || !chat) {
        throw new Error('Chat not found');
      }

      return chat as ChatWithMessages;
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('nova_chats')
      .insert({
        user_id: user.id,
        title: 'New Conversation',
        temporary: params.temporary || false,
      })
      .select('*')
      .single();

    if (createError || !newChat) {
      throw new Error('Failed to create chat');
    }

    return {
      ...newChat,
      messages: [],
    } as ChatWithMessages;
  }

  /**
   * Save user message
   */
  static async saveUserMessage(params: {
    chatId: string;
    userId: string;
    message: string;
  }): Promise<string> {
    const supabase = await createServiceRoleClient();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', params.userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    const content = {
      type: 'UserContent',
      userMessage: {
        type: 'UserMessage',
        message: params.message,
      },
    };

    const { data, error } = await supabase
      .from('nova_messages')
      .insert({
        chat_id: params.chatId,
        sender_type: 'user',
        created_by: user.id,
        content: content as unknown as Json,
        metadata: {
          messageType: 'user',
          contentType: 'UserContent',
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save user message:', error);
      throw new Error(`Failed to save user message: ${error.message}`);
    }

    // Update chat timestamp
    await supabase
      .from('nova_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.chatId);

    return data.id;
  }

  /**
   * Save assistant message with sources
   */
  static async saveAssistantMessage(params: {
    chatId: string;
    content: Json;  // AgentContent from BAML
    metadata?: {
      streamId: string;
      processingTime: number;
    };
  }): Promise<string> {
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from('nova_messages')
      .insert({
        chat_id: params.chatId,
        sender_type: 'assistant',
        created_by: null,
        content: params.content,
        metadata: {
          messageType: 'assistant',
          contentType: 'AgentContent',
          ...params.metadata,
        } as unknown as Json,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save assistant message:', error);
      throw new Error(`Failed to save assistant message: ${error.message}`);
    }

    // Update chat timestamp
    await supabase
      .from('nova_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.chatId);

    return data.id;
  }

  /**
   * Get chat history (for LLM context)
   */
  static async getChatHistory(
    chatId: string,
    userId: string,
    limit: number = 20
  ): Promise<Message[]> {
    const supabase = await createServerSupabaseClient();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return [];
    }

    // Verify chat belongs to user
    const { data: chat } = await supabase
      .from('nova_chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!chat) {
      return [];
    }

    // Get messages
    const { data: messages } = await supabase
      .from('nova_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!messages) {
      return [];
    }

    // Reverse to chronological order and convert to BAML Message format
    return messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content as any, // BAML MessageContent type
    }));
  }

  /**
   * List user's chats
   */
  static async listChats(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    title: string | null;
    lastMessage?: string;
    updatedAt: string;
    messageCount: number;
  }>> {
    const supabase = await createServerSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return [];
    }

    const { data: chats } = await supabase
      .from('nova_chats')
      .select(`
        id,
        title,
        updated_at,
        created_at,
        messages:nova_messages(content, created_at)
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('temporary', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!chats) {
      return [];
    }

    return chats.map((chat) => {
      const messages = (chat.messages as any[]) || [];
      const lastMsg = messages[messages.length - 1];
      const lastMsgContent = lastMsg?.content as any;

      let lastMessage = '';
      if (lastMsgContent?.userMessage?.message) {
        lastMessage = lastMsgContent.userMessage.message;
      } else if (lastMsgContent?.agentResponse?.response) {
        lastMessage = lastMsgContent.agentResponse.response;
      }

      return {
        id: chat.id,
        title: chat.title,
        lastMessage: lastMessage.substring(0, 100),
        updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
        messageCount: messages.length,
      };
    });
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(
    chatId: string,
    title: string
  ): Promise<void> {
    const supabase = await createServiceRoleClient();

    await supabase
      .from('nova_chats')
      .update({ title })
      .eq('id', chatId);
  }

  /**
   * Delete chat (soft delete)
   */
  static async deleteChat(chatId: string, userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    await supabase
      .from('nova_chats')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('user_id', user.id);
  }

  /**
   * Generate AI title for chat (async, non-blocking)
   */
  static async generateChatTitle(
    chatId: string,
    firstMessage: string
  ): Promise<void> {
    try {
      // TODO: Add BAML function GenerateNovaTitle
      // const title = await b.GenerateNovaTitle(firstMessage.slice(0, 500));

      // For now, use truncated message as title
      const title = firstMessage.slice(0, 50) || 'New Conversation';

      await this.updateChatTitle(chatId, title);
      console.log(`[Nova] Generated title for chat ${chatId}: ${title}`);
    } catch (error) {
      console.error('[Nova] Failed to generate title:', error);
      // Fallback to default title
      const fallback = firstMessage.slice(0, 50) || 'New Conversation';
      await this.updateChatTitle(chatId, fallback);
    }
  }
}
