import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("prompt_count")
      .eq("user_id", user.id)
      .single();

    // Get the user's preferred prompt count (default to 3 if not set)
    const userPromptCount = preferences?.prompt_count || 3;

    // Get today's date for consistent prompt selection
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all active prompts
    const { data: allPrompts, error: promptsError } = await supabase
      .from("journal_prompts")
      .select("*")
      .eq("is_active", true)
      .order("id"); // Order by ID for consistent results
    
    if (promptsError) {
      console.error("Error fetching prompts:", promptsError);
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: 500 }
      );
    }

    if (!allPrompts || allPrompts.length === 0) {
      return NextResponse.json({ prompts: [] });
    }

    // Create a deterministic "random" selection based on userId and date
    // This ensures the same user gets the same prompts for the same day
    const seed = `${user.id}-${today}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash to select prompts deterministically
    const promptCount = Math.min(userPromptCount, allPrompts.length);
    const selectedIndices = new Set<number>();
    
    // Generate deterministic indices based on the hash
    for (let i = 0; i < promptCount; i++) {
      let index = Math.abs((hash + i * 7919) % allPrompts.length); // 7919 is a prime number
      // Ensure we don't select the same prompt twice
      while (selectedIndices.has(index)) {
        index = (index + 1) % allPrompts.length;
      }
      selectedIndices.add(index);
    }
    
    // Select the prompts based on the indices
    const prompts = Array.from(selectedIndices).map(index => allPrompts[index]);

    return NextResponse.json({ prompts: prompts || [] });
  } catch (error) {
    console.error("Error in prompts/today:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}