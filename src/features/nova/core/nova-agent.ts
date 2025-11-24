/**
 * Nova Agent Configuration
 *
 * Configures the AI SDK ToolLoopAgent with tools for accessing
 * journal context, user context, and chat history.
 */

import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { novaModel } from "@/shared/lib/ai/provider";
import { NovaContextService } from "@/features/nova/services/nova-context-service";
import { NovaChatService } from "@/features/nova/services/nova-chat-service";
import { novaOutputSpec } from "./nova-output";
import { buildNovaSystemPrompt, type NovaSystemPromptContext } from "./nova-prompts";

// ============================================
// Tools
// ============================================

const getJournalContextTool = tool({
  description: "Get recent journal entries for additional context.",
  inputSchema: z.object({
    userId: z.string(),
    limit: z.number().min(1).max(25).default(15),
  }),
  async execute({ userId, limit }) {
    const entries = await NovaContextService.getRelevantEntries(userId, limit);
    return { entries };
  },
});

const getUserContextTool = tool({
  description: "Get high-level user journaling stats and preferences.",
  inputSchema: z.object({
    userId: z.string(),
    userEmail: z.string().optional().default(""),
  }),
  async execute({ userId, userEmail }) {
    const userContext = await NovaContextService.getUserJournalContext(userId, userEmail);
    return { userContext };
  },
});

const getChatHistoryTool = tool({
  description: "Get recent messages from this Nova chat.",
  inputSchema: z.object({
    chatId: z.string(),
    userId: z.string(),
    limit: z.number().min(1).max(30).default(10),
  }),
  async execute({ chatId, userId, limit }) {
    const messages = await NovaChatService.getChatHistory(chatId, userId, limit);
    return { messages };
  },
});

// ============================================
// Agent Factory
// ============================================

export interface CreateNovaAgentOptions {
  context: NovaSystemPromptContext;
}

export function createNovaAgent({ context }: CreateNovaAgentOptions) {
  const systemPrompt = buildNovaSystemPrompt(context);

  return new ToolLoopAgent({
    model: novaModel,
    instructions: systemPrompt,
    tools: {
      getJournalContext: getJournalContextTool,
      getUserContext: getUserContextTool,
      getChatHistory: getChatHistoryTool,
    },
    output: novaOutputSpec,
  });
}
