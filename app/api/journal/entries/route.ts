import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema for creating/updating journal entries
const journalEntrySchema = z.object({
  entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
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
        prompt_id: z.string().uuid(),
        response_text: z.string(),
      })
    )
    .optional(),
});

// GET /api/journal/entries - Get all journal entries for the user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
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
      .order("entry_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }
    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error("Error fetching journal entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error in journal entries API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/journal/entries - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = journalEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { entry_date, freeform_text, mood, prompt_responses } =
      validationResult.data;

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

    // Calculate word count
    const word_count = freeform_text
      ? freeform_text.split(/\s+/).filter((word) => word.length > 0).length
      : 0;

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date", entry_date)
      .single();

    let entry;
    let entryError;

    if (existingEntry) {
      // Update existing entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from("journal_entries")
        .update({
          freeform_text,
          mood,
          word_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEntry.id)
        .select()
        .single();
      
      entry = updatedEntry;
      entryError = updateError;
    } else {
      // Create new entry
      const { data: newEntry, error: createError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_date,
          freeform_text,
          mood,
          word_count,
        })
        .select()
        .single();
      
      entry = newEntry;
      entryError = createError;
    }

    if (entryError) {
      console.error("Error creating journal entry:", entryError);
      return NextResponse.json(
        { error: "Failed to create entry" },
        { status: 500 }
      );
    }

    // Handle prompt responses if provided
    if (prompt_responses && prompt_responses.length > 0 && entry) {
      // If updating existing entry, we need to handle existing responses
      if (existingEntry) {
        // Delete existing prompt responses for this entry
        await supabase
          .from("prompt_responses")
          .delete()
          .eq("journal_entry_id", entry.id);
      }

      // Insert new prompt responses
      const responsesToInsert = prompt_responses.map((response) => ({
        journal_entry_id: entry.id,
        prompt_id: response.prompt_id,
        response_text: response.response_text,
      }));

      const { error: responsesError } = await supabase
        .from("prompt_responses")
        .insert(responsesToInsert);

      if (responsesError) {
        console.error("Error creating prompt responses:", responsesError);
        // Note: We don't fail the whole request if prompt responses fail
      }
    }

    // Fetch the complete entry with prompt responses
    if (!entry) {
      return NextResponse.json(
        { error: "Failed to create or update entry" },
        { status: 500 }
      );
    }

    const { data: completeEntry, error: fetchError } = await supabase
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
      .eq("id", entry.id)
      .single();

    if (fetchError) {
      console.error("Error fetching complete entry:", fetchError);
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ entry: completeEntry }, { status: 201 });
  } catch (error) {
    console.error("Error in journal entry creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}