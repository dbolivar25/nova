"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import Link from "next/link"
import { 
  ArrowRight, 
  ChartBar, 
  MessageSquare, 
  PenLine, 
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Brain
} from "lucide-react"

// Mock data for recent entries
const recentEntries = [
  { date: new Date(2025, 4, 25), wordCount: 324, mood: "positive" },
  { date: new Date(2025, 4, 24), wordCount: 512, mood: "neutral" },
  { date: new Date(2025, 4, 23), wordCount: 189, mood: "positive" },
  { date: new Date(2025, 4, 22), wordCount: 756, mood: "thoughtful" },
  { date: new Date(2025, 4, 21), wordCount: 423, mood: "grateful" },
]

const novaSuggestions = [
  "Help me reflect on today",
  "What patterns do you see in my journal?",
  "Guide me through a difficult situation",
  "Analyze my emotional growth this week",
]

export default function DashboardPage() {
  const { user } = useUser()
  const [novaInput, setNovaInput] = useState("")
  const today = new Date()
  const currentStreak = 5
  const todayProgress = 33 // percentage of today's entry completed

  const greeting = getGreeting()
  const firstName = user?.firstName || "there"

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">
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
            <div className="grid grid-cols-2 gap-2">
              {novaSuggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start text-left h-auto p-3 hover:bg-primary/5"
                  asChild
                >
                  <Link href={`/nova?prompt=${encodeURIComponent(suggestion)}`}>
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
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
                <Link href={`/nova${novaInput ? `?prompt=${encodeURIComponent(novaInput)}` : ""}`}>
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
            <Progress value={todayProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {todayProgress === 0 
                ? "Start your daily reflection"
                : `You've answered ${Math.floor(todayProgress / 33)} of 3 prompts`
              }
            </p>
            <Button className="w-full" asChild>
              <Link href="/journal/today">
                {todayProgress === 0 ? "Begin Writing" : "Continue Writing"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
            <div className="space-y-4">
              {recentEntries.slice(0, 4).map((entry, i) => (
                <Link
                  key={i}
                  href={`/journal/${format(entry.date, "yyyy-MM-dd")}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(entry.date, "MMM d")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.wordCount} words
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {entry.mood}
                  </Badge>
                </Link>
              ))}
            </div>
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
                </div>
              <div>
                <p className="text-2xl font-bold">
                  {recentEntries.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm">Consistency improving</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Deep reflection mode</span>
              </div>
            </div>
            </div>
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
              <Badge variant="secondary">New</Badge>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}