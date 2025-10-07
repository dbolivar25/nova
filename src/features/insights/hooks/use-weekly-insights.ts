import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WeeklyInsights } from "@/integrations/baml_client/types";

export const weeklyInsightsQueryKey = ["insights", "latest"] as const;

async function fetchLatestInsights(): Promise<WeeklyInsights | null> {
  const response = await fetch("/api/insights/latest");

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }

  const data = await response.json();
  return data.insights ?? null;
}

async function postGenerateInsights({ force }: { force?: boolean } = {}): Promise<WeeklyInsights> {
  const response = await fetch("/api/insights/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ force: force ?? true }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to generate insights");
  }

  const data = await response.json();
  return data.insights as WeeklyInsights;
}

export function useWeeklyInsights() {
  return useQuery({
    queryKey: weeklyInsightsQueryKey,
    queryFn: fetchLatestInsights,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

export function useGenerateWeeklyInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postGenerateInsights,
    onSuccess: (insights) => {
      queryClient.setQueryData(weeklyInsightsQueryKey, insights);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: weeklyInsightsQueryKey });
    },
  });
}
