"use client";

import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import type { QuestionProps } from "../../types/survey";

export function TextQuestion({ question, value, onChange, error }: QuestionProps<string>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>{question.question_text}</Label>
      {question.help_text && (
        <p className="text-sm text-muted-foreground">{question.help_text}</p>
      )}
      <Input
        id={question.id}
        type="text"
        placeholder={question.placeholder || ""}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
