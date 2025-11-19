import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { novaAgent, NovaAssistantOutputSchema } from "@/features/nova/core/nova-agent";
import { NovaChatService } from "@/features/nova/services/nova-chat-service";
import { NovaContextService } from "@/features/nova/services/nova-context-service";

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
    const { message, chatId: requestChatId, temporary, includeHistory } = ChatRequestSchema.parse(
      json,
    );

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

    // Load limited history for context if requested
    const historyMessages = includeHistory
      ? await NovaChatService.getChatHistory(chatId, userId, 10)
      : [];

    // Build contextual data
    const [userContext, journalContext] = await Promise.all([
      NovaContextService.getUserJournalContext(userId, userEmail),
      NovaContextService.buildJournalContext(userId, message, 15),
    ]);

    const temporalContext = NovaContextService.getTemporalContext(new Date());

    // Map stored history (BAML-style messages) into LLM-friendly text messages.
    const mappedHistory = historyMessages
      .map((m) => {
        const c = m.content as { type?: string; userMessage?: { message?: string }; agentResponse?: { response?: string } };
        if (c?.type === "UserContent") {
          return { role: "user" as const, content: c.userMessage?.message ?? "" };
        }
        if (c?.type === "AgentContent") {
          return { role: "assistant" as const, content: c.agentResponse?.response ?? "" };
        }
        return null;
      })
      .filter((m): m is { role: "user" | "assistant"; content: string } => !!m && !!m.content);

    const messages = [
      {
        role: "system" as const,
        content:
          "You are Nova, a thoughtful journaling companion. " +
          "Use the provided structured context about the user and their journal entries.",
      },
      {
        role: "system" as const,
        content: JSON.stringify({ userContext, journalContext, temporalContext }),
      },
      ...mappedHistory,
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Run the agent and stream plain text back to the client.
    const streamResult = await novaAgent.stream({ messages });
    const outputPromise = streamResult.output;

    const encoder = new TextEncoder();
    let previousResponse = "";

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const partial of streamResult.partialOutputStream) {
            const next = partial?.response ?? "";
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

    // Persist assistant message asynchronously once full structured output is available.
    void outputPromise
      .then(async (fullOutput) => {
        const parsed = NovaAssistantOutputSchema.parse(fullOutput);
        await NovaChatService.saveAssistantMessage({
          chatId,
          content: {
            type: "AgentContent",
            agentResponse: { response: parsed.response },
            sources: parsed.sources ?? [],
          } as unknown as import("@/shared/lib/supabase/types").Json,
          metadata: {
            streamId: chatId,
            processingTime: 0,
          },
        });
      })
      .catch((error) => {
        console.error("[Nova Chat] Failed to persist assistant message:", error);
      });

    // Return a simple text stream (no SSE). Client will treat chunks as deltas.
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
      { status: 500 },
    );
  }
}
