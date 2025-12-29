"use client";

import { Label } from "@/components/shared/ui/label";
import { Textarea } from "@/components/shared/ui/textarea";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Calendar, CalendarDays, CalendarRange, Infinity } from "lucide-react";
import type { QuestionProps, GoalsTimeframeMetadata, GoalsTimeframeValue } from "../../types/survey";

const timeframeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  week: Calendar,
  month: CalendarDays,
  year: CalendarRange,
  lifetime: Infinity,
};

export function GoalsTimeframeQuestion({ question, value, onChange, error }: QuestionProps<GoalsTimeframeValue>) {
  const metadata = question.metadata as GoalsTimeframeMetadata;
  const currentValue = (value as GoalsTimeframeValue) || {
    week: "",
    month: "",
    year: "",
    lifetime: "",
  };

  const handleChange = (key: string, text: string) => {
    onChange({
      ...currentValue,
      [key]: text,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
      </div>

      <div className="grid gap-4">
        {metadata?.timeframes?.map((timeframe) => {
          const Icon = timeframeIcons[timeframe.key] || Calendar;
          const tfValue = currentValue[timeframe.key as keyof GoalsTimeframeValue] || "";

          return (
            <Card key={timeframe.key} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">{timeframe.label}</Label>
                    <Textarea
                      placeholder={timeframe.placeholder}
                      value={tfValue}
                      onChange={(e) => handleChange(timeframe.key, e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
