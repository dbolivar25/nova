import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

// GET /api/user/export - Export user data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json"; // json or csv

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For CSV export, only return journal entries
    if (format === "csv") {
      const { data: entries, error: entriesError } = await supabase
        .from("journal_entries")
        .select(`
          *,
          prompt_responses (
            prompt_id,
            response_text,
            prompt:journal_prompts (
              prompt_text
            )
          )
        `)
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (entriesError) {
        console.error("Error fetching journal entries:", entriesError);
        return NextResponse.json(
          { error: "Failed to fetch journal entries" },
          { status: 500 }
        );
      }

      // Convert to CSV format
      const csvRows = ["Date,Mood,Word Count,Freeform Entry,Prompt 1,Response 1,Prompt 2,Response 2,Prompt 3,Response 3"];
      
      entries?.forEach(entry => {
        const date = entry.entry_date;
        const mood = entry.mood || "";
        const wordCount = entry.word_count || 0;
        const freeform = `"${(entry.freeform_text || "").replace(/"/g, '""')}"`;
        
        // Get prompts and responses
        const promptResponses = entry.prompt_responses || [];
        const prompt1 = promptResponses[0]?.prompt?.prompt_text || "";
        const response1 = `"${(promptResponses[0]?.response_text || "").replace(/"/g, '""')}"`;
        const prompt2 = promptResponses[1]?.prompt?.prompt_text || "";
        const response2 = `"${(promptResponses[1]?.response_text || "").replace(/"/g, '""')}"`;
        const prompt3 = promptResponses[2]?.prompt?.prompt_text || "";
        const response3 = `"${(promptResponses[2]?.response_text || "").replace(/"/g, '""')}"`;
        
        csvRows.push(`${date},${mood},${wordCount},${freeform},"${prompt1}",${response1},"${prompt2}",${response2},"${prompt3}",${response3}`);
      });

      const csv = csvRows.join("\n");
      const filename = `nova-journal-export-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // For JSON export, get all user data
    const [
      { data: preferences },
      { data: entries },
      { data: insights },
      { data: conversations }
    ] = await Promise.all([
      // User preferences
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single(),

      // Journal entries with prompt responses
      supabase
        .from("journal_entries")
        .select(`
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
        `)
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false }),

      // Weekly insights
      supabase
        .from("weekly_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start_date", { ascending: false }),

      // AI conversations (nova chats)
      supabase
        .from("nova_chats")
        .select(`
          *,
          messages:nova_messages(*)
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    ]);

    // Calculate statistics
    const totalEntries = entries?.length || 0;
    const totalWords = entries?.reduce((sum, entry) => sum + (entry.word_count || 0), 0) || 0;
    const averageWordCount = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {};
    entries?.forEach(entry => {
      if (entry.mood) {
        moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      }
    });

    // Compile all data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        totalEntries,
        totalWords,
        averageWordCount,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
      },
      preferences: preferences || {},
      statistics: {
        totalEntries,
        totalWords,
        averageWordCount,
        moodDistribution,
      },
      journalEntries: entries || [],
      weeklyInsights: insights || [],
      aiConversations: conversations || [],
    };

    const filename = `nova-export-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in data export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}