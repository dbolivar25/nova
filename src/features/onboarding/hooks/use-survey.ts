"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/shared/lib/api/client";
import { surveyQueryKeys } from "../lib/survey-query-keys";
import type { SurveyWithQuestions } from "../types/survey";

interface SurveyResponse {
  survey: SurveyWithQuestions;
}

export function useSurvey(slug: string) {
  const query = useQuery<SurveyResponse>({
    queryKey: surveyQueryKeys.detail(slug),
    queryFn: () => fetcher(`/api/surveys/${slug}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    survey: query.data?.survey,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
