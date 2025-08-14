"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Brain, Heart, Target } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state for now (will be replaced with real data fetching)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Weekly Insights"
        subtitle="Personalized analysis and patterns from your journal entries"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            {/* Loading skeletons for the 4 cards */}
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
          </>
        ) : (
          <>
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
                    <Badge variant="secondary">Positive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This week showed a gradual improvement in your emotional state, 
                    with particularly positive entries on Tuesday and Friday.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Key Themes
                </CardTitle>
                <CardDescription>Topics that emerged this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Personal Growth</Badge>
                  <Badge>Relationships</Badge>
                  <Badge>Career Goals</Badge>
                  <Badge>Self-Care</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Growth Moments
                </CardTitle>
                <CardDescription>Breakthroughs and realizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You had a significant realization about setting boundaries in relationships, 
                  and took concrete steps to implement them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Week Ahead Focus
                </CardTitle>
                <CardDescription>Suggested area of attention</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Consider exploring your feelings around career transitions more deeply. 
                  Your entries suggest unresolved questions about your professional path.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nova&apos;s Weekly Observation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              This feature will be available once you&apos;ve journaled for a full week. 
              Nova will provide personalized insights based on your journal entries, 
              helping you identify patterns and opportunities for growth.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}