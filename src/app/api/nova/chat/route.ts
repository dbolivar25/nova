/**
 * Nova Chat Streaming Endpoint
 *
 * POST /api/nova/chat
 * Handles SSE streaming for Nova AI conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { b } from '@/integrations/baml_client';
import type { Message } from '@/integrations/baml_client/types';
import { setupSSE } from '@/features/nova/server/sse-connection';
import { NovaStreamHandler } from '@/features/nova/server/stream-handler';
import { HookRegistry } from '@/features/nova/server/hooks/registry';
import { createStreamingHooks } from '@/features/nova/server/hooks/streaming';
import { createDatabaseHooks } from '@/features/nova/server/hooks/database';
import { executeNovaChat } from '@/features/nova/core/executor';
import { NovaChatService } from '@/features/nova/services/nova-chat-service';
import { NovaContextService } from '@/features/nova/services/nova-context-service';
import {
  DEFAULT_NOVA_CONFIG,
  NOVA_SSE_CONFIG,
  NOVA_ERROR_CODES,
  createStreamId,
  createChatId,
  createUserId,
  type NovaContext,
  type NovaDependencies,
} from '@/features/nova/core/types';
import { generateUniqueId } from '@/features/nova/core/executor-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  chatId?: string;
  temporary?: boolean;
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
    const { message, chatId: requestChatId, temporary = false, includeHistory = true } = body;

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
    const typedUserId = createUserId(userId);

    // Build message history asynchronously
    const buildContext = async () => {
      try {
        // Get or create chat thread
        const chat = await NovaChatService.getOrCreateChat({
          chatId: requestChatId,
          userId,
          temporary,
        });

        const chatId = createChatId(chat.id);
        const isNewChat = !requestChatId;

        // Save user message to this chat
        await NovaChatService.saveUserMessage({
          chatId: chat.id,
          userId,
          message,
        });

        // Generate title for new chats (async, non-blocking)
        if (isNewChat && !temporary) {
          NovaChatService.generateChatTitle(chat.id, message).catch((error) =>
            console.error('[Nova Chat] Failed to generate title:', error)
          );
        }

        // Get conversation history if requested
        let messages: Message[] = [];
        if (includeHistory) {
          messages = await NovaChatService.getChatHistory(chat.id, userId, 10);
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
          chatId,
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
        const { messages, userContext, temporalContext, chatId } = await buildContext();

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
