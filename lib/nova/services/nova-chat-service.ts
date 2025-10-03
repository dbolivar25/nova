/**
 * Nova Chat Service
 *
 * Manages conversation state and message persistence
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { NovaMessage } from '@/lib/baml_client/types';

export class NovaChatService {
  /**
   * Save user message to database
   */
  static async saveUserMessage(
    userId: string,
    message: string
  ): Promise<string> {
    const supabase = await createServerSupabaseClient();

    // Get user ID from Clerk ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        message_role: 'user',
        message_content: message,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save user message: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get conversation history
   * Returns messages in BAML NovaMessage format
   */
  static async getConversationHistory(
    userId: string,
    limit: number = 20
  ): Promise<NovaMessage[]> {
    const supabase = await createServerSupabaseClient();

    // Get user ID from Clerk ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return [];
    }

    const { data: messages } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!messages) {
      return [];
    }

    // Reverse to get chronological order
    return messages.reverse().map((msg) => {
      const content =
        msg.message_role === 'user'
          ? {
              type: 'NovaUserContent' as const,
              message: msg.message_content,
            }
          : {
              type: 'NovaAgentContent' as const,
              response: msg.message_content,
              sources: [], // TODO: Parse from metadata if we store it
            };

      return {
        id: msg.id,
        content,
        timestamp: msg.created_at || new Date().toISOString(),
      };
    });
  }

  /**
   * Clear old conversation history (for cleanup)
   */
  static async clearOldMessages(
    userId: string,
    daysToKeep: number = 30
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDate.toISOString());
  }
}
