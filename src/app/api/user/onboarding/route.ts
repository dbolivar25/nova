import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/onboarding
 * Get user's onboarding status
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();

    // Get user with onboarding status
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, onboarding_completed")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get onboarding survey
    const { data: survey } = await supabase
      .from("surveys")
      .select("id")
      .eq("slug", "onboarding")
      .eq("is_active", true)
      .single();

    // Get user's latest submission for onboarding
    let submission = null;
    if (survey) {
      const { data: sub } = await supabase
        .from("user_survey_submissions")
        .select("id, status, current_step, completed_at")
        .eq("user_id", user.id)
        .eq("survey_id", survey.id)
        .in("status", ["in_progress", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      submission = sub;
    }

    return NextResponse.json({
      onboarding: {
        completed: user.onboarding_completed || false,
        submission: submission,
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
