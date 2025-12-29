"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { Plus, Minus, X, Target, Flame, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Progress } from "@/components/shared/ui/progress";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Badge } from "@/components/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { useDailyGoals } from "@/features/goals/hooks/use-daily-goals";
import { useGoalCompletions } from "@/features/goals/hooks/use-goal-completions";
import { GoalCard } from "@/features/goals/components/goal-card";
import type { DailyGoal, GoalType, GoalCategory } from "@/features/goals/types/goals";

const goalTypeConfig: Record<GoalType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  add: { 
    label: "Habits to Build", 
    icon: Plus, 
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Things you want to start doing daily"
  },
  remove: { 
    label: "Habits to Break", 
    icon: X, 
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    description: "Things you want to stop doing completely"
  },
  minimize: { 
    label: "Habits to Minimize", 
    icon: Minus, 
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Things you want to reduce or limit"
  },
};

const categories: GoalCategory[] = [
  "health", "productivity", "relationships", 
  "mindset", "learning", "finance", "creativity", "other"
];

export default function GoalsPage() {
  const { goals, isLoading: goalsLoading, createGoal, isCreating, updateGoal, isUpdating, deleteGoal, isDeleting } = useDailyGoals();
  const { completions, isLoading: completionsLoading, toggleCompletion, isToggling, isCompleted } = useGoalCompletions(7);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<DailyGoal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = React.useState<string | null>(null);
  const [newGoalText, setNewGoalText] = React.useState("");
  const [newGoalType, setNewGoalType] = React.useState<GoalType>("add");
  const [newGoalCategory, setNewGoalCategory] = React.useState<GoalCategory | "">("");
  
  // Edit form state
  const [editGoalText, setEditGoalText] = React.useState("");
  const [editGoalType, setEditGoalType] = React.useState<GoalType>("add");
  const [editGoalCategory, setEditGoalCategory] = React.useState<GoalCategory | "">("");

  // Sync edit form when editing goal changes
  React.useEffect(() => {
    if (editingGoal) {
      setEditGoalText(editingGoal.text);
      setEditGoalType(editingGoal.goal_type);
      setEditGoalCategory(editingGoal.category || "");
    }
  }, [editingGoal]);

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  // Group goals by type
  const goalsByType = React.useMemo(() => {
    const grouped: Record<GoalType, DailyGoal[]> = { add: [], remove: [], minimize: [] };
    for (const goal of goals) {
      grouped[goal.goal_type].push(goal);
    }
    return grouped;
  }, [goals]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const todayCompletedCount = goals.filter((g) => isCompleted(g.id, today)).length;
    const totalGoals = goals.length;
    const todayProgress = totalGoals > 0 ? (todayCompletedCount / totalGoals) * 100 : 0;

    // Calculate current streak (days with all goals completed)
    // This is a simplified version - the API provides better stats
    const currentStreak = 0;
    
    return {
      todayCompleted: todayCompletedCount,
      todayTotal: totalGoals,
      todayProgress,
      currentStreak,
    };
  }, [goals, isCompleted, today]);

  // Calculate per-goal streaks
  const getGoalStreak = (goalId: string): number => {
    const goalCompletions = completions
      .filter((c) => c.goal_id === goalId && c.completed)
      .map((c) => c.completion_date)
      .sort((a, b) => b.localeCompare(a));
    
    if (goalCompletions.length === 0) return 0;
    
    // Check if today or yesterday is completed to start streak
    const hasToday = goalCompletions.includes(today);
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    const hasYesterday = goalCompletions.includes(yesterday);
    
    if (!hasToday && !hasYesterday) return 0;
    
    let streak = 0;
    let expectedDate = hasToday ? today : yesterday;
    
    for (const date of goalCompletions) {
      if (date === expectedDate) {
        streak++;
        expectedDate = format(new Date(new Date(expectedDate).getTime() - 86400000), "yyyy-MM-dd");
      } else if (date < expectedDate) {
        break;
      }
    }
    
    return streak;
  };

  const handleAddGoal = async () => {
    if (!newGoalText.trim()) return;
    
    // Capture values before closing
    const text = newGoalText.trim();
    const goalType = newGoalType;
    const category = newGoalCategory || undefined;
    
    // Close dialog FIRST (synchronously)
    setIsAddDialogOpen(false);
    setNewGoalText("");
    setNewGoalCategory("");
    
    // Then do async work
    await createGoal({
      text,
      goal_type: goalType,
      category,
    });
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;
    await deleteGoal(deleteGoalId);
    setDeleteGoalId(null);
  };

  const handleEditGoal = async () => {
    if (!editingGoal || !editGoalText.trim()) return;
    
    await updateGoal({
      goalId: editingGoal.id,
      data: {
        text: editGoalText.trim(),
        goal_type: editGoalType,
        category: editGoalCategory || undefined,
      },
    });
    
    setEditingGoal(null);
    setEditGoalText("");
    setEditGoalCategory("");
  };

  const handleToggleToday = async (goalId: string, completed: boolean) => {
    await toggleCompletion({
      goal_id: goalId,
      date: today,
      completed,
    });
  };

  const isLoading = goalsLoading || completionsLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold font-serif">Daily Goals</h1>
            <p className="text-sm text-muted-foreground">
              Track your daily habits and build consistency
            </p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>
                Create a new daily goal to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-text">Goal</Label>
                <Input
                  id="goal-text"
                  placeholder="Enter your daily goal..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGoal();
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newGoalType} onValueChange={(v) => setNewGoalType(v as GoalType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(goalTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoalCategory} onValueChange={(v) => setNewGoalCategory(v as GoalCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGoal} disabled={!newGoalText.trim() || isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Today&apos;s Progress</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={stats.todayProgress} className="flex-1 h-3" />
            <span className="text-sm font-medium whitespace-nowrap">
              {stats.todayCompleted}/{stats.todayTotal} completed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.todayProgress)}%</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals.length}</p>
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals by Type */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first daily goal
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(Object.keys(goalTypeConfig) as GoalType[]).map((type) => {
            const config = goalTypeConfig[type];
            const typeGoals = goalsByType[type];
            
            if (typeGoals.length === 0) return null;
            
            const Icon = config.icon;
            
            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border", config.color)}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {config.label}
                    <Badge variant="secondary" className="ml-auto">
                      {typeGoals.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {typeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        completions={completions.filter((c) => c.goal_id === goal.id)}
                        currentStreak={getGoalStreak(goal.id)}
                        onToggleToday={(completed) => handleToggleToday(goal.id, completed)}
                        onEdit={() => setEditingGoal(goal)}
                        onDelete={() => setDeleteGoalId(goal.id)}
                        isToggling={isToggling}
                      />
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your daily goal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-text">Goal</Label>
              <Input
                id="edit-goal-text"
                placeholder="Enter your daily goal..."
                value={editGoalText}
                onChange={(e) => setEditGoalText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditGoal();
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editGoalType} onValueChange={(v) => setEditGoalType(v as GoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(goalTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editGoalCategory} onValueChange={(v) => setEditGoalCategory(v as GoalCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditGoal} disabled={!editGoalText.trim() || isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={(open) => !open && setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? Your completion history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
