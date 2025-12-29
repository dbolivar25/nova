"use client";

import * as React from "react";
import { format, subDays, startOfDay } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Checkbox } from "@/components/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Sparkles, Flame } from "lucide-react";
import { motion } from "framer-motion";
import type { DailyGoal, GoalCompletion, GoalType } from "../types/goals";

interface GoalCardProps {
  goal: DailyGoal;
  completions: GoalCompletion[];
  currentStreak: number;
  onToggleToday: (completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggling?: boolean;
}

const goalTypeColors: Record<GoalType, string> = {
  add: "bg-emerald-500",
  remove: "bg-red-500",
  minimize: "bg-amber-500",
};

export function GoalCard({
  goal,
  completions,
  currentStreak,
  onToggleToday,
  onEdit,
  onDelete,
  isToggling,
}: GoalCardProps) {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  
  // Get last 7 days
  const last7Days = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(startOfDay(new Date()), i), "yyyy-MM-dd");
      const dayName = format(subDays(startOfDay(new Date()), i), "EEE");
      const isToday = date === today;
      const completion = completions.find((c) => c.completion_date === date);
      
      days.push({
        date,
        dayName,
        isToday,
        completed: completion?.completed || false,
      });
    }
    return days;
  }, [completions, today]);

  const todayCompleted = last7Days.find((d) => d.isToday)?.completed || false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      {/* Checkbox for today */}
      <div className="shrink-0">
        <Checkbox
          checked={todayCompleted}
          onCheckedChange={(checked) => onToggleToday(checked === true)}
          disabled={isToggling}
          className="h-5 w-5"
        />
      </div>

      {/* Goal text and meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", todayCompleted && "line-through text-muted-foreground")}>
            {goal.text}
          </span>
          {goal.is_ai_recommended && (
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {goal.category && (
            <Badge variant="secondary" className="text-xs">
              {goal.category}
            </Badge>
          )}
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <Flame className="h-3 w-3" />
              <span>{currentStreak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly dots */}
      <div className="hidden sm:flex items-center gap-1">
        {last7Days.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-0.5"
            title={`${day.dayName}: ${day.completed ? "Completed" : "Not completed"}`}
          >
            <span className="text-[10px] text-muted-foreground">{day.dayName.charAt(0)}</span>
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                day.completed
                  ? goalTypeColors[goal.goal_type]
                  : day.isToday
                  ? "bg-muted ring-1 ring-primary"
                  : "bg-muted"
              )}
            />
          </div>
        ))}
      </div>

      {/* Actions - modal={false} prevents pointer-events conflicts with Dialog */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
