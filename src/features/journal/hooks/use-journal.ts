import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { format } from "date-fns";
import { handleAPIError } from "@/shared/lib/api/client";
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

// Hook to fetch all journal entries
export function useJournalEntries(
  limit?: number, 
  offset?: number,
  startDate?: string,
  endDate?: string
) {
  const key = [`/journal/entries`, limit, offset, startDate, endDate];
  
  return useSWR(key, () => getJournalEntries(limit, offset, startDate, endDate), {
    onError: handleAPIError,
  });
}

// Hook to fetch a single journal entry
export function useJournalEntry(id: string | null) {
  return useSWR(
    id ? `/journal/entries/${id}` : null,
    () => getJournalEntry(id!),
    {
      onError: handleAPIError,
    }
  );
}

// Hook to fetch journal entry by date
export function useJournalEntryByDate(date: Date | string) {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  
  return useSWR(
    `/journal/entries/date/${dateStr}`,
    () => getJournalEntryByDate(dateStr),
    {
      onError: handleAPIError,
    }
  );
}

// Hook to fetch today's prompts
export function useTodaysPrompts() {
  return useSWR<JournalPrompt[]>("/journal/prompts/today", getTodaysPrompts, {
    onError: handleAPIError,
  });
}

// Hook to fetch journal stats
export function useJournalStats() {
  return useSWR<JournalStats>("/journal/stats", getJournalStats, {
    onError: handleAPIError,
  });
}

// Hook to fetch journal insights
export function useJournalInsights() {
  return useSWR<JournalInsights>("/journal/insights", getJournalInsights, {
    onError: handleAPIError,
  });
}

// Hook to create a journal entry
export function useCreateJournalEntry() {
  return useSWRMutation(
    "/journal/entries",
    async (_key: string, { arg }: { arg: CreateJournalEntryInput }) => {
      const entry = await createJournalEntry(arg);
      
      // Invalidate related caches
      mutate((key) => Array.isArray(key) && key[0] === "/journal/entries");
      mutate(`/journal/entries/date/${arg.entryDate}`);
      mutate("/journal/stats");
      
      return entry;
    },
    {
      onError: handleAPIError,
    }
  );
}

// Hook to update a journal entry by date
export function useUpdateJournalEntry(date: string) {
  return useSWRMutation(
    `/journal/entries/date/${date}`,
    async (_key: string, { arg }: { arg: UpdateJournalEntryInput }) => {
      const entry = await updateJournalEntry(date, arg);
      
      // Invalidate related caches
      mutate((key) => Array.isArray(key) && key[0] === "/journal/entries");
      mutate(`/journal/entries/date/${date}`);
      mutate("/journal/stats");
      
      return entry;
    },
    {
      onError: handleAPIError,
    }
  );
}

// Hook to delete a journal entry
export function useDeleteJournalEntry() {
  return useSWRMutation(
    "/journal/entries",
    async (_key: string, { arg: id }: { arg: string }) => {
      await deleteJournalEntry(id);
      
      // Invalidate related caches
      mutate((key) => Array.isArray(key) && key[0] === "/journal/entries");
      mutate(`/journal/entries/${id}`);
      mutate("/journal/stats");
    },
    {
      onError: handleAPIError,
    }
  );
}

// Helper hook to get or create today's entry
export function useTodaysJournalEntry() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: entry, error, isLoading } = useJournalEntryByDate(today);
  const { trigger: createEntry, isMutating: isCreating } = useCreateJournalEntry();
  
  const getOrCreateEntry = async () => {
    if (entry) return entry;
    
    return createEntry({
      entryDate: today,
      freeformText: "",
      promptResponses: [],
    });
  };
  
  return {
    entry,
    error,
    isLoading: isLoading || isCreating,
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
  const searchKey = [
    '/journal/search',
    search,
    mood,
    onThisDay,
    limit
  ];
  
  return useSWR(
    searchKey,
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (mood && mood !== 'all') params.append('mood', mood);
      if (onThisDay) params.append('onThisDay', 'true');
      params.append('limit', String(limit));
      
      const response = await fetch(`/api/journal/entries?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search');
      return response.json();
    },
    {
      onError: handleAPIError,
      keepPreviousData: true,
    }
  );
}