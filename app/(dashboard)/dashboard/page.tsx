"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart3,
  Flame,
  PenLine,
  ChevronRight,
  PenSquare,
} from "lucide-react";
import { useJournalEntries, useTodaysJournalEntry, useJournalStats } from "@/hooks/use-journal";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useUser();

  // Fetch real data
  const { entry: todayEntry } = useTodaysJournalEntry();
  const { data: entriesData, isLoading: isLoadingEntries } = useJournalEntries(6, 0);
  const { data: stats, isLoading: isLoadingStats } = useJournalStats();
  
  const recentEntries = useMemo(() => entriesData?.entries || [], [entriesData?.entries]);

  // Calculate today's progress
  const todayProgress = useMemo(() => {
    if (!todayEntry) return 0;
    
    let completedItems = 0;
    const totalItems = 3; // 3 prompts expected
    
    // Count completed prompts
    if (todayEntry.prompt_responses && Array.isArray(todayEntry.prompt_responses)) {
      const completedPrompts = todayEntry.prompt_responses.filter(
        pr => pr.response_text && pr.response_text.trim().length > 20
      ).length;
      completedItems = Math.min(completedPrompts, totalItems);
    }
    
    return Math.round((completedItems / totalItems) * 100);
  }, [todayEntry]);

  // Calculate current streak
  const calculateStreak = () => {
    if (!recentEntries.length) return 0;
    
    const sortedEntries = [...recentEntries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    
    let streak = 1;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Check if most recent entry is today or yesterday
    const mostRecent = new Date(sortedEntries[0].entry_date);
    mostRecent.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(todayDate, mostRecent);
    
    if (daysDiff > 1) return 0; // Streak broken
    
    // Count consecutive days
    for (let i = 1; i < sortedEntries.length; i++) {
      const current = new Date(sortedEntries[i].entry_date);
      const previous = new Date(sortedEntries[i - 1].entry_date);
      current.setHours(0, 0, 0, 0);
      previous.setHours(0, 0, 0, 0);
      
      const diff = differenceInDays(previous, current);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const today = useMemo(() => new Date(), []);
  const currentStreak = stats?.currentStreak || calculateStreak();
  const greeting = getGreeting();
  const firstName = user?.firstName || "there";

  // Calculate mood stats
  const moodStats = useMemo(() => {
    if (!stats?.moodDistribution) return null;
    const topMood = Object.entries(stats.moodDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    return topMood?.[0] || null;
  }, [stats]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Good {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Main Grid - 4 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Journal - Takes 2 columns */}
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Today&apos;s Journal</h3>
                  <p className="text-sm text-muted-foreground">
                    {todayProgress === 0 
                      ? "Start your daily reflection" 
                      : `${Math.floor(todayProgress / 33)} of 3 prompts completed`}
                  </p>
                </div>
              </div>
            </div>
            <Progress value={todayProgress} className="h-2 mb-3" />
            <Button className="w-full" asChild>
              <Link href="/journal/today">
                {todayProgress === 0 ? "Start Writing" : "Continue Writing"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold">{currentStreak}</span>
                  <span className="text-sm text-muted-foreground">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {currentStreak > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Keep it up! 🔥</p>
                )}
              </div>
              <Flame className={cn(
                "h-8 w-8",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/30"
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Entries</p>
                <p className="text-xl font-bold">{stats?.totalEntries || 0}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Avg. Words</p>
                <p className="text-xl font-bold">{stats?.averageWordCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Entries */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/journal">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <PenSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No entries yet. Start journaling today!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEntries.slice(0, 4).map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/journal/${entry.entry_date}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="text-center min-w-[35px]">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {format(parseISO(entry.entry_date), "MMM")}
                      </p>
                      <p className="text-lg font-semibold leading-none">
                        {format(parseISO(entry.entry_date), "d")}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {format(parseISO(entry.entry_date), "EEEE")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.word_count || 0} words
                      </p>
                    </div>
                    {entry.mood && (
                      <Badge variant="secondary" className="capitalize text-xs">
                        {entry.mood}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Progress Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingStats ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Total Words</span>
                      <span className="text-xs font-medium">
                        {(stats?.totalWordCount || 0).toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((stats?.totalWordCount || 0) / 10000 * 100, 100)} 
                      className="h-1.5"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Goal: 10,000 words
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Longest Streak</span>
                    <span className="font-medium">{stats?.longestStreak || 0} days</span>
                  </div>
                  
                  {moodStats && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Top mood</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {moodStats}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-3">
            <Link 
              href="/nova" 
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-accent transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Chat with Nova</p>
                <p className="text-xs text-muted-foreground">Get AI-powered insights</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link 
              href="/insights" 
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-accent transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Weekly Insights</p>
                <p className="text-xs text-muted-foreground">
                  {recentEntries.length >= 3 
                    ? "View your analysis" 
                    : `${3 - recentEntries.length} more entries needed`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link 
              href="/journal" 
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-accent transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Journal History</p>
                <p className="text-xs text-muted-foreground">Browse all entries</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}