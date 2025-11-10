import { ToolLoopAgent, Output, tool } from "ai";
import type { ZodTypeAny } from "zod";
import { z } from "zod";
import { novaModel } from "@/shared/lib/ai/provider";
import { NovaContextService } from "@/features/nova/services/nova-context-service";
import { NovaChatService } from "@/features/nova/services/nova-chat-service";

// Structured output for Nova assistant responses.
// This closely mirrors the previous AgentContent shape used in the UI and persistence.
export const NovaAssistantOutputSchema = z.object({
  response: z.string().describe("Primary assistant reply to render to the user."),
  sources: z
    .array(
      z.object({
        type: z.string(),
        entryDate: z.string().optional(),
        excerpt: z.string().optional(),
        mood: z.string().optional(),
      })
    )
    .optional(),
});

export type NovaAssistantOutput = z.infer<typeof NovaAssistantOutputSchema>;

// Tools

const getJournalContextTool = tool({
  description: "Get recent journal entries for additional context.",
  inputSchema: z.object({
    userId: z.string(),
    limit: z.number().min(1).max(25).default(15),
  }),
  // NovaContextService already handles user lookup and shaping.
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

export const novaAgent = new ToolLoopAgent({
  model: novaModel,
  instructions:
    "You are Nova, a thoughtful journaling companion. " +
    "Use the provided tools to incorporate the user's past entries, insights, and preferences. " +
    "Be concise, warm, and pragmatic. When referencing prior entries, be accurate and avoid fabrications.",
  tools: {
    getJournalContext: getJournalContextTool,
    getUserContext: getUserContextTool,
    getChatHistory: getChatHistoryTool,
  },
  output: Output.object({
    schema: NovaAssistantOutputSchema as ZodTypeAny,
  }),
});
