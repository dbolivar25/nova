export const journalEntriesKey = (params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}) => [
  "journal",
  "entries",
  params?.limit ?? null,
  params?.offset ?? null,
  params?.startDate ?? null,
  params?.endDate ?? null,
] as const;

export const journalEntryKey = (id: string) => ["journal", "entry", id] as const;

export const journalEntryByDateKey = (date: string) => [
  "journal",
  "entry-by-date",
  date,
] as const;

export const journalPromptsKey = ["journal", "prompts", "today"] as const;

export const journalStatsKey = ["journal", "stats"] as const;

export const journalInsightsKey = ["journal", "insights"] as const;

export const journalSearchKey = (params: {
  search?: string;
  mood?: string;
  onThisDay?: boolean;
  limit: number;
}) => [
  "journal",
  "search",
  params.search ?? "",
  params.mood ?? "",
  Boolean(params.onThisDay),
  params.limit,
] as const;
