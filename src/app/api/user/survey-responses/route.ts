import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/shared/lib/supabase/types";

export const dynamic = "force-dynamic";

const SaveResponsesSchema = z.object({
  submissionId: z.string().uuid(),
  responses: z.record(z.string(), z.unknown()),
});

/**
 * PUT /api/user/survey-responses
 * Save/update survey responses
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = SaveResponsesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { submissionId, responses } = validationResult.data;
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

    // Verify submission belongs to user and is in progress
    const { data: submission, error: submissionError } = await supabase
      .from("user_survey_submissions")
      .select("id, user_id, status")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Allow editing both in_progress and completed submissions
    if (submission.status !== "in_progress" && submission.status !== "completed") {
      return NextResponse.json(
        { error: "Cannot modify an archived or abandoned submission" },
        { status: 400 }
      );
    }

    // Upsert responses
    const upsertPromises = Object.entries(responses).map(
      async ([questionId, responseValue]) => {
        const { error } = await supabase
          .from("user_survey_responses")
          .upsert(
            {
              submission_id: submissionId,
              question_id: questionId,
              response_value: responseValue as Json,
            },
            {
              onConflict: "submission_id,question_id",
            }
          );

        if (error) {
          console.error(`Error upserting response for ${questionId}:`, error);
          throw error;
        }
      }
    );

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
