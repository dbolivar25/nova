"use client"

import { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronRight, CalendarDays } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useJournalEntries, useJournalStats } from "@/hooks/use-journal"
import type { JournalEntry } from "@/lib/types/journal"

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Fetch entries for the current month
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd")
  const { data: entriesData, isLoading: isLoadingEntries } = useJournalEntries(
    100, // limit
    0,   // offset
    monthStart,
    monthEnd
  )
  const entries = useMemo(() => entriesData?.entries || [], [entriesData?.entries])

  // Fetch journal stats
  const { data: stats, isLoading: isLoadingStats } = useJournalStats()

  // Get entries for calendar display
  const entriesInMonth = useMemo(() => {
    return entries.map(entry => ({
      date: parseISO(entry.entry_date),
      hasEntry: true,
      wordCount: entry.word_count || 0,
      id: entry.id,
      mood: entry.mood
    }))
  }, [entries])

  // Find selected entry
  const selectedEntry = selectedDate 
    ? entriesInMonth.find(entry => isSameDay(entry.date, selectedDate))
    : null

  // Calculate streak
  const calculateStreak = () => {
    if (!entries.length) return 0
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )
    
    let streak = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if most recent entry is today or yesterday
    const mostRecent = new Date(sortedEntries[0].entry_date)
    mostRecent.setHours(0, 0, 0, 0)
    const daysDiff = differenceInDays(today, mostRecent)
    
    if (daysDiff > 1) return 0 // Streak broken
    
    // Count consecutive days
    for (let i = 1; i < sortedEntries.length; i++) {
      const current = new Date(sortedEntries[i].entry_date)
      const previous = new Date(sortedEntries[i - 1].entry_date)
      current.setHours(0, 0, 0, 0)
      previous.setHours(0, 0, 0, 0)
      
      const diff = differenceInDays(previous, current)
      if (diff === 1) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const currentStreak = calculateStreak()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Journal History"
        subtitle="Browse and revisit your past journal entries"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Calendar Card with Selected Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[auto_1fr]">
                <div className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-xl border-0"
                    modifiers={{
                      hasEntry: entriesInMonth.map(e => e.date)
                    }}
                    modifiersStyles={{
                      hasEntry: {
                        fontWeight: "bold",
                        textDecoration: "underline",
                        textUnderlineOffset: "4px",
                      }
                    }}
                  />
                </div>
                
                {/* Selected Entry Preview - Right Side */}
                <div className="border-l p-6 min-h-[320px] flex flex-col">
                  {selectedEntry && selectedDate ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-xl">
                            {format(selectedDate, "EEEE")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(selectedDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Words written</span>
                            <span className="font-medium">{selectedEntry.wordCount}</span>
                          </div>
                          {selectedEntry.mood && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Mood</span>
                              <Badge variant="secondary" className="capitalize">
                                {selectedEntry.mood}
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Reading time</span>
                            <span className="font-medium">~{Math.max(1, Math.ceil(selectedEntry.wordCount / 200))} min</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 mt-auto">
                        <Button className="w-full" asChild>
                          <Link href={`/journal/${format(selectedDate, "yyyy-MM-dd")}`}>
                            View Full Entry
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : selectedDate ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-medium text-lg">
                            {format(selectedDate, "EEEE")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(selectedDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                        <Separator className="my-4" />
                        <p className="text-sm text-muted-foreground">
                          No journal entry for this date
                        </p>
                        {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
                          <Button asChild>
                            <Link href="/journal/today">
                              Write Today&apos;s Entry
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-2 px-4">
                        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Select a date to view entry details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries List - Now in main area */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No journal entries yet.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/journal/today">
                      Start Your First Entry
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {entries.slice(0, 9).map((entry) => (
                    <Link 
                      key={entry.id}
                      href={`/journal/${entry.entry_date}`}
                      className="group p-4 rounded-xl border bg-card hover:bg-accent hover:shadow-lg transition-all"
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {entry.word_count || 0} words
                          </span>
                          {entry.mood && (
                            <Badge variant="outline" className="text-xs">
                              {entry.mood}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats || isLoadingEntries ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Separator />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Separator />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats?.totalEntries || entries.length}</p>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">
                      {stats?.averageWordCount || 
                        (entries.length > 0 
                          ? Math.round(entries.reduce((acc, e) => acc + (e.word_count || 0), 0) / entries.length)
                          : 0)
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Words</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats?.currentStreak || currentStreak}</p>
                    <p className="text-sm text-muted-foreground">Day Streak {currentStreak > 0 ? '🔥' : ''}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Writing Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingStats || isLoadingEntries ? (
                <>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most productive day</span>
                    <Badge variant="secondary">
                      {entries.length > 0 ? getDayWithMostEntries(entries) : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Favorite time</span>
                    <Badge variant="secondary">
                      {entries.length > 0 ? getMostCommonWritingTime(entries) : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total words</span>
                    <Badge variant="secondary">
                      {stats?.totalWordCount || 
                        entries.reduce((acc, e) => acc + (e.word_count || 0), 0).toLocaleString()
                      }
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getDayWithMostEntries(entries: JournalEntry[]): string {
  const dayCounts: Record<string, number> = {}
  
  entries.forEach(entry => {
    const day = format(parseISO(entry.entry_date), "EEEE")
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  
  const sortedDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])
  return sortedDays[0]?.[0] || "N/A"
}

function getMostCommonWritingTime(entries: JournalEntry[]): string {
  const timeCounts: Record<string, number> = {}
  
  entries.forEach(entry => {
    const hour = new Date(entry.created_at || entry.entry_date).getHours()
    let timeOfDay: string
    
    if (hour < 6) timeOfDay = "Night"
    else if (hour < 12) timeOfDay = "Morning"
    else if (hour < 17) timeOfDay = "Afternoon"
    else if (hour < 21) timeOfDay = "Evening"
    else timeOfDay = "Night"
    
    timeCounts[timeOfDay] = (timeCounts[timeOfDay] || 0) + 1
  })
  
  const sortedTimes = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])
  return sortedTimes[0]?.[0] || "N/A"
}