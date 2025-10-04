/**
 * Nova Chat Streaming Endpoint
 *
 * POST /api/nova/chat
 * Handles SSE streaming for Nova AI conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { b } from '@/lib/baml_client';
import type { Message } from '@/lib/baml_client/types';
import { setupSSE } from '@/lib/middleware/sse-connection';
import { NovaStreamHandler } from '@/lib/nova/stream-handler';
import { HookRegistry } from '@/lib/nova/hooks/registry';
import { createStreamingHooks } from '@/lib/nova/hooks/streaming';
import { createDatabaseHooks } from '@/lib/nova/hooks/database';
import { executeNovaChat } from '@/lib/nova/core/executor';
import { NovaChatService } from '@/lib/nova/services/nova-chat-service';
import { NovaContextService } from '@/lib/nova/services/nova-context-service';
import {
  DEFAULT_NOVA_CONFIG,
  NOVA_SSE_CONFIG,
  NOVA_ERROR_CODES,
  createStreamId,
  createChatId,
  createUserId,
  type NovaContext,
  type NovaDependencies,
} from '@/lib/nova/core/types';
import { generateUniqueId } from '@/lib/nova/core/executor-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  includeHistory?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email
    const user = await auth();
    const userEmail = user.sessionClaims?.email as string || '';

    // Parse request body
    const body: ChatRequest = await req.json();
    const { message, includeHistory = true } = body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > DEFAULT_NOVA_CONFIG.MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Message exceeds maximum length of ${DEFAULT_NOVA_CONFIG.MAX_MESSAGE_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Set up SSE
    const { stream, sse } = setupSSE(req, NOVA_SSE_CONFIG);

    // Create typed IDs
    const streamId = createStreamId(sse.streamId);
    const chatId = createChatId(generateUniqueId()); // Generate unique chat ID
    const typedUserId = createUserId(userId);

    // Build message history asynchronously
    const buildContext = async () => {
      try {
        // Save user message
        await NovaChatService.saveUserMessage(userId, message);

        // Get conversation history if requested
        let messages: Message[] = [];
        if (includeHistory) {
          messages = await NovaChatService.getConversationHistory(userId, 10);
        }

        // Get journal context for this query
        const journalContext = await NovaContextService.buildJournalContext(
          userId,
          message,
          DEFAULT_NOVA_CONFIG.JOURNAL_CONTEXT_LIMIT
        );

        // Inject journal context as SystemContent
        if (journalContext && journalContext.length > 0) {
          messages.push({
            id: generateUniqueId(),
            content: {
              type: 'SystemContent',
              contextResult: {
                type: 'JournalContext',
                entries: journalContext,
              },
            },
          });
        }

        // Add current user message
        messages.push({
          id: generateUniqueId(),
          content: {
            type: 'UserContent',
            userMessage: {
              type: 'UserMessage',
              message,
            },
          },
        });

        // Build user context
        const userContext = await NovaContextService.buildUserContext(userId, userEmail);
        const temporalContext = NovaContextService.getTemporalContext(new Date());

        return {
          messages,
          userContext,
          temporalContext,
        };
      } catch (error) {
        console.error('[Nova Chat] Error building context:', error);
        throw error;
      }
    };

    // Execute in background
    (async () => {
      try {
        // Build context
        const { messages, userContext, temporalContext } = await buildContext();

        // Create context for executor
        const context: NovaContext = {
          messages,
          userContext,
          temporalContext,
          config: DEFAULT_NOVA_CONFIG,
          bamlContext: {
            uniqueId: generateUniqueId(),
          },
        };

        // Create dependencies
        const dependencies: NovaDependencies = {
          streamNovaResponse: (msgs, uCtx, tCtx) =>
            b.stream.GenerateNovaResponse(msgs, uCtx, tCtx),
          generateId: generateUniqueId,
          getTemporalContext: (date) => NovaContextService.getTemporalContext(date),
        };

        // Set up hook registry
        const registry = new HookRegistry();
        registry.register(createStreamingHooks({ sse }), 'streaming');
        registry.register(createDatabaseHooks({ sse }), 'database');

        // Create stream handler
        const handler = new NovaStreamHandler(registry, {
          streamId,
          chatId,
          userId: typedUserId,
          timeout: context.config.STREAM_TIMEOUT_MS,
        });

        // Execute chat
        await handler.handleStream(executeNovaChat(context, dependencies));

        // Log final state
        const summary = handler.getStateSummary();
        console.log('[Nova Chat] Stream completed', {
          streamId,
          summary,
        });

        // End SSE stream
        await sse.end();
      } catch (error) {
        console.error('[Nova Chat] Stream error:', error);

        // Send error to client if still connected
        if (sse.isConnected()) {
          sse.sendError(
            error instanceof Error ? error.message : 'An unexpected error occurred',
            NOVA_ERROR_CODES.STREAM_ERROR
          );
        }

        // Always end the stream
        await sse.end();
      }
    })();

    // Return SSE stream immediately
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[Nova Chat] Request error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
