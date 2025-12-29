"use client";

import { Label } from "@/components/shared/ui/label";
import { Checkbox } from "@/components/shared/ui/checkbox";
import type { QuestionProps } from "../../types/survey";

export function CheckboxQuestion({ question, value, onChange, error }: QuestionProps<boolean>) {
  const isChecked = typeof value === "boolean" ? value : false;

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          id={question.id}
          checked={isChecked}
          onCheckedChange={(checked) => onChange(checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor={question.id} className="cursor-pointer">
            {question.question_text}
          </Label>
          {question.help_text && (
            <p className="text-sm text-muted-foreground">{question.help_text}</p>
          )}
        </div>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
