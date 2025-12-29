"use client";

import { Label } from "@/components/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import type { QuestionProps, SelectMetadata } from "../../types/survey";

export function SelectQuestion({ question, value, onChange, error }: QuestionProps<{ value: string }>) {
  const metadata = question.metadata as SelectMetadata;
  const currentValue = typeof value === "object" && value !== null ? (value as { value: string }).value : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>{question.question_text}</Label>
      {question.help_text && (
        <p className="text-sm text-muted-foreground">{question.help_text}</p>
      )}
      <Select
        value={currentValue}
        onValueChange={(val) => onChange({ value: val })}
      >
        <SelectTrigger id={question.id} aria-invalid={!!error}>
          <SelectValue placeholder={question.placeholder || "Select an option..."} />
        </SelectTrigger>
        <SelectContent>
          {metadata?.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
