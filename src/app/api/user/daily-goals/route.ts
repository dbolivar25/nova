import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateGoalSchema = z.object({
  text: z.string().min(1).max(500),
  goal_type: z.enum(["add", "remove", "minimize"]),
  category: z.enum([
    "health", "productivity", "relationships", 
    "mindset", "learning", "finance", "creativity", "other"
  ]).optional(),
  is_ai_recommended: z.boolean().optional().default(false),
  source_submission_id: z.string().uuid().optional(),
});

/**
 * GET /api/user/daily-goals
 * Get all active daily goals for the current user
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
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("goal_type", { ascending: true })
      .order("display_order", { ascending: true });

    if (goalsError) {
      console.error("Error fetching goals:", goalsError);
      return NextResponse.json(
        { error: "Failed to fetch goals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error("Error in daily-goals GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/daily-goals
 * Create a new daily goal
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = CreateGoalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const goalData = validationResult.data;
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

    // Get current max display_order for this goal type
    const { data: maxOrderResult } = await supabase
      .from("user_daily_goals")
      .select("display_order")
      .eq("user_id", user.id)
      .eq("goal_type", goalData.goal_type)
      .eq("is_active", true)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    const newDisplayOrder = (maxOrderResult?.display_order ?? -1) + 1;

    // Create goal
    const { data: newGoal, error: createError } = await supabase
      .from("user_daily_goals")
      .insert({
        user_id: user.id,
        text: goalData.text,
        goal_type: goalData.goal_type,
        category: goalData.category || null,
        is_ai_recommended: goalData.is_ai_recommended,
        source_submission_id: goalData.source_submission_id || null,
        display_order: newDisplayOrder,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating goal:", createError);
      return NextResponse.json(
        { error: "Failed to create goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal: newGoal }, { status: 201 });
  } catch (error) {
    console.error("Error in daily-goals POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
