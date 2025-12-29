import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ToggleCompletionSchema = z.object({
  goal_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
  notes: z.string().max(500).optional(),
});

const DateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/user/daily-goals/completions
 * Get completions for a date range
 * Query params: start_date, end_date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const validationResult = DateRangeSchema.safeParse({
      start_date: startDate,
      end_date: endDate,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid date range. Use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    const { start_date, end_date } = validationResult.data;
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

    // Get user's goal IDs
    const { data: goals } = await supabase
      .from("user_daily_goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!goals || goals.length === 0) {
      return NextResponse.json({ completions: [] });
    }

    const goalIds = goals.map((g) => g.id);

    // Get completions for the date range
    const { data: completions, error: completionsError } = await supabase
      .from("user_goal_completions")
      .select("*")
      .in("goal_id", goalIds)
      .gte("completion_date", start_date)
      .lte("completion_date", end_date)
      .order("completion_date", { ascending: false });

    if (completionsError) {
      console.error("Error fetching completions:", completionsError);
      return NextResponse.json(
        { error: "Failed to fetch completions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ completions: completions || [] });
  } catch (error) {
    console.error("Error in completions GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/daily-goals/completions
 * Toggle completion status for a goal on a specific date
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = ToggleCompletionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { goal_id, date, completed, notes } = validationResult.data;
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

    // Verify goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("user_daily_goals")
      .select("id, user_id")
      .eq("id", goal_id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Upsert completion
    const { data: completion, error: upsertError } = await supabase
      .from("user_goal_completions")
      .upsert(
        {
          goal_id,
          completion_date: date,
          completed,
          notes: notes || null,
        },
        {
          onConflict: "goal_id,completion_date",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting completion:", upsertError);
      return NextResponse.json(
        { error: "Failed to update completion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ completion });
  } catch (error) {
    console.error("Error in completions POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
