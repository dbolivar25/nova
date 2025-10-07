"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Badge } from "@/components/shared/ui/badge"
import { Button } from "@/components/shared/ui/button"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { TrendingUp, Brain, Heart, Target, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/shared/layout/page-header"
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
      <div className="space-y-6">
        <PageHeader
          title="Weekly Insights"
          subtitle="Personalized analysis and patterns from your journal entries"
        />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Weekly Insights"
          subtitle="Personalized analysis and patterns from your journal entries"
        />
        <Card>
          <CardHeader>
            <CardTitle>No Insights Yet</CardTitle>
            <CardDescription>
              Journal for at least 3 days in a week to generate insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Nova will analyze your journal entries to identify emotional patterns, recurring themes,
              growth moments, and provide personalized guidance for the week ahead.
            </p>
            <Button onClick={handleGenerateInsights} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Insights Now'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Weekly Insights"
          subtitle={`Week of ${new Date(insights.weekStartDate).toLocaleDateString()} - ${new Date(insights.weekEndDate).toLocaleDateString()}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Emotional Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Emotional Trends
            </CardTitle>
            <CardDescription>Your emotional journey this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Mood</span>
                <Badge variant="secondary">{insights.emotionalTrends.overallMood}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {insights.emotionalTrends.summary}
              </p>
              {insights.emotionalTrends.dominantEmotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {insights.emotionalTrends.dominantEmotions.map((emotion, i) => (
                    <Badge key={i} variant="outline">{emotion}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Themes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Key Themes
            </CardTitle>
            <CardDescription>Topics that emerged this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.keyThemes.map((theme, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge>{theme.name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {theme.frequency} {theme.frequency === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth Moments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Growth Moments
            </CardTitle>
            <CardDescription>Breakthroughs and realizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.growthMoments.map((moment, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{moment.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(moment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">&ldquo;{moment.quote}&rdquo;</p>
                  <p className="text-sm">{moment.significance}</p>
                </div>
              ))}
              {insights.growthMoments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No specific growth moments identified this week.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Week Ahead Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Week Ahead Focus
            </CardTitle>
            <CardDescription>Suggested areas of attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.weekAheadSuggestions.map((suggestion, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium">{suggestion.focusArea}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
                  <p className="text-sm italic">{suggestion.guidance}</p>
                </div>
              ))}
              {insights.weekAheadSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Continue with your current journaling practice.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nova's Observation */}
      <Card>
        <CardHeader>
          <CardTitle>Nova&apos;s Weekly Observation</CardTitle>
          <CardDescription>
            Analyzed {insights.entryCount} {insights.entryCount === 1 ? 'entry' : 'entries'} from this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {insights.novaObservation}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
