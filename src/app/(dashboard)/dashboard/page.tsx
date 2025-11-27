"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Progress } from "@/components/shared/ui/progress";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";
import { ArrowRight, PenLine, ChevronRight, BookOpen, Flame, Trophy } from "lucide-react";
import { useJournalEntries, useTodaysJournalEntry, useJournalStats } from "@/features/journal/hooks/use-journal";
import { StreakFlame } from "@/components/features/journal/streak-flame";
import { StreakBadges } from "@/components/features/journal/streak-badges";
import { SurveyDialog } from "@/components/features/onboarding/survey-flow";

export default function DashboardPage() {
  const { user } = useUser();

  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  const { entry: todayEntry } = useTodaysJournalEntry();
  const { data: entriesData, isLoading: isLoadingEntries } = useJournalEntries(6, 0);
  const { data: stats } = useJournalStats();

  useEffect(() => {
    setIsSurveyOpen(true);
  }, []);

  const recentEntries = useMemo(() => entriesData?.entries || [], [entriesData?.entries]);

  const todayProgress = useMemo(() => {
    if (!todayEntry) return 0;

    let completedItems = 0;
    const totalItems = 3;

    if (todayEntry.prompt_responses && Array.isArray(todayEntry.prompt_responses)) {
      const completedPrompts = todayEntry.prompt_responses.filter(
        pr => pr.response_text && pr.response_text.trim().length > 20
      ).length;
      completedItems = Math.min(completedPrompts, totalItems);
    }

    return Math.round((completedItems / totalItems) * 100);
  }, [todayEntry]);

  const calculateStreak = () => {
    if (!recentEntries.length) return 0;

    const sortedEntries = [...recentEntries].sort((a, b) =>
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    let streak = 1;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const mostRecent = new Date(sortedEntries[0].entry_date);
    mostRecent.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(todayDate, mostRecent);

    if (daysDiff > 1) return 0;

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="space-y-3">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Good {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground text-lg">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="secondary" className="rounded-full">Personalize Nova</Badge>
          <span className="text-muted-foreground">We’ll open a quick survey to tune your experience.</span>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Journal - Primary Card */}
        <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-105">
                  <PenLine className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold">Today&apos;s Journal</h2>
                  <p className="text-sm text-muted-foreground">
                    {todayProgress === 0
                      ? "Begin your evening reflection"
                      : `${Math.floor(todayProgress / 33)} of 3 prompts completed`}
                  </p>
                </div>
              </div>
              {todayProgress === 100 && (
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  Complete
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{todayProgress}%</span>
              </div>
              <Progress value={todayProgress} className="h-2" />
            </div>

            <Button size="lg" asChild className="w-full rounded-xl h-12">
              <Link href="/journal/today">
                {todayProgress === 0 ? "Start Writing" : "Continue Writing"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Streak Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-warm/5 p-6 transition-all duration-300 hover:border-warm/30 hover:shadow-lg hover:shadow-warm/5">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <StreakFlame
              streak={currentStreak}
              size="md"
              showNumber={true}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {currentStreak === 0
                ? "Start your streak today"
                : currentStreak === 1
                  ? "Keep going tomorrow!"
                  : "You're on a roll!"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Entries", value: stats?.totalEntries || 0, icon: BookOpen },
          { label: "Average Words", value: stats?.averageWordCount || 0, icon: PenLine },
          { label: "Current Streak", value: currentStreak, icon: Flame, suffix: currentStreak === 1 ? "day" : "days" },
          { label: "Longest Streak", value: stats?.longestStreak || 0, icon: Trophy, suffix: (stats?.longestStreak || 0) === 1 ? "day" : "days" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-200 hover:border-border/60 hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {stat.value}
                  {stat.suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.suffix}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold">Recent Entries</h3>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/journal">
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2">
            {isLoadingEntries ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </>
            ) : recentEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No entries yet. Start journaling to see your reflections here.
                </p>
              </div>
            ) : (
              recentEntries.slice(0, 4).map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.entry_date}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
                >
                  <div className="flex flex-col items-center rounded-lg bg-muted/50 p-2.5 text-center min-w-[50px]">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {format(parseISO(entry.entry_date), "MMM")}
                    </span>
                    <span className="text-xl font-semibold leading-tight">
                      {format(parseISO(entry.entry_date), "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {format(parseISO(entry.entry_date), "EEEE")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.word_count || 0} words
                    </p>
                  </div>
                  {entry.mood && (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {entry.mood}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-warm" />
            <h3 className="font-serif text-xl font-semibold">Achievements</h3>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/30 p-4">
            <StreakBadges
              milestones={stats?.milestones}
              currentStreak={stats?.currentStreak || 0}
              longestStreak={stats?.longestStreak || 0}
            />
          </div>
        </div>
      </div>

      <SurveyDialog
        open={isSurveyOpen}
        onOpenChange={setIsSurveyOpen}
      />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
