"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/shared/lib/api/client";
import { goalsQueryKeys } from "../lib/goals-query-keys";
import type { DailyGoal, CreateGoalRequest, UpdateGoalRequest } from "../types/goals";

interface GoalsResponse {
  goals: DailyGoal[];
}

interface GoalResponse {
  goal: DailyGoal;
}

export function useDailyGoals() {
  const queryClient = useQueryClient();
  const queryKey = goalsQueryKeys.list();

  const goalsQuery = useQuery<GoalsResponse>({
    queryKey,
    queryFn: () => fetcher("/api/user/daily-goals"),
    staleTime: 30 * 1000,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: CreateGoalRequest) => {
      const response = await fetch("/api/user/daily-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create goal");
      return response.json() as Promise<GoalResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<GoalsResponse>(queryKey, (old) => ({
        goals: [...(old?.goals || []), data.goal],
      }));
      toast.success("Goal created!");
    },
    onError: () => {
      toast.error("Failed to create goal");
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: UpdateGoalRequest }) => {
      const response = await fetch(`/api/user/daily-goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      return response.json() as Promise<GoalResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<GoalsResponse>(queryKey, (old) => ({
        goals: (old?.goals || []).map((g) => (g.id === data.goal.id ? data.goal : g)),
      }));
      toast.success("Goal updated!");
    },
    onError: () => {
      toast.error("Failed to update goal");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/user/daily-goals/${goalId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      return goalId;
    },
    onSuccess: (goalId) => {
      queryClient.setQueryData<GoalsResponse>(queryKey, (old) => ({
        goals: (old?.goals || []).filter((g) => g.id !== goalId),
      }));
      toast.success("Goal removed");
    },
    onError: () => {
      toast.error("Failed to delete goal");
    },
  });

  return {
    goals: goalsQuery.data?.goals || [],
    isLoading: goalsQuery.isLoading,
    error: goalsQuery.error,
    createGoal: createGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,
    updateGoal: updateGoalMutation.mutateAsync,
    isUpdating: updateGoalMutation.isPending,
    deleteGoal: deleteGoalMutation.mutateAsync,
    isDeleting: deleteGoalMutation.isPending,
    refetch: goalsQuery.refetch,
  };
}
