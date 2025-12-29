import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { generateText } from "ai";
import { novaModel } from "@/shared/lib/ai/provider";
import { z } from "zod";
import type { Json } from "@/shared/lib/supabase/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GenerateRecommendationsSchema = z.object({
  submissionId: z.string().uuid().optional(),
});

const RecommendationSchema = z.object({
  text: z.string(),
  type: z.enum(["add", "remove", "minimize"]),
  category: z.enum([
    "health", "productivity", "relationships",
    "mindset", "learning", "finance", "creativity", "other"
  ]),
  reason: z.string(),
});

interface RecommendationContext {
  proudTraits: string[];
  improvementTraits: string[];
  desiredTraits: string[];
  goals: {
    week: string;
    month: string;
    year: string;
    lifetime: string;
  };
  existingDailyGoals: { text: string; type: string }[];
}

/**
 * POST /api/user/goal-recommendations
 * Generate AI recommendations for daily goals
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = GenerateRecommendationsSchema.safeParse(body);

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

    // Build context from survey responses
    const context: RecommendationContext = {
      proudTraits: [],
      improvementTraits: [],
      desiredTraits: [],
      goals: { week: "", month: "", year: "", lifetime: "" },
      existingDailyGoals: [],
    };

    if (submissionId) {
      // Get responses for this submission
      const { data: responses } = await supabase
        .from("user_survey_responses")
        .select(`
          response_value,
          survey_questions!inner(slug)
        `)
        .eq("submission_id", submissionId);

      if (responses) {
        for (const response of responses) {
          const slug = (response.survey_questions as { slug: string }).slug;
          const value = response.response_value;

          switch (slug) {
            case "proud_traits":
              context.proudTraits = Array.isArray(value) ? value as string[] : [];
              break;
            case "improvement_traits":
              context.improvementTraits = Array.isArray(value) ? value as string[] : [];
              break;
            case "desired_traits":
              context.desiredTraits = Array.isArray(value) ? value as string[] : [];
              break;
            case "timeframe_goals":
              if (value && typeof value === "object" && !Array.isArray(value)) {
                const goalsValue = value as Record<string, string>;
                context.goals = {
                  week: goalsValue.week || "",
                  month: goalsValue.month || "",
                  year: goalsValue.year || "",
                  lifetime: goalsValue.lifetime || "",
                };
              }
              break;
            case "daily_goals":
              if (value && typeof value === "object" && !Array.isArray(value)) {
                const dailyGoalsValue = value as { goals?: Array<{ text: string; type: string }> };
                context.existingDailyGoals = dailyGoalsValue.goals || [];
              }
              break;
          }
        }
      }
    }

    // Also get any existing active daily goals
    const { data: existingGoals } = await supabase
      .from("user_daily_goals")
      .select("text, goal_type")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (existingGoals) {
      const existingTexts = new Set(context.existingDailyGoals.map((g) => g.text.toLowerCase()));
      for (const goal of existingGoals) {
        if (!existingTexts.has(goal.text.toLowerCase())) {
          context.existingDailyGoals.push({ text: goal.text, type: goal.goal_type });
        }
      }
    }

    // Build and execute prompt
    const prompt = buildRecommendationPrompt(context);
    
    const { text } = await generateText({
      model: novaModel,
      prompt,
    });

    // Parse response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Invalid AI response format:", text);
      return NextResponse.json(
        { error: "Failed to parse AI recommendations" },
        { status: 500 }
      );
    }

    let recommendations;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      recommendations = z.array(RecommendationSchema).parse(parsed);
    } catch (parseError) {
      console.error("Error parsing recommendations:", parseError, text);
      return NextResponse.json(
        { error: "Failed to parse AI recommendations" },
        { status: 500 }
      );
    }

    // Store recommendations
    const { error: insertError } = await supabase
      .from("user_goal_recommendations")
      .insert({
        user_id: user.id,
        submission_id: submissionId || null,
        recommendations: recommendations as unknown as Json,
        context_snapshot: context as unknown as Json,
        model_id: "groq/gpt-oss-120b",
      });

    if (insertError) {
      console.error("Error storing recommendations:", insertError);
      // Don't fail the request, just log
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildRecommendationPrompt(context: RecommendationContext): string {
  return `
You are Nova, an AI companion helping a new user establish daily habits for personal growth.

Based on their self-assessment, recommend 5-7 specific, actionable daily goals.

## USER'S SELF-ASSESSMENT

**Traits they're PROUD of:**
${context.proudTraits.length > 0 ? context.proudTraits.map((t) => `- ${t}`).join("\n") : "- (none provided)"}

**Traits they want to IMPROVE (not proud of):**
${context.improvementTraits.length > 0 ? context.improvementTraits.map((t) => `- ${t}`).join("\n") : "- (none provided)"}

**Traits they want to INCORPORATE:**
${context.desiredTraits.length > 0 ? context.desiredTraits.map((t) => `- ${t}`).join("\n") : "- (none provided)"}

**Their GOALS:**
- This week: ${context.goals.week || "(not set)"}
- This month: ${context.goals.month || "(not set)"}
- This year: ${context.goals.year || "(not set)"}
- Lifetime: ${context.goals.lifetime || "(not set)"}

**Daily goals they've already added:**
${
  context.existingDailyGoals.length > 0
    ? context.existingDailyGoals.map((g) => `- ${g.text} (${g.type})`).join("\n")
    : "- (none yet)"
}

## INSTRUCTIONS

1. Recommend specific daily actions that:
   - Leverage their strengths (proud traits)
   - Address their improvement areas with concrete actions
   - Help them build desired traits through practice
   - Move them toward their stated goals

2. Include BOTH:
   - **add**: Positive habits to build (things to start doing)
   - **remove**: Habits to break completely (things to stop)
   - **minimize**: Habits to reduce (things to limit, not eliminate)

3. For each recommendation, provide a brief reason explaining WHY it connects to their profile.

4. Avoid recommending anything they've already added.

5. Be specific and actionable (e.g., "Read for 20 minutes before bed" not "Read more").

## OUTPUT FORMAT

Return a JSON array with exactly this structure:
\`\`\`json
[
  {
    "text": "The specific daily habit",
    "type": "add" | "remove" | "minimize",
    "category": "health" | "productivity" | "relationships" | "mindset" | "learning" | "finance" | "creativity" | "other",
    "reason": "Brief explanation connecting to their profile"
  }
]
\`\`\`

Return ONLY the JSON array, no other text.
`.trim();
}
