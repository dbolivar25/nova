import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/surveys/[slug]/submissions/reset
 * Archive the current submission and allow the user to start fresh
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
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

    // Get survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Mark existing submissions as abandoned (to allow fresh start)
    // Note: We don't deactivate goals - user keeps their existing goals
    const { error: archiveError } = await supabase
      .from("user_survey_submissions")
      .update({ status: "abandoned" })
      .eq("user_id", user.id)
      .eq("survey_id", survey.id)
      .in("status", ["in_progress", "completed"]);

    if (archiveError) {
      console.error("Error archiving submissions:", archiveError);
      return NextResponse.json(
        { error: "Failed to reset survey" },
        { status: 500 }
      );
    }

    // Reset onboarding status in database
    await supabase
      .from("users")
      .update({ onboarding_completed: false })
      .eq("id", user.id);

    // Clear the onboarding cookie so middleware allows fresh start
    const response = NextResponse.json({ success: true });
    response.cookies.set("nova-onboarding-completed", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Error in submissions reset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
