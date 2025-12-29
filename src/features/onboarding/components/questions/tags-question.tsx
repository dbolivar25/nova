"use client";

import { Label } from "@/components/shared/ui/label";
import { TagInput } from "@/components/shared/ui/tag-input";
import type { QuestionProps, TagsMetadata } from "../../types/survey";

export function TagsQuestion({ question, value, onChange, error }: QuestionProps<string[]>) {
  const metadata = question.metadata as TagsMetadata;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
      </div>
      <TagInput
        value={(value as string[]) || []}
        onChange={onChange}
        placeholder={question.placeholder || "Type and press Enter..."}
        suggestions={metadata?.suggestions || []}
        maxTags={metadata?.maxItems}
        error={error}
      />
    </div>
  );
}
