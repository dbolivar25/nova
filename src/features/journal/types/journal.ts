import { Tables, Enums } from "@/shared/lib/supabase/types";

export type JournalEntry = Tables<"journal_entries"> & {
  prompt_responses?: PromptResponse[];
};

export type JournalPrompt = Tables<"journal_prompts">;
export type PromptResponse = Tables<"prompt_responses"> & {
  prompt?: JournalPrompt;
};

export type Mood = Enums<"mood_type">;

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageWordCount: number;
  totalWordCount: number;
  moodDistribution: Record<Mood, number>;
  streakStartDate?: string;
  lastEntryDate?: string;
  streakHistory?: { date: string; hasEntry: boolean }[];
  milestones?: { days: number; achieved: boolean; achievedDate?: string }[];
}

export interface JournalInsights {
  mostProductiveDay: string;
  favoriteWritingTime: string;
  commonThemes: string[];
  growthAreas: string[];
}

export interface CreateJournalEntryInput {
  entryDate: string;
  freeformText?: string;
  mood?: Mood;
  promptResponses?: {
    promptId: string;
    responseText: string;
  }[];
}

export interface UpdateJournalEntryInput {
  freeformText?: string;
  mood?: Mood;
  promptResponses?: {
    promptId: string;
    responseText: string;
  }[];
}

export interface BookmarkedEntry {
  id: string;
  entry_date: string;
  mood?: Mood | null;
  word_count?: number | null;
  bookmarkedAt: string;
}