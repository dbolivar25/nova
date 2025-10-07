/**
 * Streaming Hooks for Nova Agent
 *
 * Handle real-time event delivery to client via Server-Sent Events
 */

import type { SSEService } from '@/features/nova/server/sse-connection';
import type { HookModule } from '@/features/nova/core/types';
import { SSE_EVENTS } from '@/features/nova/core/types';

export interface StreamingHookDependencies {
  sse: SSEService;
}

/**
 * Create SSE streaming hooks for real-time event delivery
 */
export function createStreamingHooks(
  deps: StreamingHookDependencies
): HookModule {
  const { sse } = deps;

  return {
    'chat:started': {
      handler: async (ctx) => {
        sse.send(SSE_EVENTS.STREAM_START, {
          streamId: ctx.streamId,
          chatId: ctx.chatId,
          timestamp: new Date().toISOString(),
        });

        ctx.metrics.trackEvent('sse:stream_start_sent', {
          streamId: ctx.streamId,
          chatId: ctx.chatId,
        });
      },
      metadata: {
        priority: 5, // Send early
        parallel: false,
      },
    },

    'content:delta': {
      handler: async (ctx) => {
        const { actionId, partial } = ctx.event;

        // Only send deltas for actual response content
        if (partial.agentResponse?.response) {
          const currentContent = partial.agentResponse.response;
          const previousContent = ctx.state.blockContents.get(actionId) || '';

          if (currentContent.length > previousContent.length) {
            const delta = currentContent.slice(previousContent.length);

            sse.send(SSE_EVENTS.CONTENT_BLOCK_DELTA, {
              blockId: actionId,
              delta,
              chatId: ctx.chatId,
            });

            // Update block content tracking
            const newBlockContents = new Map(ctx.state.blockContents);
            newBlockContents.set(actionId, currentContent);
            ctx.updateState({ blockContents: newBlockContents });

            ctx.metrics.trackEvent('sse:delta_sent', {
              actionId,
              deltaLength: delta.length,
            });
          }
        }
      },
      metadata: {
        priority: 10,
        parallel: false, // Must be sequential for delta calculation
      },
    },

    'source:added': {
      handler: async (ctx) => {
        const { actionId, source } = ctx.event;

        sse.send(SSE_EVENTS.SOURCE_ADDED, {
          blockId: actionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          source: source as any, // BAML source type
          chatId: ctx.chatId,
        });

        ctx.metrics.trackEvent('sse:source_added', { actionId });
      },
      metadata: {
        priority: 15,
        parallel: true,
      },
    },

    'chat:completed': {
      handler: async (ctx) => {
        const { actionId, content } = ctx.event;

        // Send content complete
        sse.send(SSE_EVENTS.CONTENT_BLOCK_COMPLETE, {
          blockId: actionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: { content: content as any }, // BAML content type
          chatId: ctx.chatId,
        });

        // Send stream end
        sse.send(SSE_EVENTS.STREAM_END, {
          chatId: ctx.chatId,
          metrics: {
            duration: ctx.metrics.getDuration(),
            eventCount: ctx.state.eventCount,
          },
        });

        ctx.metrics.trackEvent('sse:block_complete_sent', { actionId });
        ctx.metrics.trackEvent('sse:stream_end_sent', {
          chatId: ctx.chatId,
          duration: ctx.metrics.getDuration(),
        });
      },
      metadata: {
        priority: 20,
        parallel: false,
      },
    },

    'retry:attempted': {
      handler: async (ctx) => {
        const { retry, error } = ctx.event;

        sse.send(SSE_EVENTS.PING, {
          message: `Retrying request (attempt ${retry})...`,
          chatId: ctx.chatId,
          metadata: {
            retry,
            error: error.message,
          },
        });

        ctx.metrics.trackEvent('sse:retry_notification', { retry });
      },
      metadata: {
        priority: 10,
        parallel: true,
      },
    },

    'rate_limit:retry': {
      handler: async (ctx) => {
        const { attempt, waitMs, error } = ctx.event;

        sse.send(SSE_EVENTS.PING, {
          message: `Rate limit encountered. Waiting ${Math.round(waitMs / 1000)}s before retry (attempt ${attempt})...`,
          chatId: ctx.chatId,
          metadata: {
            attempt,
            waitMs,
            error: error.message,
          },
        });

        ctx.metrics.trackEvent('sse:rate_limit_retry', { attempt, waitMs });
      },
      metadata: {
        priority: 10,
        parallel: true,
      },
    },

    'chat:error': {
      handler: async (ctx) => {
        const { error } = ctx.event;

        sse.send(SSE_EVENTS.ERROR, {
          message: error.message,
          code: 'STREAM_ERROR',
          chatId: ctx.chatId,
        });

        ctx.metrics.trackEvent('sse:error_sent', {
          error: error.message,
        });
      },
      metadata: {
        priority: 10,
        parallel: false,
      },
    },

    'chat:timeout': {
      handler: async (ctx) => {
        sse.send(SSE_EVENTS.ERROR, {
          message: 'Stream timeout exceeded. Please try again.',
          code: 'TIMEOUT_ERROR',
          chatId: ctx.chatId,
        });

        ctx.metrics.trackEvent('sse:timeout_sent', {
          chatId: ctx.chatId,
          duration: ctx.metrics.getDuration(),
        });
      },
      metadata: {
        priority: 10,
        parallel: false,
      },
    },
  };
}
