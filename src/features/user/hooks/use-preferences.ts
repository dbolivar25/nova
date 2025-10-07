import useSWR from "swr";
import { toast } from "sonner";
import { fetcher } from "@/shared/lib/api/client";

export interface UserPreferences {
  daily_reminder_enabled: boolean;
  reminder_time: string;
  prompt_count: number;
}

export function useUserPreferences() {
  const { data, error, isLoading, mutate } = useSWR<{ preferences: UserPreferences }>(
    "/api/user/preferences",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      // Optimistically update the UI
      mutate(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            preferences: {
              ...current.preferences,
              ...updates,
            },
          };
        },
        false
      );

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
      
      // Update with the actual server response
      mutate({ preferences: result.preferences });
      
      toast.success("Preferences updated");
      return result.preferences;
    } catch (error) {
      // Revert on error
      mutate();
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
      throw error;
    }
  };

  return {
    preferences: data?.preferences,
    isLoading,
    error,
    updatePreferences,
    mutate,
  };
}