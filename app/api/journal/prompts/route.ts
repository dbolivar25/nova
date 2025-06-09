import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRandomPrompts } from "@/lib/prompts";

// GET /api/journal/prompts - Get journal prompts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get("count") || "3");
    const category = searchParams.get("category");
    const fromDB = searchParams.get("source") === "db";

    // If requested from database
    if (fromDB) {
      const supabase = await createServerSupabaseClient();
      
      let query = supabase
        .from("journal_prompts")
        .select("*")
        .eq("is_active", true);

      if (category) {
        query = query.eq("category", category);
      }

      const { data: prompts, error } = await query;

      if (error) {
        console.error("Error fetching prompts from database:", error);
        return NextResponse.json(
          { error: "Failed to fetch prompts" },
          { status: 500 }
        );
      }

      // Randomly select the requested number of prompts
      const shuffled = [...(prompts || [])].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      return NextResponse.json({ prompts: selected });
    }

    // Otherwise, use the hardcoded prompts
    const prompts = getRandomPrompts(count);
    
    // Transform to match database format
    const formattedPrompts = prompts.map((prompt_text, index) => ({
      id: `temp-${index}`,
      prompt_text,
      category: categorizePrompt(prompt_text),
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    return NextResponse.json({ prompts: formattedPrompts });
  } catch (error) {
    console.error("Error in prompts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to categorize prompts based on content
function categorizePrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("emotion") || lowerPrompt.includes("feel") || lowerPrompt.includes("authentic")) {
    return "self-awareness";
  } else if (lowerPrompt.includes("goal") || lowerPrompt.includes("grow") || lowerPrompt.includes("failure") || lowerPrompt.includes("differently")) {
    return "growth";
  } else if (lowerPrompt.includes("someone") || lowerPrompt.includes("relationship") || lowerPrompt.includes("boundary")) {
    return "relationships";
  } else if (lowerPrompt.includes("grateful") || lowerPrompt.includes("beauty") || lowerPrompt.includes("joy") || lowerPrompt.includes("present")) {
    return "gratitude";
  }
  
  return "self-awareness"; // default
}