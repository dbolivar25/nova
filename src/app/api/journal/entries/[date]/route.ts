import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

// Schema for updating journal entries
const updateEntrySchema = z.object({
  freeform_text: z.string().optional(),
  mood: z
    .enum([
      "positive",
      "neutral",
      "negative",
      "thoughtful",
      "grateful",
      "anxious",
      "excited",
      "sad",
      "angry",
      "peaceful",
    ])
    .optional(),
  prompt_responses: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // For existing responses
        prompt_id: z.string().uuid(),
        response_text: z.string(),
      })
    )
    .optional(),
});

// GET /api/journal/entries/[date] - Get journal entry for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the journal entry for the specified date
    const { data: entry, error } = await supabase
      .from("journal_entries")
      .select(
        `
        *,
        prompt_responses (
          id,
          prompt_id,
          response_text,
          prompt:journal_prompts (
            id,
            prompt_text,
            category
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No entry found for this date
        return NextResponse.json({ entry: null });
      }
      console.error("Error fetching journal entry:", error);
      return NextResponse.json(
        { error: "Failed to fetch entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error in journal entry API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/journal/entries/[date] - Update journal entry for a specific date
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { freeform_text, mood, prompt_responses } = validationResult.data;

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if entry exists and get current data
    const { data: existingEntry, error: fetchError } = await supabase
      .from("journal_entries")
      .select(`
        id,
        freeform_text,
        prompt_responses (
          id,
          prompt_id,
          response_text
        )
      `)
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: Record<string, unknown> = {};
    if (freeform_text !== undefined) {
      updates.freeform_text = freeform_text;
    }
    if (mood !== undefined) {
      updates.mood = mood;
    }

    // Handle prompt responses if provided
    if (prompt_responses) {
      // Get existing responses
      const { data: existingResponses } = await supabase
        .from("prompt_responses")
        .select("id, prompt_id")
        .eq("journal_entry_id", existingEntry.id);

      const existingResponseMap = new Map(
        (existingResponses || []).map((r) => [r.prompt_id, r.id])
      );

      // Process each response
      for (const response of prompt_responses) {
        if (response.id || existingResponseMap.has(response.prompt_id)) {
          // Update existing response
          await supabase
            .from("prompt_responses")
            .update({ response_text: response.response_text })
            .eq("id", response.id || existingResponseMap.get(response.prompt_id) || "");
        } else {
          // Create new response
          await supabase.from("prompt_responses").insert({
            journal_entry_id: existingEntry.id,
            prompt_id: response.prompt_id,
            response_text: response.response_text,
          });
        }
      }
    }

    // Calculate total word count from ALL text (freeform + prompt responses)
    let word_count = 0

    // Use updated freeform_text if provided, otherwise use existing
    const finalFreeformText = freeform_text !== undefined ? freeform_text : existingEntry.freeform_text
    if (finalFreeformText) {
      word_count += finalFreeformText.trim().split(/\s+/).filter((word) => word.length > 0).length
    }

    // Use updated prompt_responses if provided, otherwise use existing
    const finalPromptResponses = prompt_responses || existingEntry.prompt_responses
    if (finalPromptResponses) {
      finalPromptResponses.forEach((response: { response_text: string | null }) => {
        if (response.response_text) {
          word_count += response.response_text.trim().split(/\s+/).filter((word) => word.length > 0).length
        }
      })
    }

    updates.word_count = word_count

    // Update the journal entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", existingEntry.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating journal entry:", updateError);
      return NextResponse.json(
        { error: "Failed to update entry" },
        { status: 500 }
      );
    }

    // Fetch the complete updated entry
    const { data: completeEntry, error: completeFetchError } = await supabase
      .from("journal_entries")
      .select(
        `
        *,
        prompt_responses (
          id,
          prompt_id,
          response_text,
          prompt:journal_prompts (
            id,
            prompt_text,
            category
          )
        )
      `
      )
      .eq("id", existingEntry.id)
      .single();

    if (completeFetchError) {
      console.error("Error fetching complete entry:", completeFetchError);
      return NextResponse.json({ entry: updatedEntry });
    }

    return NextResponse.json({ entry: completeEntry });
  } catch (error) {
    console.error("Error in journal entry update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/journal/entries/[date] - Delete journal entry for a specific date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the journal entry (prompt responses will cascade delete)
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_date", date);

    if (error) {
      console.error("Error deleting journal entry:", error);
      return NextResponse.json(
        { error: "Failed to delete entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in journal entry deletion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}