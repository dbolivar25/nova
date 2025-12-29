"use client";

import * as React from "react";
import { Label } from "@/components/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import type { QuestionProps, ScaleMetadata } from "../../types/survey";

export function ScaleQuestion({ question, value, onChange, error }: QuestionProps<number>) {
  const metadata = question.metadata as ScaleMetadata;
  const min = metadata?.min ?? 1;
  const max = metadata?.max ?? 10;
  const step = metadata?.step ?? 1;
  const currentValue = typeof value === "number" ? value : undefined;

  // Generate step values
  const steps = React.useMemo(() => {
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  }, [min, max, step]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
      </div>
      
      {/* Scale labels */}
      {metadata?.labels && (
        <div className="flex justify-between text-sm text-muted-foreground px-1">
          <span>{metadata.labels.min}</span>
          <span>{metadata.labels.max}</span>
        </div>
      )}

      {/* Step buttons */}
      <div className="flex justify-between gap-2">
        {steps.map((stepValue) => {
          const isSelected = currentValue === stepValue;
          return (
            <button
              key={stepValue}
              type="button"
              onClick={() => onChange(stepValue)}
              className={cn(
                "flex-1 py-3 px-2 rounded-lg border-2 font-semibold text-lg transition-all",
                "hover:border-primary/60 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground"
              )}
            >
              {stepValue}
            </button>
          );
        })}
      </div>

      {/* Current selection indicator */}
      {currentValue !== undefined && (
        <p className="text-center text-sm text-muted-foreground">
          You selected <span className="font-semibold text-foreground">{currentValue}</span>
        </p>
      )}
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
