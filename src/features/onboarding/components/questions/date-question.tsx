"use client";

import { Label } from "@/components/shared/ui/label";
import { Button } from "@/components/shared/ui/button";
import { Calendar } from "@/components/shared/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shared/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/shared/lib/utils";
import type { QuestionProps } from "../../types/survey";

export function DateQuestion({ question, value, onChange, error }: QuestionProps<string>) {
  const dateValue = typeof value === "string" && value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <Label>{question.question_text}</Label>
      {question.help_text && (
        <p className="text-sm text-muted-foreground">{question.help_text}</p>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
