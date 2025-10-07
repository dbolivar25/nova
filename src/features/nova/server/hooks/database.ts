/**
 * Database Hooks for Nova Agent
 *
 * Handle persisting conversation messages and references to Supabase
 */

import { NovaChatService } from '@/features/nova/services/nova-chat-service';
import type { SSEService } from '@/features/nova/server/sse-connection';
import type { HookModule } from '@/features/nova/core/types';
import type { Json } from '@/shared/lib/supabase/types';

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
          // Save assistant message with full content and sources
          await NovaChatService.saveAssistantMessage({
            chatId: ctx.chatId,
            content: content as unknown as Json,
            metadata: {
              streamId: ctx.streamId,
              processingTime: ctx.metrics.getDuration(),
            },
          });

          ctx.metrics.trackEvent('database:message_saved', {
            chatId: ctx.chatId,
          });

          console.log(`[DatabaseHooks] Saved assistant message to chat ${ctx.chatId}`);
        } catch (error) {
          console.error('[DatabaseHooks] Failed to save message:', error);
          // This is critical - propagate error
          ctx.metrics.trackEvent('database:message_save_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      metadata: {
        priority: 30, // After streaming completes
        parallel: false, // Cannot fail silently
      },
    },
  };
}
