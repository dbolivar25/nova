"use client";

import { Label } from "@/components/shared/ui/label";
import { Checkbox } from "@/components/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { QuestionProps, MultiselectMetadata } from "../../types/survey";

export function MultiselectQuestion({ question, value, onChange, error }: QuestionProps<string[]>) {
  const metadata = question.metadata as MultiselectMetadata;
  const selectedValues = (value as string[]) || [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
      </div>
      <div className="space-y-2">
        {metadata?.options?.map((option) => {
          const isChecked = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                isChecked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
