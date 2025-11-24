/**
 * Nova Chat API Route
 *
 * Handles chat requests to the Nova AI companion using AI SDK with BAML parsing.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createNovaAgent } from "@/features/nova/core/nova-agent";
import { createUserMessage, toAISDKMessages } from "@/features/nova/core/nova-prompts";
import { NovaChatService } from "@/features/nova/services/nova-chat-service";
import { NovaContextService } from "@/features/nova/services/nova-context-service";
import type { AgentContent } from "@/integrations/baml_client/types";
import type { partial_types } from "@/integrations/baml_client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  chatId: z.string().optional(),
  temporary: z.boolean().optional().default(false),
  includeHistory: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { message, chatId: requestChatId, temporary, includeHistory } = ChatRequestSchema.parse(json);

    const userEmail = (sessionClaims?.email as string) || "";

    // Get or create chat thread
    const chat = await NovaChatService.getOrCreateChat({
      chatId: requestChatId,
      userId,
      temporary,
    });

    const chatId = chat.id;

    // Persist user message immediately
    await NovaChatService.saveUserMessage({
      chatId,
      userId,
      message,
    });

    // Build context in parallel - only prefetch 5 recent entries since tools can fetch more
    const [userContext, journalContext, historyMessages] = await Promise.all([
      NovaContextService.getUserJournalContext(userId, userEmail),
      NovaContextService.buildJournalContext(userId, message, 5),
      includeHistory ? NovaChatService.getChatHistory(chatId, userId, 10) : Promise.resolve([]),
    ]);

    const temporalContext = NovaContextService.getTemporalContext(new Date());

    // Create agent with full context baked into system prompt
    const novaAgent = createNovaAgent({
      context: {
        userContext,
        journalContext,
        temporalContext,
      },
      toolContext: {
        userId,
        userEmail,
      },
    });

    // Create BAML message for current user input (same format as history)
    const currentMessage = createUserMessage(message);

    // Combine history + current, convert to AI SDK format with XML content
    const allMessages = [...historyMessages, currentMessage];
    const messages = toAISDKMessages(allMessages);

    // Run the agent and stream response
    const streamResult = await novaAgent.stream({ messages });
    const outputPromise = streamResult.output as Promise<AgentContent>;

    const encoder = new TextEncoder();
    let previousResponse = "";

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const partial of streamResult.partialOutputStream as AsyncIterable<
            partial_types.AgentContent | undefined
          >) {
            const next = partial?.agentResponse?.response ?? "";
            if (!next || next === previousResponse) {
              continue;
            }

            const delta = next.slice(previousResponse.length);
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
            previousResponse = next;
          }
          controller.close();
        } catch (error) {
          console.error("[Nova Chat] Stream error:", error);
          controller.error(error);
        }
      },
    });

    // Persist assistant message asynchronously
    void outputPromise
      .then(async (fullOutput) => {
        await NovaChatService.saveAssistantMessage({
          chatId,
          content: fullOutput as unknown as import("@/shared/lib/supabase/types").Json,
          metadata: {
            streamId: chatId,
            processingTime: 0,
          },
        });
      })
      .catch((error) => {
        console.error("[Nova Chat] Failed to persist assistant message:", error);
      });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "x-nova-chat-id": chatId,
      },
    });
  } catch (error) {
    console.error("[Nova Chat] Request error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
