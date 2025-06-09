import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { differenceInDays } from "date-fns";
import type { JournalStats } from "@/lib/types/journal";

// GET /api/journal/stats - Get journal statistics for the user
export async function GET() {
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

    // Get all journal entries for stats calculation
    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("entry_date, word_count, mood")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (entriesError) {
      console.error("Error fetching journal entries for stats:", entriesError);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalEntries = entries?.length || 0;
    const totalWordCount = entries?.reduce((sum, entry) => sum + (entry.word_count || 0), 0) || 0;
    const averageWordCount = totalEntries > 0 ? Math.round(totalWordCount / totalEntries) : 0;

    // Calculate current streak
    let currentStreak = 0;
    if (entries && entries.length > 0) {
      currentStreak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if most recent entry is today or yesterday
      const mostRecent = new Date(entries[0].entry_date);
      mostRecent.setHours(0, 0, 0, 0);
      const daysDiff = differenceInDays(today, mostRecent);
      
      if (daysDiff > 1) {
        currentStreak = 0; // Streak broken
      } else {
        // Count consecutive days
        for (let i = 1; i < entries.length; i++) {
          const current = new Date(entries[i].entry_date);
          const previous = new Date(entries[i - 1].entry_date);
          current.setHours(0, 0, 0, 0);
          previous.setHours(0, 0, 0, 0);
          
          const diff = differenceInDays(previous, current);
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate longest streak
    let longestStreak = currentStreak;
    if (entries && entries.length > 1) {
      let tempStreak = 1;
      
      for (let i = 1; i < entries.length; i++) {
        const current = new Date(entries[i].entry_date);
        const previous = new Date(entries[i - 1].entry_date);
        current.setHours(0, 0, 0, 0);
        previous.setHours(0, 0, 0, 0);
        
        const diff = differenceInDays(previous, current);
        if (diff === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {};
    if (entries) {
      entries.forEach(entry => {
        if (entry.mood) {
          moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
        }
      });
    }

    // Ensure all mood types are represented in the distribution
    const allMoods = [
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
    
    const fullMoodDistribution = allMoods.reduce((acc, mood) => {
      acc[mood] = moodDistribution[mood] || 0;
      return acc;
    }, {} as Record<typeof allMoods[number], number>);

    const stats: JournalStats = {
      totalEntries,
      currentStreak,
      longestStreak,
      averageWordCount,
      totalWordCount,
      moodDistribution: fullMoodDistribution,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in journal stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}