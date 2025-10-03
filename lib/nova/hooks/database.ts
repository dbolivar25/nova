/**
 * Database Hooks for Nova Agent
 *
 * Handle persisting conversation messages and references to Supabase
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SSEService } from '@/lib/middleware/sse-connection';
import type { HookModule } from '../core/types';

export interface DatabaseHookDependencies {
  sse: SSEService;
}

/**
 * Create database hooks for conversation persistence
 */
export function createDatabaseHooks(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _deps: DatabaseHookDependencies
): HookModule {

  return {
    'chat:completed': {
      handler: async (ctx) => {
        const { content } = ctx.event;

        try {
          const supabase = await createServerSupabaseClient();

          // Get internal user UUID from Clerk ID
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', ctx.userId)
            .single();

          if (!user) {
            throw new Error('User not found for saving assistant message');
          }

          // Save Nova's response to ai_conversations table
          // Note: This will be called from the API route which already saved the user message
          const { error } = await supabase
            .from('ai_conversations')
            .insert({
              user_id: user.id,
              message_role: 'assistant',
              message_content: content.response,
              // Note: No journal_entry_id since this is a general chat response
              // We could add a metadata JSONB column for sources if needed
            });

          if (error) {
            throw error;
          }

          ctx.metrics.trackEvent('database:message_saved', {
            chatId: ctx.chatId,
          });
        } catch (error) {
          console.error('[DatabaseHooks] Failed to save message:', error);
          // Don't fail the whole stream for database errors
          ctx.metrics.trackEvent('database:message_save_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      metadata: {
        priority: 30, // After streaming completes
        parallel: true, // Can run in parallel with other cleanup
      },
    },
  };
}
