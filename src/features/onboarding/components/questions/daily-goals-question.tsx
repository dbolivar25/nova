"use client";

import * as React from "react";
import { Label } from "@/components/shared/ui/label";
import { Input } from "@/components/shared/ui/input";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { Plus, X, Minus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { 
  QuestionProps, 
  DailyGoalsMetadata, 
  DailyGoalsValue, 
  DailyGoalValue,
  GoalType,
  GoalCategory,
  RecommendedGoal,
} from "../../types/survey";

// Generate a unique ID - fallback for environments without crypto.randomUUID
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: generate a random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const goalTypeIcons: Record<GoalType, React.ComponentType<{ className?: string }>> = {
  add: Plus,
  remove: X,
  minimize: Minus,
};

const goalTypeColors: Record<GoalType, string> = {
  add: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  remove: "bg-red-500/10 text-red-600 border-red-500/20",
  minimize: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

interface DailyGoalsQuestionProps extends QuestionProps<DailyGoalsValue> {
  submissionId?: string;
}

export function DailyGoalsQuestion({ 
  question, 
  value, 
  onChange, 
  error,
  submissionId,
}: DailyGoalsQuestionProps) {
  const metadata = question.metadata as DailyGoalsMetadata;
  const currentValue = (value as DailyGoalsValue) || { goals: [] };
  
  const [newGoalText, setNewGoalText] = React.useState("");
  const [newGoalType, setNewGoalType] = React.useState<GoalType>("add");
  const [newGoalCategory, setNewGoalCategory] = React.useState<GoalCategory | "">("");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<RecommendedGoal[]>([]);

  const addGoal = () => {
    if (!newGoalText.trim()) return;

    const newGoal: DailyGoalValue = {
      id: generateId(),
      text: newGoalText.trim(),
      type: newGoalType,
      category: newGoalCategory || undefined,
    };

    onChange({
      goals: [...currentValue.goals, newGoal],
    });

    setNewGoalText("");
    setNewGoalCategory("");
  };

  const removeGoal = (goalId: string) => {
    onChange({
      goals: currentValue.goals.filter((g) => g.id !== goalId),
    });
  };

  const acceptRecommendation = (recommendation: RecommendedGoal) => {
    const newGoal: DailyGoalValue = {
      id: generateId(),
      text: recommendation.text,
      type: recommendation.type,
      category: recommendation.category,
    };

    onChange({
      goals: [...currentValue.goals, newGoal],
    });

    // Remove from recommendations
    setRecommendations((prev) => prev.filter((r) => r.text !== recommendation.text));
    
    toast.success("Goal added!");
  };

  const dismissRecommendation = (recommendation: RecommendedGoal) => {
    setRecommendations((prev) => prev.filter((r) => r.text !== recommendation.text));
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const response = await fetch("/api/user/goal-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      
      // Show toast with animation
      toast.custom(() => (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: 2, ease: "linear" }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <p className="font-medium">Nova has suggestions for you!</p>
            <p className="text-sm text-muted-foreground">
              {data.recommendations?.length || 0} personalized daily goals
            </p>
          </div>
        </motion.div>
      ), { duration: 4000 });
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      toast.error("Failed to get AI recommendations");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Group goals by type
  const goalsByType = React.useMemo(() => {
    const grouped: Record<GoalType, DailyGoalValue[]> = {
      add: [],
      remove: [],
      minimize: [],
    };
    
    for (const goal of currentValue.goals) {
      grouped[goal.type].push(goal);
    }
    
    return grouped;
  }, [currentValue.goals]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label>{question.question_text}</Label>
        {question.help_text && (
          <p className="text-sm text-muted-foreground">{question.help_text}</p>
        )}
      </div>

      {/* Goal type sections */}
      {metadata?.goalTypes?.map((goalType) => {
        const Icon = goalTypeIcons[goalType.key];
        const goals = goalsByType[goalType.key];

        return (
          <Card key={goalType.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", goalTypeColors[goalType.key])}>
                  <Icon className="h-3 w-3" />
                </div>
                {goalType.label}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{goalType.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <AnimatePresence mode="popLayout">
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg border bg-card p-2"
                  >
                    <span className="flex-1 text-sm">{goal.text}</span>
                    {goal.category && (
                      <Badge variant="secondary" className="text-xs">
                        {goal.category}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {goals.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-2">
                  No goals added yet
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Add new goal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add New Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your daily goal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGoal();
                }
              }}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Select value={newGoalType} onValueChange={(v) => setNewGoalType(v as GoalType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metadata?.goalTypes?.map((gt) => (
                  <SelectItem key={gt.key} value={gt.key}>
                    {gt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newGoalCategory} onValueChange={(v) => setNewGoalCategory(v as GoalCategory)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {metadata?.categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addGoal} disabled={!newGoalText.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {metadata?.enableAiRecommendations && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Let Nova suggest daily goals based on your profile
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 && !isLoadingRecommendations && (
              <Button
                type="button"
                variant="outline"
                onClick={fetchRecommendations}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </Button>
            )}

            {isLoadingRecommendations && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Nova is thinking...
                </span>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-lg border border-primary/20 bg-card p-3"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, delay: index * 0.1 }}
                  />
                  
                  <div className="relative space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", goalTypeColors[rec.type])}>
                            {rec.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {rec.category}
                          </Badge>
                        </div>
                        <p className="mt-1 font-medium">{rec.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => acceptRecommendation(rec)}
                      >
                        Add Goal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissRecommendation(rec)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {recommendations.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchRecommendations}
                disabled={isLoadingRecommendations}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get More Suggestions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
