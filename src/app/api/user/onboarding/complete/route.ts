import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CompleteOnboardingSchema = z.object({
  submissionId: z.string().uuid(),
});

// Types for the daily goals response value
type GoalType = "add" | "remove" | "minimize";
type GoalCategory = "health" | "productivity" | "relationships" | "mindset" | "learning" | "finance" | "creativity" | "other";

interface DailyGoalValue {
  id: string;
  text: string;
  type: GoalType;
  category?: GoalCategory;
}

interface DailyGoalsValue {
  goals: DailyGoalValue[];
}

function isDailyGoalsValue(value: unknown): value is DailyGoalsValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "goals" in value &&
    Array.isArray((value as DailyGoalsValue).goals)
  );
}

/**
 * POST /api/user/onboarding/complete
 * Mark onboarding as complete and transfer daily goals to user_daily_goals table
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = CompleteOnboardingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { submissionId } = validationResult.data;
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

    // Verify submission belongs to user
    const { data: submission, error: submissionError } = await supabase
      .from("user_survey_submissions")
      .select("id, user_id, survey_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all responses for this submission to find daily_goals question
    const { data: responses, error: responsesError } = await supabase
      .from("user_survey_responses")
      .select(`
        id,
        question_id,
        response_value,
        survey_questions!inner(question_type)
      `)
      .eq("submission_id", submissionId);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
    }

    // Find and process daily_goals responses
    const dailyGoalsResponses = responses?.filter(
      (r) => (r.survey_questions as { question_type: string })?.question_type === "daily_goals"
    ) || [];

    // Insert NEW daily goals (ones that don't already exist)
    if (dailyGoalsResponses.length > 0) {
      for (const response of dailyGoalsResponses) {
        const goalsValue = response.response_value as unknown;
        
        if (isDailyGoalsValue(goalsValue) && goalsValue.goals.length > 0) {
          // Get ALL existing active goals for this user (to check for duplicates by text)
          const { data: existingGoals } = await supabase
            .from("user_daily_goals")
            .select("id, text, goal_type, display_order")
            .eq("user_id", user.id)
            .eq("is_active", true);

          // Create a Set of existing goal identifiers (text + type) for quick lookup
          const existingGoalKeys = new Set(
            (existingGoals || []).map((g) => `${g.goal_type}:${g.text.toLowerCase().trim()}`)
          );

          // Calculate max display order per type
          const maxOrderByType: Record<string, number> = {
            add: -1,
            remove: -1,
            minimize: -1,
          };

          if (existingGoals) {
            for (const goal of existingGoals) {
              const order = goal.display_order ?? -1;
              if (order > maxOrderByType[goal.goal_type]) {
                maxOrderByType[goal.goal_type] = order;
              }
            }
          }

          // Prepare only NEW goals for insertion (skip duplicates)
          const goalsToInsert: {
            user_id: string;
            text: string;
            goal_type: GoalType;
            category: GoalCategory | null;
            is_ai_recommended: boolean;
            is_active: boolean;
            display_order: number;
            source_submission_id: string;
          }[] = [];

          for (const goal of goalsValue.goals) {
            const goalKey = `${goal.type}:${goal.text.toLowerCase().trim()}`;
            
            // Skip if this goal already exists
            if (existingGoalKeys.has(goalKey)) {
              continue;
            }

            const displayOrder = maxOrderByType[goal.type] + 1;
            maxOrderByType[goal.type] = displayOrder;

            goalsToInsert.push({
              user_id: user.id,
              text: goal.text,
              goal_type: goal.type,
              category: goal.category ?? null,
              is_ai_recommended: false,
              is_active: true,
              display_order: displayOrder,
              source_submission_id: submissionId,
            });

            // Add to set so we don't insert duplicates within the same batch
            existingGoalKeys.add(goalKey);
          }

          if (goalsToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from("user_daily_goals")
              .insert(goalsToInsert);

            if (insertError) {
              console.error("Error inserting daily goals:", insertError);
              // Don't fail the whole request, just log the error
            } else {
              console.log(`Inserted ${goalsToInsert.length} new daily goals for user ${user.id}`);
            }
          } else {
            console.log(`No new goals to insert for user ${user.id} (all already exist)`);
          }
        }
      }
    }

    // Update submission status to completed
    const { error: updateSubmissionError } = await supabase
      .from("user_survey_submissions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateSubmissionError) {
      console.error("Error updating submission:", updateSubmissionError);
      return NextResponse.json(
        { error: "Failed to complete submission" },
        { status: 500 }
      );
    }

    // Mark user's onboarding as complete
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (updateUserError) {
      console.error("Error updating user:", updateUserError);
      return NextResponse.json(
        { error: "Failed to update onboarding status" },
        { status: 500 }
      );
    }

    // Set cookie for middleware
    const response = NextResponse.json({ success: true });
    response.cookies.set("nova-onboarding-completed", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
