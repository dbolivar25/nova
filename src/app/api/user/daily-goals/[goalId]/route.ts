import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateGoalSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  goal_type: z.enum(["add", "remove", "minimize"]).optional(),
  category: z.enum([
    "health", "productivity", "relationships", 
    "mindset", "learning", "finance", "creativity", "other"
  ]).nullable().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().min(0).optional(),
});

/**
 * PUT /api/user/daily-goals/[goalId]
 * Update a daily goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;
    const body = await request.json();
    const validationResult = UpdateGoalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;
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
    const { data: existingGoal, error: goalError } = await supabase
      .from("user_daily_goals")
      .select("id, user_id")
      .eq("id", goalId)
      .single();

    if (goalError || !existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from("user_daily_goals")
      .update(updateData)
      .eq("id", goalId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating goal:", updateError);
      return NextResponse.json(
        { error: "Failed to update goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error("Error in daily-goals PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/daily-goals/[goalId]
 * Soft delete a daily goal (set is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;
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
    const { data: existingGoal, error: goalError } = await supabase
      .from("user_daily_goals")
      .select("id, user_id")
      .eq("id", goalId)
      .single();

    if (goalError || !existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete (set is_active = false)
    const { error: deleteError } = await supabase
      .from("user_daily_goals")
      .update({ is_active: false })
      .eq("id", goalId);

    if (deleteError) {
      console.error("Error deleting goal:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in daily-goals DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
