"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/shared/lib/api/client";
import { surveyQueryKeys } from "../lib/survey-query-keys";
import type { SubmissionWithResponses, ResponseValue } from "../types/survey";

interface SubmissionResponse {
  submission: SubmissionWithResponses | null;
}

export function useSurveySubmission(surveySlug: string) {
  const queryClient = useQueryClient();
  const queryKey = surveyQueryKeys.submission(surveySlug);

  // Fetch current submission with responses
  const submissionQuery = useQuery<SubmissionResponse>({
    queryKey,
    queryFn: () => fetcher(`/api/surveys/${surveySlug}/submissions`),
    staleTime: 30 * 1000, // 30 seconds (user is actively editing)
  });

  // Start new submission
  const startSubmissionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/surveys/${surveySlug}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start submission");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
      console.error("Error starting submission:", error);
      toast.error("Failed to start survey");
    },
  });

  // Save responses mutation
  const saveResponsesMutation = useMutation({
    mutationFn: async (responses: Record<string, ResponseValue>) => {
      const submissionId = submissionQuery.data?.submission?.id;
      if (!submissionId) {
        throw new Error("No active submission");
      }

      const response = await fetch("/api/user/survey-responses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          responses,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save responses");
      }

      return response.json();
    },
    onError: (error) => {
      console.error("Error saving responses:", error);
      toast.error("Failed to save your progress");
    },
  });

  // Update current step
  const updateStepMutation = useMutation({
    mutationFn: async (step: number) => {
      const response = await fetch(`/api/surveys/${surveySlug}/submissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: step }),
      });

      if (!response.ok) {
        throw new Error("Failed to update step");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, (old: SubmissionResponse | undefined) => ({
        submission: old?.submission ? { ...old.submission, current_step: data.submission.current_step } : null,
      }));
    },
  });

  // Complete submission
  const completeSubmissionMutation = useMutation({
    mutationFn: async () => {
      const submissionId = submissionQuery.data?.submission?.id;
      if (!submissionId) {
        throw new Error("No active submission");
      }

      const response = await fetch("/api/user/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.onboarding() });
      toast.success("Welcome to Nova! Let's begin your journey.");
    },
    onError: (error) => {
      console.error("Error completing submission:", error);
      toast.error("Failed to complete onboarding");
    },
  });

  return {
    submission: submissionQuery.data?.submission,
    isLoading: submissionQuery.isLoading,
    error: submissionQuery.error,
    startSubmission: startSubmissionMutation.mutateAsync,
    isStarting: startSubmissionMutation.isPending,
    saveResponses: saveResponsesMutation.mutateAsync,
    isSaving: saveResponsesMutation.isPending,
    updateStep: updateStepMutation.mutateAsync,
    completeSubmission: completeSubmissionMutation.mutateAsync,
    isCompleting: completeSubmissionMutation.isPending,
    refetch: submissionQuery.refetch,
  };
}
