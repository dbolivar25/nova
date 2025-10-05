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
    const search = searchParams.get("search");
    const moodParam = searchParams.get("mood");
    const onThisDay = searchParams.get("onThisDay") === "true";
    
    // Validate mood parameter
    const validMoods = [
      "positive",
      "neutral",
      "negative",
      "thoughtful",
      "grateful",
      "anxious",
      "excited",
      "sad",
      "angry",
      "peaceful"
    ] as const;
    const mood = moodParam && validMoods.includes(moodParam as typeof validMoods[number]) ? moodParam as typeof validMoods[number] : null;

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
      .eq("user_id", user.id);

    // Handle "On This Day" feature - get entries from this date in previous years
    if (onThisDay) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      // Get all entries that match this month and day from any year
      const { data: allEntries, error: fetchError } = await supabase
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
        .order("entry_date", { ascending: false });
      
      if (!fetchError && allEntries) {
        // Filter entries that match month and day
        const onThisDayEntries = allEntries.filter(entry => {
          const entryDate = entry.entry_date.split('-');
          return entryDate[1] === month && entryDate[2] === day;
        });
        
        return NextResponse.json({ 
          entries: onThisDayEntries,
          onThisDay: true,
          date: `${month}-${day}`
        });
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`freeform_text.ilike.%${search}%`);
    }

    // Apply mood filter
    if (mood) {
      query = query.eq("mood", mood);
    }

    // Apply date range filters
    if (startDate) {
      query = query.gte("entry_date", startDate);
    }
    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    // Apply ordering and pagination
    query = query
      .order("entry_date", { ascending: false })
      .range(offset, offset + limit - 1);

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

    // Calculate word count from ALL text (freeform + prompt responses)
    let word_count = 0

    // Count words in freeform text
    if (freeform_text) {
      word_count += freeform_text.trim().split(/\s+/).filter((word) => word.length > 0).length
    }

    // Count words in prompt responses
    if (prompt_responses) {
      prompt_responses.forEach((response) => {
        if (response.response_text) {
          word_count += response.response_text.trim().split(/\s+/).filter((word) => word.length > 0).length
        }
      })
    }

    // Use upsert to handle the race condition
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .upsert({
        user_id: user.id,
        entry_date,
        freeform_text,
        mood,
        word_count,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,entry_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (entryError) {
      console.error("Error creating journal entry:", entryError);
      return NextResponse.json(
        { error: "Failed to create entry" },
        { status: 500 }
      );
    }
    
    // Check if this was an update (existing entry)
    const isUpdate = entry.created_at !== entry.updated_at;

    // Handle prompt responses if provided
    if (prompt_responses && prompt_responses.length > 0 && entry) {
      // If updating existing entry, we need to handle existing responses
      if (isUpdate) {
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