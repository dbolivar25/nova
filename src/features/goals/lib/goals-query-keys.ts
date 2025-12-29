export const goalsQueryKeys = {
  all: ["goals"] as const,
  lists: () => [...goalsQueryKeys.all, "list"] as const,
  list: () => [...goalsQueryKeys.lists()] as const,
  completions: () => [...goalsQueryKeys.all, "completions"] as const,
  completionRange: (startDate: string, endDate: string) =>
    [...goalsQueryKeys.completions(), startDate, endDate] as const,
  stats: () => [...goalsQueryKeys.all, "stats"] as const,
};
