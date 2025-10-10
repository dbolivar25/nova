"use server";

import { differenceInDays } from "date-fns";
import { b } from "@/integrations/baml_client";
import type { MoodInferenceResult } from "@/integrations/baml_client/types";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import type { Database } from "@/shared/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type JournalEntryRow =
  Database["public"]["Tables"]["journal_entries"]["Row"];

type PromptResponseRow =
  Database["public"]["Tables"]["prompt_responses"]["Row"] & {
    prompt: Database["public"]["Tables"]["journal_prompts"]["Row"] | null;
  };

interface EntryWithRelations extends JournalEntryRow {
  prompt_responses: PromptResponseRow[] | null;
  users: Pick<Database["public"]["Tables"]["users"]["Row"], "clerk_id" | "email">;
}

interface InferenceSummary {
  date: string;
  totalCandidates: number;
  updated: number;
  skippedExisting: number;
  skippedEmpty: number;
  failures: Array<{ entryId: string; reason: string }>;
  results: Array<{
    entryId: string;
    mood: string;
    confidence: MoodInferenceResult["confidence"];
  }>;
}

export class MoodInferenceService {
  private static readonly ALLOWED_MOODS = new Set([
    "positive",
    "neutral",
    "negative",
    "thoughtful",
    "grateful",
    "anxious",
    "excited",
    "sad",
    "angry",
    "peaceful",
  ]);

  static async runForDate(
    date: string,
    options?: { supabase?: SupabaseClient<Database> }
  ): Promise<InferenceSummary> {
    const supabase = options?.supabase ?? (await createServiceRoleClient());

    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select(
        `
          *,
          users!inner(clerk_id, email),
          prompt_responses (
            *,
            prompt:journal_prompts (id, prompt_text, category)
          )
        `
      )
      .eq("entry_date", date)
      .is("mood", null)
      .returns<EntryWithRelations[]>();

    if (error) {
      throw new Error(`Failed to fetch journal entries for ${date}: ${error.message}`);
    }

    const summary: InferenceSummary = {
      date,
      totalCandidates: entries?.length ?? 0,
      updated: 0,
      skippedExisting: 0,
      skippedEmpty: 0,
      failures: [],
      results: [],
    };

    if (!entries || entries.length === 0) {
      return summary;
    }

    for (const entry of entries) {
      if (entry.mood) {
        summary.skippedExisting += 1;
        continue;
      }

      if (!this.hasMeaningfulContent(entry)) {
        summary.skippedEmpty += 1;
        continue;
      }

      try {
        const context = this.toJournalEntryContext(entry);
        const result = await b.InferJournalMood(context);

        if (!result?.mood) {
          summary.failures.push({
            entryId: entry.id,
            reason: "Model did not return a mood",
          });
          continue;
        }

        const normalizedMood = result.mood.toLowerCase();

        if (!this.ALLOWED_MOODS.has(normalizedMood)) {
          summary.failures.push({
            entryId: entry.id,
            reason: `Invalid mood returned: ${result?.mood ?? "undefined"}`,
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from("journal_entries")
          .update({ mood: normalizedMood })
          .eq("id", entry.id);

        if (updateError) {
          summary.failures.push({
            entryId: entry.id,
            reason: `Failed to persist mood: ${updateError.message}`,
          });
          continue;
        }

        summary.updated += 1;
        summary.results.push({
          entryId: entry.id,
          mood: normalizedMood,
          confidence: result.confidence,
        });
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "Unknown error during inference";
        summary.failures.push({ entryId: entry.id, reason });
        console.error(
          `[MoodInference] Failed to infer mood for entry ${entry.id}:`,
          err
        );
      }
    }

    return summary;
  }

  private static hasMeaningfulContent(entry: EntryWithRelations): boolean {
    const freeform = entry.freeform_text?.trim() ?? "";

    const promptResponses =
      entry.prompt_responses?.map((response) => response.response_text?.trim() ?? "") ??
      [];

    const combined = [freeform, ...promptResponses].join(" ").trim();
    return combined.length > 0;
  }

  private static toJournalEntryContext(entry: EntryWithRelations) {
    const today = new Date();
    const entryDate = new Date(entry.entry_date);
    return {
      type: "JournalEntryContext" as const,
      entryDate: entry.entry_date,
      freeformText: entry.freeform_text ?? null,
      mood: entry.mood ?? null,
      wordCount: entry.word_count ?? 0,
      promptResponses:
        entry.prompt_responses?.map((response) => ({
          promptText: response.prompt?.prompt_text ?? "",
          responseText: response.response_text ?? "",
          category: response.prompt?.category ?? "",
        })) ?? [],
      daysAgo: differenceInDays(today, entryDate),
    };
  }
}
