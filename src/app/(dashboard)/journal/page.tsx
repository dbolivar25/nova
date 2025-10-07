"use client"

import { useState, useMemo } from "react"
import { Calendar } from "@/components/shared/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { Badge } from "@/components/shared/ui/badge"
import { Separator } from "@/components/shared/ui/separator"
import { Button } from "@/components/shared/ui/button"
import { ChevronRight, CalendarDays, TrendingUp, BarChart3, Clock } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/page-header"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { useJournalEntries, useJournalStats } from "@/features/journal/hooks/use-journal"
import type { JournalEntry } from "@/features/journal/types/journal"

interface CalendarEntry {
  date: Date
  hasEntry: boolean
  wordCount: number
  id: string
  mood: string | null
}

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

  // Use entries from the API
  const entries = useMemo(() => {
    return entriesData?.entries || []
  }, [entriesData?.entries])

  // Fetch journal stats
  const { data: stats, isLoading: isLoadingStats } = useJournalStats()

  // Get entries for calendar display
  const entriesInMonth = useMemo((): CalendarEntry[] => {
    return entries.map((entry: JournalEntry) => ({
      date: parseISO(entry.entry_date),
      hasEntry: true,
      wordCount: entry.word_count || 0,
      id: entry.id,
      mood: entry.mood
    }))
  }, [entries])

  // Find selected entry
  const selectedEntry = selectedDate 
    ? entriesInMonth.find((entry: CalendarEntry) => isSameDay(entry.date, selectedDate))
    : null

  // Helper functions
  const getDayWithMostEntries = (entries: JournalEntry[]): string => {
    if (!entries.length) return "N/A"
    const dayCounts: Record<string, number> = {}
    
    entries.forEach(entry => {
      const day = format(parseISO(entry.entry_date), "EEEE")
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    
    const sortedDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])
    return sortedDays[0]?.[0] || "N/A"
  }

  const getMostCommonWritingTime = (entries: JournalEntry[]): string => {
    if (!entries.length) return "N/A"
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Journal History"
        subtitle="Browse and revisit your past journal entries"
      />


      {/* Main Content - Mobile Responsive */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Calendar and Entries Section */}
        <div className="space-y-6">
          {/* Calendar Card - Responsive */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Stack on mobile, side-by-side on desktop */}
              <div className="grid md:grid-cols-[auto_1fr]">
                <div className="p-4 md:p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-xl"
                    modifiers={{
                      hasEntry: entriesInMonth.map((e: CalendarEntry) => e.date)
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
                
                {/* Selected Entry Preview - Hidden on mobile if no selection */}
                <div className={`border-t md:border-t-0 md:border-l p-6 ${!selectedDate ? 'hidden md:flex' : 'flex'} flex-col`}>
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
                    <div className="h-full flex items-center justify-center min-h-[200px]">
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

          {/* All Entries - Responsive Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Entries</CardTitle>
                <Badge variant="outline">{entries.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No journal entries for this month.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/journal/today">
                      Start Writing Today
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry: JournalEntry) => (
                    <Link 
                      key={entry.id}
                      href={`/journal/${entry.entry_date}`}
                      className="group p-4 rounded-xl border bg-card hover:bg-accent hover:shadow-md transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {format(parseISO(entry.entry_date), "EEEE")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          {entry.mood && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {entry.mood}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{entry.word_count || 0} words</span>
                          <Clock className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats - Hidden on mobile */}
        <div className="hidden lg:block space-y-6 w-80">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Journal Stats
              </CardTitle>
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
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{stats?.totalEntries || entries.length}</p>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">
                      {stats?.averageWordCount || 
                        (entries.length > 0 
                          ? Math.round(entries.reduce((acc: number, e: JournalEntry) => acc + (e.word_count || 0), 0) / entries.length)
                          : 0)
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Words</p>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{stats?.currentStreak || 0}</p>
                    <p className="text-sm text-muted-foreground">
                      Day Streak {(stats?.currentStreak || 0) > 0 ? '🔥' : ''}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Writing Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Writing Insights
              </CardTitle>
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
                      {getDayWithMostEntries(entries)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Favorite time</span>
                    <Badge variant="secondary">
                      {getMostCommonWritingTime(entries)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total words</span>
                    <Badge variant="secondary">
                      {stats?.totalWordCount || 
                        entries.reduce((acc: number, e: JournalEntry) => acc + (e.word_count || 0), 0).toLocaleString()
                      }
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Stats - Only shown on mobile */}
      <div className="grid gap-4 lg:hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats?.totalEntries || 0}</p>
                <p className="text-xs text-muted-foreground">Entries</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.averageWordCount || 0}</p>
                <p className="text-xs text-muted-foreground">Avg Words</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}