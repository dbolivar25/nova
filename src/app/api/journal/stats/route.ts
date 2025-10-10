import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { differenceInDays, subDays } from "date-fns";
import type { JournalStats } from "@/features/journal/types/journal";

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak and streak start date
    let currentStreak = 0;
    let streakStartDate: string | undefined;
    let lastEntryDate: string | undefined;
    
    if (entries && entries.length > 0) {
      lastEntryDate = entries[0].entry_date;
      currentStreak = 1;
      
      // Check if most recent entry is within the allowed window
      // Allow streak to continue if:
      // - Entry is today (daysDiff = 0)
      // - Entry is yesterday (daysDiff = 1) - gives user all of today to write
      // - Entry is 2+ days ago (daysDiff > 1) - streak is broken
      const mostRecent = new Date(entries[0].entry_date);
      mostRecent.setHours(0, 0, 0, 0);
      const daysDiff = differenceInDays(today, mostRecent);
      
      if (daysDiff > 1) {
        // More than 1 day has passed - streak is broken
        currentStreak = 0;
      } else {
        // Streak continues - count consecutive days
        streakStartDate = entries[0].entry_date;
        
        for (let i = 1; i < entries.length; i++) {
          const current = new Date(entries[i].entry_date);
          const previous = new Date(entries[i - 1].entry_date);
          current.setHours(0, 0, 0, 0);
          previous.setHours(0, 0, 0, 0);
          
          const diff = differenceInDays(previous, current);
          if (diff === 1) {
            currentStreak++;
            streakStartDate = entries[i].entry_date;
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

    // Build timelines for the last 90 days (chronological order)
    const timelineCutoff = subDays(today, 89); // inclusive of today
    const recentEntries = (entries ?? []).filter((entry) => {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= timelineCutoff;
    });

    const wordCountHistory = recentEntries
      .map((entry) => ({
        date: entry.entry_date,
        wordCount: entry.word_count || 0,
      }))
      .reverse();

    const moodTimeline = recentEntries
      .map((entry) => ({
        date: entry.entry_date,
        mood: entry.mood ?? null,
      }))
      .reverse();

    // Calculate streak history for last 30 days
    const streakHistory: { date: string; hasEntry: boolean }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const hasEntry = entries?.some(entry => entry.entry_date === dateStr) || false;
      streakHistory.push({ date: dateStr, hasEntry });
    }
    
    // Define milestones and check if achieved
    const milestones: JournalStats['milestones'] = [
      { days: 7, achieved: currentStreak >= 7 || longestStreak >= 7 },
      { days: 14, achieved: currentStreak >= 14 || longestStreak >= 14 },
      { days: 30, achieved: currentStreak >= 30 || longestStreak >= 30 },
      { days: 60, achieved: currentStreak >= 60 || longestStreak >= 60 },
      { days: 90, achieved: currentStreak >= 90 || longestStreak >= 90 },
      { days: 180, achieved: currentStreak >= 180 || longestStreak >= 180 },
      { days: 365, achieved: currentStreak >= 365 || longestStreak >= 365 },
    ];
    
    const stats: JournalStats = {
      totalEntries,
      currentStreak,
      longestStreak,
      averageWordCount,
      totalWordCount,
      moodDistribution: fullMoodDistribution,
      streakStartDate,
      lastEntryDate,
      streakHistory,
      milestones,
      wordCountHistory,
      moodTimeline,
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
