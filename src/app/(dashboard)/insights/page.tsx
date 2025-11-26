"use client"

import { useEffect } from "react"
import { Badge } from "@/components/shared/ui/badge"
import { Button } from "@/components/shared/ui/button"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { TrendingUp, Brain, Heart, Target, RefreshCw, Sparkles, Quote } from "lucide-react"
import { toast } from "sonner"
import { useWeeklyInsights, useGenerateWeeklyInsights } from "@/features/insights/hooks/use-weekly-insights"

export default function InsightsPage() {
  const {
    data: insights,
    isLoading,
    error,
  } = useWeeklyInsights()
  const generateMutation = useGenerateWeeklyInsights()
  const isGenerating = generateMutation.isPending

  useEffect(() => {
    if (error) {
      console.error('Error fetching insights:', error)
      toast.error('Failed to load insights')
    }
  }, [error])

  const handleGenerateInsights = async () => {
    try {
      const generated = await generateMutation.mutateAsync({ force: true })
      if (generated) {
        toast.success('Insights generated successfully!')
      }
    } catch (err) {
      console.error('Error generating insights:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate insights')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Weekly Insights
          </h1>
          <p className="text-muted-foreground">
            Personalized patterns and themes from your reflections
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-semibold">No Insights Yet</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Journal for at least 3 days this week to generate personalized insights about your emotional patterns and growth moments.
          </p>
          <Button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="mt-6 rounded-xl h-11 px-6"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights Now
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Weekly Insights
          </h1>
          <p className="text-muted-foreground">
            {new Date(insights.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(insights.weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="rounded-xl border-border/60"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Emotional Trends */}
        <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Emotional Trends</h2>
              <p className="text-sm text-muted-foreground">Your journey this week</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Mood</span>
              <Badge variant="secondary" className="capitalize">{insights.emotionalTrends.overallMood}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {insights.emotionalTrends.summary}
            </p>
            {insights.emotionalTrends.dominantEmotions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {insights.emotionalTrends.dominantEmotions.map((emotion, i) => (
                  <Badge key={i} variant="outline" className="border-border/60 text-xs capitalize">
                    {emotion}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Themes */}
        <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Key Themes</h2>
              <p className="text-sm text-muted-foreground">Topics that emerged</p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.keyThemes.map((theme, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20">{theme.name}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {theme.frequency} {theme.frequency === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Moments */}
        <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Growth Moments</h2>
              <p className="text-sm text-muted-foreground">Breakthroughs and realizations</p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.growthMoments.length > 0 ? (
              insights.growthMoments.map((moment, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{moment.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex gap-2 rounded-xl bg-muted/30 p-3">
                    <Quote className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                    <p className="text-sm italic text-muted-foreground">{moment.quote}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{moment.significance}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific growth moments identified this week. Keep journaling to uncover your insights.
              </p>
            )}
          </div>
        </div>

        {/* Week Ahead Focus */}
        <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Week Ahead</h2>
              <p className="text-sm text-muted-foreground">Suggested focus areas</p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.weekAheadSuggestions.length > 0 ? (
              insights.weekAheadSuggestions.map((suggestion, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-sm font-medium">{suggestion.focusArea}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
                  <p className="text-sm italic text-primary/80">{suggestion.guidance}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Continue with your current journaling practice. New suggestions will appear as patterns emerge.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nova's Observation */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold">Nova&apos;s Observation</h2>
            <p className="text-sm text-muted-foreground">
              Based on {insights.entryCount} {insights.entryCount === 1 ? 'entry' : 'entries'} this week
            </p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {insights.novaObservation}
        </p>
      </div>
    </div>
  )
}
