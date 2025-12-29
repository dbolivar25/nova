"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useSurvey } from "../hooks/use-survey";
import { useSurveySubmission } from "../hooks/use-survey-submission";
import { SurveyStepper } from "./survey-stepper";
import { QuestionRenderer } from "./question-renderer";
import type { ResponseValue, SurveyQuestion } from "../types/survey";

interface SurveyContainerProps {
  surveySlug: string;
}

export function SurveyContainer({ surveySlug }: SurveyContainerProps) {
  const router = useRouter();
  const { survey, isLoading: surveyLoading } = useSurvey(surveySlug);
  const {
    submission,
    isLoading: submissionLoading,
    startSubmission,
    isStarting,
    saveResponses,
    isSaving,
    updateStep,
    completeSubmission,
    isCompleting,
  } = useSurveySubmission(surveySlug);

  const [isSkipping, setIsSkipping] = React.useState(false);

  // Local state for responses (optimistic)
  const [responses, setResponses] = React.useState<Record<string, ResponseValue>>({});
  const [currentStep, setCurrentStep] = React.useState(1);
  const [lastSubmissionId, setLastSubmissionId] = React.useState<string | null>(null);

  // Sync from server on load or when submission changes (e.g., after reset)
  React.useEffect(() => {
    if (submission && submission.id !== lastSubmissionId) {
      setResponses(submission.responses);
      setCurrentStep(submission.current_step);
      setLastSubmissionId(submission.id);
    }
  }, [submission, lastSubmissionId]);

  // Start submission if none exists
  React.useEffect(() => {
    if (!submissionLoading && !submission && !isStarting && survey) {
      startSubmission();
    }
  }, [submissionLoading, submission, isStarting, startSubmission, survey]);

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback(
    (newResponses: Record<string, ResponseValue>) => {
      if (submission) {
        saveResponses(newResponses);
      }
    },
    1500 // 1.5 second debounce
  );

  // Handle response change
  const handleResponseChange = React.useCallback(
    (questionId: string, value: ResponseValue) => {
      setResponses((prev) => {
        const updated = { ...prev, [questionId]: value };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave]
  );

  // Calculate step data
  const questions = React.useMemo(() => survey?.questions || [], [survey?.questions]);
  const totalSteps = Math.max(...questions.map((q) => q.step_number), 1);
  const currentQuestions = questions.filter((q) => q.step_number === currentStep);

  // Step titles derived from questions
  const stepTitles = React.useMemo(() => {
    const titles: string[] = [];
    for (let i = 1; i <= totalSteps; i++) {
      const stepQuestions = questions.filter((q) => q.step_number === i);
      if (stepQuestions.length > 0) {
        // Use first question's text truncated as title
        const firstQ = stepQuestions[0];
        titles.push(firstQ.question_text.length > 50 
          ? firstQ.question_text.slice(0, 50) + "..." 
          : firstQ.question_text
        );
      }
    }
    return titles;
  }, [questions, totalSteps]);

  // Validation
  const validateCurrentStep = (): boolean => {
    for (const question of currentQuestions) {
      if (question.is_required) {
        const value = responses[question.id];
        if (!value) return false;
        
        // Type-specific validation
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === "string" && !value.trim()) return false;
        if (typeof value === "object" && !Array.isArray(value)) {
          // Check for goals_timeframe or daily_goals
          if ("goals" in value && (value as { goals: unknown[] }).goals.length === 0) {
            // Daily goals - at least one goal required
            return false;
          }
        }
      }
    }
    return true;
  };

  const canProceed = validateCurrentStep();

  // Navigation
  const handleNext = async () => {
    // Save current responses before proceeding
    await saveResponses(responses);

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateStep(nextStep);
    } else {
      // Complete survey
      await completeSubmission();
      router.push("/dashboard");
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      // Save current responses before going back
      await saveResponses(responses);
      
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      await updateStep(prevStep);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const response = await fetch("/api/user/onboarding/skip", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to skip onboarding");
      }

      toast.info("You can complete your profile anytime from Settings", {
        duration: 5000,
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSkipping(false);
    }
  };

  // Loading state
  if (surveyLoading || submissionLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!survey) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Survey not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold font-serif">{survey.title}</h1>
          {survey.description && (
            <p className="text-muted-foreground">{survey.description}</p>
          )}
        </div>
        <SurveyStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepTitles={stepTitles}
        />
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {currentQuestions.map((question: SurveyQuestion) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={responses[question.id]}
                onChange={(value) => handleResponseChange(question.id, value)}
                submissionId={submission?.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Auto-save indicator */}
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </motion.div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isCompleting || isSkipping}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isCompleting || isSkipping}
            className="text-muted-foreground"
          >
            {isSkipping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Skip for now
                <SkipForward className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed || isCompleting || isSkipping}
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : currentStep === totalSteps ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
