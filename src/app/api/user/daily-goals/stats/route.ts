import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { format, subDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

interface GoalStreak {
  goalId: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
}

/**
 * GET /api/user/daily-goals/stats
 * Get goal statistics including streaks and completion rates
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active goals
    const { data: goals, error: goalsError } = await supabase
      .from("user_daily_goals")
      .select("id, text, goal_type")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (goalsError) {
      console.error("Error fetching goals:", goalsError);
      return NextResponse.json(
        { error: "Failed to fetch goals" },
        { status: 500 }
      );
    }

    if (!goals || goals.length === 0) {
      return NextResponse.json({
        stats: {
          totalGoals: 0,
          activeGoals: 0,
          todayCompleted: 0,
          todayTotal: 0,
          currentOverallStreak: 0,
          bestOverallStreak: 0,
          weeklyCompletionRate: 0,
        },
        goalStreaks: [],
      });
    }

    const goalIds = goals.map((g) => g.id);
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const sevenDaysAgo = format(subDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
    const thirtyDaysAgo = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");

    // Get all completions for the last 30 days (for streak calculation)
    const { data: completions, error: completionsError } = await supabase
      .from("user_goal_completions")
      .select("goal_id, completion_date, completed")
      .in("goal_id", goalIds)
      .gte("completion_date", thirtyDaysAgo)
      .lte("completion_date", today)
      .order("completion_date", { ascending: false });

    if (completionsError) {
      console.error("Error fetching completions:", completionsError);
      return NextResponse.json(
        { error: "Failed to fetch completions" },
        { status: 500 }
      );
    }

    // Calculate today's completions
    const todayCompletions = (completions || []).filter(
      (c) => c.completion_date === today && c.completed
    );
    const todayCompleted = todayCompletions.length;

    // Calculate weekly completion rate (last 7 days)
    const weeklyCompletions = (completions || []).filter(
      (c) => c.completion_date >= sevenDaysAgo && c.completed
    );
    const totalPossibleWeekly = goals.length * 7;
    const weeklyCompletionRate = totalPossibleWeekly > 0
      ? Math.round((weeklyCompletions.length / totalPossibleWeekly) * 100)
      : 0;

    // Calculate per-goal streaks
    const goalStreaks: GoalStreak[] = goals.map((goal) => {
      const goalCompletions = (completions || [])
        .filter((c) => c.goal_id === goal.id && c.completed)
        .map((c) => c.completion_date)
        .sort((a, b) => b.localeCompare(a)); // Sort descending

      const { currentStreak, bestStreak } = calculateStreaks(goalCompletions, today);
      
      return {
        goalId: goal.id,
        currentStreak,
        bestStreak,
        lastCompletedDate: goalCompletions[0] || null,
      };
    });

    // Calculate overall streak (days where ALL goals were completed)
    const filteredCompletions = (completions || []).filter(
      (c): c is { goal_id: string; completion_date: string; completed: boolean } => 
        c.completed !== null
    );
    const { currentOverallStreak, bestOverallStreak } = calculateOverallStreaks(
      filteredCompletions,
      goals.length,
      today
    );

    return NextResponse.json({
      stats: {
        totalGoals: goals.length,
        activeGoals: goals.length,
        todayCompleted,
        todayTotal: goals.length,
        currentOverallStreak,
        bestOverallStreak,
        weeklyCompletionRate,
      },
      goalStreaks,
    });
  } catch (error) {
    console.error("Error in stats GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate current and best streak for a single goal
 */
function calculateStreaks(
  completionDates: string[],
  today: string
): { currentStreak: number; bestStreak: number } {
  if (completionDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let expectedDate = today;

  // Check if there's a completion today or yesterday to start the streak
  const hasToday = completionDates.includes(today);
  const yesterday = format(subDays(new Date(today), 1), "yyyy-MM-dd");
  const hasYesterday = completionDates.includes(yesterday);

  if (!hasToday && !hasYesterday) {
    // No recent completion, current streak is 0
    // But still calculate best streak
    for (let i = 0; i < completionDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = completionDates[i - 1];
        const currDate = completionDates[i];
        const expectedPrev = format(subDays(new Date(prevDate), 1), "yyyy-MM-dd");
        
        if (currDate === expectedPrev) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    return { currentStreak: 0, bestStreak };
  }

  // Start from today or yesterday
  expectedDate = hasToday ? today : yesterday;

  for (const date of completionDates) {
    if (date === expectedDate) {
      tempStreak++;
      expectedDate = format(subDays(new Date(expectedDate), 1), "yyyy-MM-dd");
    } else if (date < expectedDate) {
      // Gap in streak
      break;
    }
  }

  currentStreak = tempStreak;
  bestStreak = currentStreak;

  // Continue to find best streak in remaining dates
  tempStreak = 0;
  for (let i = 0; i < completionDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = completionDates[i - 1];
      const currDate = completionDates[i];
      const expectedPrev = format(subDays(new Date(prevDate), 1), "yyyy-MM-dd");
      
      if (currDate === expectedPrev) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return { currentStreak, bestStreak };
}

/**
 * Calculate overall streak (days where ALL goals were completed)
 */
function calculateOverallStreaks(
  completions: { goal_id: string; completion_date: string; completed: boolean }[],
  totalGoals: number,
  today: string
): { currentOverallStreak: number; bestOverallStreak: number } {
  if (totalGoals === 0) {
    return { currentOverallStreak: 0, bestOverallStreak: 0 };
  }

  // Group completions by date
  const completionsByDate = new Map<string, Set<string>>();
  
  for (const completion of completions) {
    if (!completion.completed) continue;
    
    if (!completionsByDate.has(completion.completion_date)) {
      completionsByDate.set(completion.completion_date, new Set());
    }
    completionsByDate.get(completion.completion_date)!.add(completion.goal_id);
  }

  // Find dates where all goals were completed
  const fullCompletionDates: string[] = [];
  for (const [date, goalIds] of completionsByDate) {
    if (goalIds.size === totalGoals) {
      fullCompletionDates.push(date);
    }
  }

  fullCompletionDates.sort((a, b) => b.localeCompare(a)); // Sort descending

  const { currentStreak, bestStreak } = calculateStreaks(fullCompletionDates, today);
  return { currentOverallStreak: currentStreak, bestOverallStreak: bestStreak };
}
