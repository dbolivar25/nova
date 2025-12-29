"use client";

import { cn } from "@/shared/lib/utils";
import { Progress } from "@/components/shared/ui/progress";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface SurveyStepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export function SurveyStepper({
  currentStep,
  totalSteps,
  stepTitles = [],
}: SurveyStepperProps) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "hsl(var(--primary))"
                    : isCurrent
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted && "text-primary-foreground",
                  isCurrent && "text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                  isUpcoming && "text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </motion.div>
              
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1 transition-colors",
                    stepNumber < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step title */}
      {stepTitles[currentStep - 1] && (
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground"
        >
          {stepTitles[currentStep - 1]}
        </motion.p>
      )}
    </div>
  );
}
