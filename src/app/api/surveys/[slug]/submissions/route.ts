import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSubmissionSchema = z.object({
  currentStep: z.number().min(1).optional(),
  status: z.enum(["in_progress", "completed", "abandoned", "archived"]).optional(),
});

/**
 * GET /api/surveys/[slug]/submissions
 * Get current user's submission for a survey (with responses)
 */
export async function GET(
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

    // Get user's most recent active submission (not archived/abandoned)
    const { data: submission, error: submissionError } = await supabase
      .from("user_survey_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("survey_id", survey.id)
      .in("status", ["in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (submissionError && submissionError.code !== "PGRST116") {
      console.error("Error fetching submission:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submission" },
        { status: 500 }
      );
    }

    if (!submission) {
      return NextResponse.json({ submission: null });
    }

    // Get responses for this submission
    const { data: responses, error: responsesError } = await supabase
      .from("user_survey_responses")
      .select("question_id, response_value")
      .eq("submission_id", submission.id);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return NextResponse.json(
        { error: "Failed to fetch responses" },
        { status: 500 }
      );
    }

    // Convert responses array to object keyed by question_id
    const responsesMap: Record<string, unknown> = {};
    for (const response of responses || []) {
      responsesMap[response.question_id] = response.response_value;
    }

    // For completed submissions, fetch current active goals to prefill daily_goals question
    // This ensures the survey shows the user's current goals, not a stale snapshot
    if (submission.status === "completed") {
      // Find the daily_goals question ID
      const { data: dailyGoalsQuestion } = await supabase
        .from("survey_questions")
        .select("id")
        .eq("survey_id", survey.id)
        .eq("question_type", "daily_goals")
        .single();

      if (dailyGoalsQuestion) {
        // Fetch user's current active goals
        const { data: activeGoals } = await supabase
          .from("user_daily_goals")
          .select("id, text, goal_type, category")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (activeGoals && activeGoals.length > 0) {
          // Transform to the format expected by the daily_goals question
          responsesMap[dailyGoalsQuestion.id] = {
            goals: activeGoals.map((g) => ({
              id: g.id,
              text: g.text,
              type: g.goal_type,
              category: g.category,
            })),
          };
        }
      }
    }

    return NextResponse.json({
      submission: {
        ...submission,
        responses: responsesMap,
      },
    });
  } catch (error) {
    console.error("Error in submissions GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys/[slug]/submissions
 * Start a new submission for a survey
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

    // Check for existing in-progress submission
    const { data: existingSubmission } = await supabase
      .from("user_survey_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("survey_id", survey.id)
      .eq("status", "in_progress")
      .single();

    if (existingSubmission) {
      return NextResponse.json(
        { error: "You already have an in-progress submission", submissionId: existingSubmission.id },
        { status: 409 }
      );
    }

    // Create new submission
    const { data: newSubmission, error: createError } = await supabase
      .from("user_survey_submissions")
      .insert({
        user_id: user.id,
        survey_id: survey.id,
        status: "in_progress",
        current_step: 1,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating submission:", createError);
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { submission: { ...newSubmission, responses: {} } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in submissions POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/surveys/[slug]/submissions
 * Update submission (current step, status)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validationResult = UpdateSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { currentStep, status } = validationResult.data;
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

    // Update the user's current submission
    const updateData: Record<string, unknown> = {};
    if (currentStep !== undefined) updateData.current_step = currentStep;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Allow updating both in_progress and completed submissions (for editing)
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("user_survey_submissions")
      .update(updateData)
      .eq("user_id", user.id)
      .eq("survey_id", survey.id)
      .in("status", ["in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: updatedSubmission });
  } catch (error) {
    console.error("Error in submissions PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
