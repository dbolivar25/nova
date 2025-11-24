/**
 * Nova Tools
 *
 * Tools available to the Nova agent for accessing journal data.
 * Tools receive context (userId, etc.) via experimental_context.
 */

import { tool } from "ai";
import { z } from "zod";
import { NovaContextService } from "@/features/nova/services/nova-context-service";
import { InsightsService } from "@/features/nova/services/insights-service";

// ============================================
// Tool Context
// ============================================

export interface NovaToolContext {
  userId: string;
  userEmail: string;
}

interface ToolOptions {
  experimental_context?: {
    toolContext?: NovaToolContext;
  };
}

function getToolContext(options: unknown): NovaToolContext {
  const opts = options as ToolOptions;
  if (!opts?.experimental_context?.toolContext) {
    throw new Error("Tool context not provided");
  }
  return opts.experimental_context.toolContext;
}

// ============================================
// Tools
// ============================================

/**
 * Get a specific journal entry by date.
 * Useful for "what did I write on [date]?" queries.
 */
export const findEntryByDateTool = tool({
  description:
    "Get a specific journal entry by date. Use when the user asks about a specific date like 'what did I write yesterday?' or 'show me my entry from January 1st'.",
  inputSchema: z.object({
    date: z.string().describe("The date in YYYY-MM-DD format"),
  }),
  execute: async ({ date }, options: unknown) => {
    const { userId } = getToolContext(options);
    const entries = await NovaContextService.getRelevantEntries(userId, 100);
    const entry = entries.find((e) => e.entryDate === date);

    if (!entry) {
      return { found: false, message: `No journal entry found for ${date}` };
    }

    return {
      found: true,
      entry: {
        date: entry.entryDate,
        mood: entry.mood,
        freeformText: entry.freeformText,
        promptResponses: entry.promptResponses,
        wordCount: entry.wordCount,
      },
    };
  },
});

/**
 * Get journal entries for a date range.
 * Useful for exploring patterns over specific time periods.
 */
export const listEntriesForDateRangeTool = tool({
  description:
    "Get journal entries within a date range. Use when the user asks about a specific time period like 'what did I write last week?' or 'show me entries from January'.",
  inputSchema: z.object({
    startDate: z.string().describe("Start date in YYYY-MM-DD format (inclusive)"),
    endDate: z.string().describe("End date in YYYY-MM-DD format (inclusive)"),
  }),
  execute: async ({ startDate, endDate }, options: unknown) => {
    const { userId } = getToolContext(options);
    const allEntries = await NovaContextService.getRelevantEntries(userId, 100);

    const filteredEntries = allEntries.filter((e) => {
      return e.entryDate >= startDate && e.entryDate <= endDate;
    });

    if (filteredEntries.length === 0) {
      return { found: false, message: `No journal entries found between ${startDate} and ${endDate}` };
    }

    return {
      found: true,
      count: filteredEntries.length,
      entries: filteredEntries.map((e) => ({
        date: e.entryDate,
        mood: e.mood,
        freeformText: e.freeformText,
        promptResponses: e.promptResponses,
        wordCount: e.wordCount,
      })),
    };
  },
});

/**
 * Search journal entries by keyword.
 * Useful for finding entries about specific topics.
 */
export const searchEntriesTool = tool({
  description:
    "Search journal entries for specific keywords or phrases. Use when the user asks about entries mentioning a topic like 'when did I write about anxiety?' or 'find entries about my job'.",
  inputSchema: z.object({
    query: z.string().describe("The keyword or phrase to search for"),
    limit: z.number().min(1).max(20).default(10).describe("Maximum number of results to return"),
  }),
  execute: async ({ query, limit }, options: unknown) => {
    const { userId } = getToolContext(options);
    const allEntries = await NovaContextService.getRelevantEntries(userId, 100);

    const queryLower = query.toLowerCase();
    const matchingEntries = allEntries.filter((e) => {
      const freeformMatch = e.freeformText?.toLowerCase().includes(queryLower);
      const promptMatch = e.promptResponses.some(
        (p) =>
          p.promptText?.toLowerCase().includes(queryLower) ||
          p.responseText?.toLowerCase().includes(queryLower)
      );
      return freeformMatch || promptMatch;
    });

    const limited = matchingEntries.slice(0, limit);

    if (limited.length === 0) {
      return { found: false, message: `No journal entries found containing "${query}"` };
    }

    return {
      found: true,
      count: limited.length,
      totalMatches: matchingEntries.length,
      entries: limited.map((e) => ({
        date: e.entryDate,
        mood: e.mood,
        freeformText: e.freeformText,
        promptResponses: e.promptResponses,
        wordCount: e.wordCount,
      })),
    };
  },
});

/**
 * Get the user's weekly insights summary.
 */
export const findWeeklyInsightsTool = tool({
  description:
    "Get the user's weekly insights and patterns. Use when the user asks about their patterns, trends, growth, or weekly summary. Can fetch insights for a specific week or the most recent week.",
  inputSchema: z.object({
    weekStartDate: z
      .string()
      .nullish()
      .describe("Optional: Start date of the week in YYYY-MM-DD format. If not provided, returns the most recent insights."),
  }),
  execute: async ({ weekStartDate }, options: unknown) => {
    const { userId } = getToolContext(options);

    try {
      const insights = weekStartDate
        ? await InsightsService.getInsightsForWeek(userId, weekStartDate)
        : await InsightsService.getLatestInsights(userId);

      if (!insights) {
        const msg = weekStartDate
          ? `No weekly insights found for week starting ${weekStartDate}`
          : "No weekly insights available yet";
        return { found: false, message: msg };
      }

      return {
        found: true,
        weekStartDate: insights.weekStartDate,
        weekEndDate: insights.weekEndDate,
        entryCount: insights.entryCount,
        emotionalTrends: {
          overallMood: insights.emotionalTrends.overallMood,
          summary: insights.emotionalTrends.summary,
          dominantEmotions: insights.emotionalTrends.dominantEmotions,
        },
        keyThemes: insights.keyThemes.map((t) => ({
          name: t.name,
          description: t.description,
        })),
        growthMoments: insights.growthMoments.map((m) => ({
          title: m.title,
          significance: m.significance,
        })),
        novaObservation: insights.novaObservation,
      };
    } catch {
      return { found: false, message: "Unable to retrieve weekly insights" };
    }
  },
});

// ============================================
// Tool Set Export
// ============================================

export const novaTools = {
  findEntryByDate: findEntryByDateTool,
  listEntriesForDateRange: listEntriesForDateRangeTool,
  searchEntries: searchEntriesTool,
  findWeeklyInsights: findWeeklyInsightsTool,
};
