// ============================================
// Goals Feature Types
// ============================================

import type { GoalType, GoalCategory } from "@/features/onboarding/types/survey";

// Re-export for convenience
export type { GoalType, GoalCategory };

// ============================================
// Database Entity Types
// ============================================

export interface DailyGoal {
  id: string;
  user_id: string;
  text: string;
  goal_type: GoalType;
  category: GoalCategory | null;
  is_ai_recommended: boolean;
  is_active: boolean;
  display_order: number;
  source_submission_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalCompletion {
  id: string;
  goal_id: string;
  completion_date: string; // YYYY-MM-DD
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Composite Types
// ============================================

export interface GoalWithCompletions extends DailyGoal {
  completions: GoalCompletion[];
  currentStreak: number;
  bestStreak: number;
  completionRate: number; // 0-100, based on last 7 days
}

export interface GoalsByType {
  add: GoalWithCompletions[];
  remove: GoalWithCompletions[];
  minimize: GoalWithCompletions[];
}

// ============================================
// Stats Types
// ============================================

export interface GoalsStats {
  totalGoals: number;
  activeGoals: number;
  todayCompleted: number;
  todayTotal: number;
  currentOverallStreak: number; // Days with 100% completion
  bestOverallStreak: number;
  weeklyCompletionRate: number; // 0-100
}

export interface GoalStreak {
  goalId: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateGoalRequest {
  text: string;
  goal_type: GoalType;
  category?: GoalCategory;
  is_ai_recommended?: boolean;
}

export interface UpdateGoalRequest {
  text?: string;
  goal_type?: GoalType;
  category?: GoalCategory;
  is_active?: boolean;
  display_order?: number;
}

export interface ToggleCompletionRequest {
  goal_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface CompletionsDateRangeRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

// ============================================
// UI State Types
// ============================================

export interface GoalCardProps {
  goal: GoalWithCompletions;
  onToggleToday: (completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggling?: boolean;
}

export interface WeekDay {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  isToday: boolean;
  completed: boolean | null; // null = no data for future dates
}
