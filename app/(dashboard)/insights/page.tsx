import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Brain, Heart, Target } from "lucide-react"

export default function InsightsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Weekly Insights</h1>
        <p className="text-muted-foreground">
          Personalized analysis and patterns from your journal entries
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
      </div>

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
    </div>
  )
}