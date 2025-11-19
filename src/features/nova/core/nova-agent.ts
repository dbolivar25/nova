import { ToolLoopAgent, Output, tool } from "ai";
import { z } from "zod";
import { novaModel } from "@/shared/lib/ai/provider";
import { NovaContextService } from "@/features/nova/services/nova-context-service";
import { NovaChatService } from "@/features/nova/services/nova-chat-service";

// Structured output for Nova assistant responses.
// This closely mirrors the previous AgentContent shape used in the UI and persistence.
const journalSourceSchema = z.object({
  type: z.literal("JournalEntryRef"),
  entryDate: z.string().describe("ISO date for the journal entry being cited."),
  excerpt: z.string().describe("Relevant excerpt from the entry."),
  mood: z.string().optional().describe("Optional mood captured for the entry."),
});

const insightSourceSchema = z.object({
  type: z.literal("WeeklyInsightRef"),
  insightType: z.string().describe("Insight category or name."),
  summary: z.string().describe("What the referenced weekly insight said."),
});

export const NovaAssistantOutputSchema = z.object({
  response: z.string().describe("Primary assistant reply to render to the user."),
  sources: z
    .array(z.union([journalSourceSchema, insightSourceSchema]))
    .default([]),
});

export type NovaAssistantOutput = z.infer<typeof NovaAssistantOutputSchema>;

const NOVA_INSTRUCTIONS = `
You are Nova, a warm and evidence-based journaling companion that helps people reflect and grow.

Tone & style:
- Warm, empathetic, concise, and pragmatic
- Use short paragraphs (2-3 sentences) separated by DOUBLE newlines for readability
- Celebrate progress and ask one thoughtful follow-up question when it helps

Ground rules:
- Never fabricate details; only use information from provided context or tools
- Prefer recent journal entries when citing patterns
- If you need additional context, call the available tools (journal context, user context, chat history)

Citations:
- When referencing past entries, include inline citations like [1](@source-1)
- The sources array must match the citation order
- Limit to the strongest 1–3 citations; omit if unsupported

Required structured output:
- response: the user-facing message with inline citations when applicable
- sources: array of referenced items. Each item is either
  { type: "JournalEntryRef", entryDate: "YYYY-MM-DD", excerpt: "...", mood?: "..." }
  or { type: "WeeklyInsightRef", insightType: "string", summary: "..." }
`;

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
  instructions: NOVA_INSTRUCTIONS,
  tools: {
    getJournalContext: getJournalContextTool,
    getUserContext: getUserContextTool,
    getChatHistory: getChatHistoryTool,
  },
  output: Output.object({
    schema: NovaAssistantOutputSchema,
  }),
});
