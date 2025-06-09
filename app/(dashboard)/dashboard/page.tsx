"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  ChartBar,
  MessageSquare,
  PenLine,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Brain,
} from "lucide-react";
import { useJournalEntries, useTodaysJournalEntry, useJournalStats } from "@/hooks/use-journal";

const novaSuggestions = [
  "Help me reflect on today",
  "What patterns do you see in my journal?",
  "Guide me through a difficult situation",
  "Analyze my emotional growth this week",
];

export default function DashboardPage() {
  const { user } = useUser();
  const [novaInput, setNovaInput] = useState("");
  const today = new Date();

  // Fetch real data
  const { entry: todayEntry, isLoading: isLoadingToday } = useTodaysJournalEntry();
  const { data: entriesData, isLoading: isLoadingEntries } = useJournalEntries(10, 0); // Get 10 most recent
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

  const currentStreak = stats?.currentStreak || calculateStreak();
  const greeting = getGreeting();
  const firstName = user?.firstName || "there";

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Good {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground mt-2">
          {format(today, "EEEE, MMMM d, yyyy")} • Your journey continues
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Nova AI Panel - Spans 2 columns on large screens */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-background to-muted/20 border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Chat with Nova</CardTitle>
            </div>
            <CardDescription>
              Your AI companion is here to help you reflect and grow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {novaSuggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start text-left h-auto p-3 hover:bg-primary/5"
                  asChild
                >
                  <Link href={`/nova?prompt=${encodeURIComponent(suggestion)}`}>
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm line-clamp-2">{suggestion}</span>
                  </Link>
                </Button>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              <Textarea
                placeholder="Or start a conversation..."
                value={novaInput}
                onChange={(e) => setNovaInput(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button className="w-full" asChild>
                <Link
                  href={`/nova${novaInput ? `?prompt=${encodeURIComponent(novaInput)}` : ""}`}
                >
                  Start Conversation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Journal Entry */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" />
                <CardTitle>Today&apos;s Entry</CardTitle>
              </div>
              {todayProgress > 0 && (
                <Badge variant="secondary">{todayProgress}%</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingToday ? (
              <>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <Progress value={todayProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {todayProgress === 0
                    ? "Start your daily reflection"
                    : `You've answered ${Math.floor(todayProgress / 33)} of 3 prompts`}
                </p>
                <Button className="w-full" asChild>
                  <Link href="/journal/today">
                    {todayProgress === 0 ? "Begin Writing" : "Continue Writing"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Recent Entries</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/journal">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No entries yet</p>
                <Button size="sm" className="mt-2" asChild>
                  <Link href="/journal/today">Start Writing</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEntries.slice(0, 4).map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/journal/${entry.entry_date}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {format(parseISO(entry.entry_date), "MMM d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.word_count || 0} words
                      </p>
                    </div>
                    {entry.mood && (
                      <Badge variant="outline" className="text-xs">
                        {entry.mood}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Streak */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Your Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats || isLoadingEntries ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                  <div>
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{currentStreak}</p>
                    <p className="text-xs text-muted-foreground">
                      Day Streak {currentStreak > 0 ? '🔥' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalEntries || recentEntries.length}</p>
                    <p className="text-xs text-muted-foreground">Total Entries</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {currentStreak > 2 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Consistency improving</span>
                    </div>
                  )}
                  {(stats?.averageWordCount || 0) > 200 && (
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Deep reflection mode</span>
                    </div>
                  )}
                  {currentStreak === 0 && recentEntries.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Time to restart your streak!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Insights Preview */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartBar className="h-5 w-5 text-primary" />
                <CardTitle>Weekly Insights</CardTitle>
              </div>
              {recentEntries.length >= 3 && (
                <Badge variant="secondary">New</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentEntries.length < 3 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Write at least 3 entries to unlock insights
                </p>
                <Progress value={(recentEntries.length / 3) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {recentEntries.length}/3 entries
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Your personalized analysis is ready
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">3 key themes identified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">Emotional growth detected</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/insights">
                    View Insights
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
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