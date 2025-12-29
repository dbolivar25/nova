"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/shared/lib/api/client";
import { format, subDays, startOfDay } from "date-fns";
import { goalsQueryKeys } from "../lib/goals-query-keys";
import type { GoalCompletion, ToggleCompletionRequest } from "../types/goals";

interface CompletionsResponse {
  completions: GoalCompletion[];
}

interface CompletionResponse {
  completion: GoalCompletion;
}

export function useGoalCompletions(days: number = 7) {
  const queryClient = useQueryClient();
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const startDate = format(subDays(startOfDay(new Date()), days - 1), "yyyy-MM-dd");
  const queryKey = goalsQueryKeys.completionRange(startDate, today);

  const completionsQuery = useQuery<CompletionsResponse>({
    queryKey,
    queryFn: () =>
      fetcher(`/api/user/daily-goals/completions?start_date=${startDate}&end_date=${today}`),
    staleTime: 30 * 1000,
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async (data: ToggleCompletionRequest) => {
      const response = await fetch("/api/user/daily-goals/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to toggle completion");
      return response.json() as Promise<CompletionResponse>;
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previous = queryClient.getQueryData<CompletionsResponse>(queryKey);

      // Optimistically update
      queryClient.setQueryData<CompletionsResponse>(queryKey, (old) => {
        const completions = old?.completions || [];
        const existingIndex = completions.findIndex(
          (c) => c.goal_id === data.goal_id && c.completion_date === data.date
        );

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...completions];
          updated[existingIndex] = {
            ...updated[existingIndex],
            completed: data.completed,
          };
          return { completions: updated };
        } else {
          // Add new
          return {
            completions: [
              ...completions,
              {
                id: "temp-" + Date.now(),
                goal_id: data.goal_id,
                completion_date: data.date,
                completed: data.completed,
                notes: data.notes || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };
        }
      });

      return { previous };
    },
    onError: (error, _data, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Failed to update completion");
    },
    onSettled: () => {
      // Refetch stats too
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.stats() });
    },
  });

  // Helper to check if a goal is completed on a specific date
  const isCompleted = (goalId: string, date: string): boolean => {
    const completion = completionsQuery.data?.completions.find(
      (c) => c.goal_id === goalId && c.completion_date === date
    );
    return completion?.completed || false;
  };

  // Helper to get completions for a specific goal
  const getGoalCompletions = (goalId: string): GoalCompletion[] => {
    return (completionsQuery.data?.completions || []).filter(
      (c) => c.goal_id === goalId
    );
  };

  return {
    completions: completionsQuery.data?.completions || [],
    isLoading: completionsQuery.isLoading,
    error: completionsQuery.error,
    toggleCompletion: toggleCompletionMutation.mutateAsync,
    isToggling: toggleCompletionMutation.isPending,
    isCompleted,
    getGoalCompletions,
    refetch: completionsQuery.refetch,
  };
}
