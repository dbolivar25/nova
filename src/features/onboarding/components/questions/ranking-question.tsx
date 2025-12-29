"use client";

import { Label } from "@/components/shared/ui/label";
import { SortableList, type SortableItem } from "@/components/shared/ui/sortable-list";
import type { QuestionProps, RankingMetadata } from "../../types/survey";

export function RankingQuestion({ question, value, onChange, error }: QuestionProps<string[]>) {
  const metadata = question.metadata as RankingMetadata;
  
  // Get ordered items based on current value or default order
  const orderedIds = (value as string[]) || metadata?.items?.map((item) => item.id) || [];
  
  const items: SortableItem[] = orderedIds
    .map((id) => {
      const item = metadata?.items?.find((i) => i.id === id);
      return item ? { id: item.id, label: item.label } : null;
    })
    .filter((item): item is SortableItem => item !== null);

  const handleChange = (newItems: SortableItem[]) => {
    onChange(newItems.map((item) => item.id));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
        <p className="text-xs text-muted-foreground">Drag to reorder by priority</p>
      </div>
      <SortableList items={items} onChange={handleChange} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
