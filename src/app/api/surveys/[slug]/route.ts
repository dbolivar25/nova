import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/surveys/[slug]
 * Get a specific survey with its questions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServiceRoleClient();

    // Fetch survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", survey.id)
      .order("step_number", { ascending: true })
      .order("display_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { error: "Failed to fetch survey questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      survey: {
        ...survey,
        questions: questions || [],
      },
    });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
