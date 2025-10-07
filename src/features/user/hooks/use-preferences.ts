import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/shared/lib/api/client";

export interface UserPreferences {
  daily_reminder_enabled: boolean;
  reminder_time: string;
  prompt_count: number;
}

export function useUserPreferences() {
  const queryClient = useQueryClient();
  const queryKey = ["user", "preferences"] as const;

  const preferencesQuery = useQuery<{ preferences: UserPreferences }>({
    queryKey,
    queryFn: () => fetcher("/api/user/preferences"),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const result = await response.json();
      return result.preferences as UserPreferences;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ preferences: UserPreferences }>(queryKey);

      if (previous) {
        queryClient.setQueryData<{ preferences: UserPreferences }>(queryKey, {
          preferences: {
            ...previous.preferences,
            ...updates,
          },
        });
      }

      return { previous };
    },
    onError: (error, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKey, { preferences });
      toast.success("Preferences updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updatePreferences = (updates: Partial<UserPreferences>) => mutation.mutateAsync(updates);

  return {
    preferences: preferencesQuery.data?.preferences,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    updatePreferences,
    refetch: preferencesQuery.refetch,
    isUpdating: mutation.isPending,
  };
}
