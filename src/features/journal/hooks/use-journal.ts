import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getJournalEntries,
  getJournalEntry,
  getJournalEntryByDate,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getTodaysPrompts,
  getJournalStats,
  getJournalInsights,
} from "@/features/journal/api/journal";
import type {
  JournalPrompt,
  JournalStats,
  JournalInsights,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@/features/journal/types/journal";
import {
  journalEntriesKey,
  journalEntryByDateKey,
  journalEntryKey,
  journalInsightsKey,
  journalPromptsKey,
  journalSearchKey,
  journalStatsKey,
} from "@/features/journal/hooks/journal-query-keys";

// Hook to fetch all journal entries
export function useJournalEntries(
  limit?: number, 
  offset?: number,
  startDate?: string,
  endDate?: string
) {
  const queryKey = journalEntriesKey({ limit, offset, startDate, endDate });

  return useQuery({
    queryKey,
    queryFn: () => getJournalEntries(limit, offset, startDate, endDate),
    placeholderData: (previous) => previous,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to fetch a single journal entry
export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: journalEntryKey(id ?? '__noop__'),
    queryFn: () => getJournalEntry(id!),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to fetch journal entry by date
export function useJournalEntryByDate(date: Date | string) {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");

  return useQuery({
    queryKey: journalEntryByDateKey(dateStr),
    queryFn: () => getJournalEntryByDate(dateStr),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to fetch today's prompts
export function useTodaysPrompts() {
  return useQuery<JournalPrompt[]>({
    queryKey: journalPromptsKey,
    queryFn: getTodaysPrompts,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to fetch journal stats
export function useJournalStats() {
  return useQuery<JournalStats>({
    queryKey: journalStatsKey,
    queryFn: getJournalStats,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to fetch journal insights
export function useJournalInsights() {
  return useQuery<JournalInsights>({
    queryKey: journalInsightsKey,
    queryFn: getJournalInsights,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to create a journal entry
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJournalEntryInput) => createJournalEntry(input),
    onSuccess: (entry, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] });
      if (variables.entryDate) {
        queryClient.setQueryData(journalEntryByDateKey(variables.entryDate), entry);
      }
      queryClient.invalidateQueries({ queryKey: journalStatsKey });
      queryClient.invalidateQueries({ queryKey: journalInsightsKey });
    },
  });
}

// Hook to update a journal entry by date
export function useUpdateJournalEntry(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJournalEntryInput) => updateJournalEntry(date, input),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] });
      queryClient.setQueryData(journalEntryByDateKey(date), entry);
      queryClient.invalidateQueries({ queryKey: journalStatsKey });
      queryClient.invalidateQueries({ queryKey: journalInsightsKey });
    },
  });
}

// Hook to delete a journal entry
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] });
      queryClient.removeQueries({ queryKey: journalEntryKey(id) });
      queryClient.invalidateQueries({ queryKey: journalStatsKey });
      queryClient.invalidateQueries({ queryKey: journalInsightsKey });
    },
  });
}

// Helper hook to get or create today's entry
export function useTodaysJournalEntry() {
  const today = format(new Date(), "yyyy-MM-dd");
  const queryClient = useQueryClient();
  const { data: entry, error, isLoading } = useJournalEntryByDate(today);
  const createEntryMutation = useCreateJournalEntry();
  
  const getOrCreateEntry = async () => {
    if (entry) return entry;

    const newEntry = await createEntryMutation.mutateAsync({
      entryDate: today,
      freeformText: "",
      promptResponses: [],
    });

    queryClient.setQueryData(journalEntryByDateKey(today), newEntry);
    return newEntry;
  };
  
  return {
    entry,
    error,
    isLoading: isLoading || createEntryMutation.isPending,
    getOrCreateEntry,
  };
}

// Hook to search journal entries
export function useJournalSearch(
  search?: string,
  mood?: string,
  onThisDay?: boolean,
  limit: number = 50
) {
  const queryKey = journalSearchKey({ search, mood, onThisDay, limit });

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (mood && mood !== 'all') params.append('mood', mood);
      if (onThisDay) params.append('onThisDay', 'true');
      params.append('limit', String(limit));

      const response = await fetch(`/api/journal/entries?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search');
      return response.json();
    },
    enabled: Boolean(search || mood || onThisDay),
    placeholderData: (previous) => previous,
  });
}

// Hook to fetch "On This Day" entries
export function useOnThisDayEntries(limit = 5) {
  return useJournalSearch(undefined, undefined, true, limit);
}
