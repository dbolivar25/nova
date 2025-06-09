import { apiRequest } from "./client";
import type {
  JournalEntry,
  JournalPrompt,
  JournalStats,
  JournalInsights,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@/lib/types/journal";

// Journal Entries
export async function getJournalEntries(
  limit?: number,
  offset?: number,
  startDate?: string,
  endDate?: string
): Promise<{ entries: JournalEntry[] }> {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (offset) params.append("offset", offset.toString());
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  return apiRequest(`/journal/entries?${params.toString()}`);
}

export async function getJournalEntry(id: string): Promise<JournalEntry> {
  return apiRequest(`/journal/entries/${id}`);
}

export async function getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
  const { entry } = await apiRequest<{ entry: JournalEntry | null }>(
    `/journal/entries/${date}`
  );
  return entry;
}

export async function createJournalEntry(
  input: CreateJournalEntryInput
): Promise<JournalEntry> {
  // Transform camelCase to snake_case for API
  const apiInput = {
    entry_date: input.entryDate,
    freeform_text: input.freeformText,
    mood: input.mood,
    prompt_responses: input.promptResponses?.map(pr => ({
      prompt_id: pr.promptId,
      response_text: pr.responseText,
    })),
  };
  
  const { entry } = await apiRequest<{ entry: JournalEntry }>("/journal/entries", {
    method: "POST",
    body: apiInput,
  });
  
  return entry;
}

export async function updateJournalEntry(
  date: string,
  input: UpdateJournalEntryInput
): Promise<JournalEntry> {
  // Transform camelCase to snake_case for API
  const apiInput = {
    freeform_text: input.freeformText,
    mood: input.mood,
    prompt_responses: input.promptResponses?.map(pr => ({
      prompt_id: pr.promptId,
      response_text: pr.responseText,
    })),
  };
  
  const { entry } = await apiRequest<{ entry: JournalEntry }>(`/journal/entries/${date}`, {
    method: "PUT",
    body: apiInput,
  });
  
  return entry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  return apiRequest(`/journal/entries/${id}`, {
    method: "DELETE",
  });
}

// Journal Prompts
export async function getJournalPrompts(): Promise<JournalPrompt[]> {
  const { prompts } = await apiRequest<{ prompts: JournalPrompt[] }>(
    "/journal/prompts"
  );
  return prompts;
}

export async function getTodaysPrompts(): Promise<JournalPrompt[]> {
  const { prompts } = await apiRequest<{ prompts: JournalPrompt[] }>(
    "/journal/prompts/today"
  );
  return prompts;
}

// Journal Stats
export async function getJournalStats(): Promise<JournalStats> {
  return apiRequest("/journal/stats");
}

export async function getJournalInsights(): Promise<JournalInsights> {
  return apiRequest("/journal/insights");
}

// Helper function to calculate word count
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}