"use client"

import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { PageHeader } from "@/components/shared/layout/page-header"
import { Badge } from "@/components/shared/ui/badge"
import { useJournalStats, useJournalEntries, useOnThisDayEntries } from "@/features/journal/hooks/use-journal"
import { useWeeklyInsights } from "@/features/insights/hooks/use-weekly-insights"
import { WordCountChart } from "@/components/features/analytics/word-count-chart"
import { MoodDistributionChart } from "@/components/features/analytics/mood-distribution-chart"
import { StreakTimelineChart } from "@/components/features/analytics/streak-timeline-chart"
import type { Mood } from "@/features/journal/types/journal"
import Link from "next/link"
import { PenLine, AlignLeft, Flame } from "lucide-react"

const SUMMARY_ITEMS = [
  {
    key: "totalEntries",
    label: "Entries",
    caption: "All-time reflections",
    format: (value?: number) => value?.toLocaleString() ?? "0",
    icon: PenLine,
  },
  {
    key: "currentStreak",
    label: "Current streak",
    suffix: " days",
    caption: "Daily momentum",
    format: (value?: number) => value ?? 0,
    icon: Flame,
  },
  {
    key: "averageWordCount",
    label: "Avg. words",
    caption: "Per entry over 90 days",
    format: (value?: number) => value?.toLocaleString() ?? "0",
    icon: AlignLeft,
  },
] as const

export default function AnalyticsPage() {
  const endDate = format(new Date(), "yyyy-MM-dd")
  const startDate = format(subDays(new Date(), 89), "yyyy-MM-dd")

  const {
    data: stats,
    isLoading: statsLoading,
  } = useJournalStats()

  const { data: entriesData, isLoading: entriesLoading } = useJournalEntries(
    120,
    0,
    startDate,
    endDate,
  )

  const { data: onThisDayData, isLoading: onThisDayLoading } = useOnThisDayEntries(6)
  const { data: insights } = useWeeklyInsights()

  const wordCountData = useMemo(() => {
    if (stats?.wordCountHistory?.length) {
      return stats.wordCountHistory
    }

    const entries = entriesData?.entries ?? []
    return entries
      .map((entry) => ({
        date: entry.entry_date,
        wordCount: entry.word_count || 0,
      }))
      .reverse()
  }, [entriesData?.entries, stats?.wordCountHistory])

  const moodDistribution = useMemo(() => {
    if (stats?.moodDistribution) {
      return stats.moodDistribution
    }

    const fallback: Record<Mood, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      thoughtful: 0,
      grateful: 0,
      anxious: 0,
      excited: 0,
      sad: 0,
      angry: 0,
      peaceful: 0,
    }

    const entries = entriesData?.entries ?? []
    entries.forEach((entry) => {
      if (entry.mood && entry.mood in fallback) {
        fallback[entry.mood as Mood] += 1
      }
    })
    return fallback
  }, [entriesData?.entries, stats?.moodDistribution])

  const onThisDayEntries = onThisDayData?.entries ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pulse"
        subtitle="A quiet snapshot of your writing cadence and emotional rhythm."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {SUMMARY_ITEMS.map((item) => {
          const value = stats?.[item.key as keyof typeof stats] as number | undefined
          const Icon = item.icon
          return (
            <div
              key={item.key}
              className="rounded-xl border border-border/60 bg-card p-4 text-sm shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {statsLoading ? <Skeleton className="h-6 w-16" /> : item.format(value)}
                    {item.suffix && (
                      <span className="ml-1 text-xs font-medium text-muted-foreground">
                        {item.suffix}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.caption}</p>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-muted-foreground">Writing cadence</h3>
          <p className="text-xs text-muted-foreground/80">
            Track how often you show up and how much you share.
          </p>
        </header>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Words Over Time</CardTitle>
              <CardDescription>Daily word count over the past 90 days.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading && entriesLoading ? (
                <Skeleton className="h-[260px] w-full rounded-xl bg-muted/30" />
              ) : wordCountData.length === 0 ? (
                <EmptyState message="Start journaling to see your writing rhythm appear here." />
              ) : (
                <WordCountChart data={wordCountData} />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Mood Composition</CardTitle>
              <CardDescription>AI-inferred moods across your latest entries.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[260px] w-full rounded-xl bg-muted/30" />
              ) : (
                <MoodDistributionChart distribution={moodDistribution} />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-muted-foreground">Perspective & insights</h3>
          <p className="text-xs text-muted-foreground/80">
            Spot streak trends and read Nova’s latest reflection on your journey.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Streak Momentum</CardTitle>
              <CardDescription>Your most recent stretch of writing days.</CardDescription>
            </CardHeader>
            <CardContent>
              <StreakTimelineChart
                days={stats?.streakHistory ?? []}
                currentStreak={stats?.currentStreak}
                longestStreak={stats?.longestStreak}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>Nova&apos;s Latest Observation</CardTitle>
              <CardDescription>
                Weekly insights Nova will reference in future conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {insights ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      Week of {format(new Date(insights.weekStartDate), "MMM d")} –{" "}
                      {format(new Date(insights.weekEndDate), "MMM d")}
                    </Badge>
                    <span>{insights.entryCount} entries analyzed</span>
                  </div>
                  <p className="text-muted-foreground">{insights.novaObservation}</p>
                  <Link
                    href="/insights"
                    className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View full insights report
                  </Link>
                </div>
              ) : (
                <EmptyState
                  message="Write on at least three days this week and Nova will summarise your themes here."
                  ctaLabel="Capture today’s reflection"
                  ctaHref="/journal/today"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-muted-foreground">On this day</h3>
          <p className="text-xs text-muted-foreground/80">
            Quiet echoes from previous years—notice what has shifted or stayed the same.
          </p>
        </header>
        <Card>
          <CardContent>
            {onThisDayLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-40 w-64 rounded-xl bg-muted/30" />
                ))}
              </div>
            ) : onThisDayEntries.length === 0 ? (
              <EmptyState message="Keep writing and Nova will resurface memories from past Octobers right here." />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {onThisDayEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/journal/${entry.entry_date}`}
                    className="group flex w-64 flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {format(new Date(entry.entry_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.word_count || 0} words logged
                        </p>
                      </div>
                      {entry.mood && (
                        <Badge variant="secondary" className="capitalize">
                          {entry.mood}
                        </Badge>
                      )}
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground line-clamp-4">
                      {entry.freeform_text?.trim() ||
                        entry.prompt_responses?.[0]?.response_text ||
                        "Tap to revisit this reflection."}
                    </p>
                    <span className="text-xs font-medium text-primary">Revisit entry →</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function EmptyState({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-muted/15 p-8 text-center text-sm text-muted-foreground">
      <p className="max-w-sm">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-full border border-primary/40 px-4 py-2 text-xs font-medium text-primary transition hover:bg-primary/10"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
