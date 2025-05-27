"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

// Mock data - will be replaced with Supabase data
const mockEntries = [
  { date: new Date(2025, 4, 20), hasEntry: true, wordCount: 324 },
  { date: new Date(2025, 4, 22), hasEntry: true, wordCount: 512 },
  { date: new Date(2025, 4, 24), hasEntry: true, wordCount: 189 },
  { date: new Date(2025, 4, 26), hasEntry: true, wordCount: 756 },
]

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const entriesInMonth = mockEntries.filter(entry => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return entry.date >= monthStart && entry.date <= monthEnd
  })

  const selectedEntry = selectedDate 
    ? mockEntries.find(entry => isSameDay(entry.date, selectedDate))
    : null

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Journal History"
        subtitle="Browse and revisit your past journal entries"
      />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Calendar Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-xl border"
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
            </CardContent>
          </Card>

          {/* Selected Entry Preview */}
          {selectedEntry && selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {selectedEntry.wordCount} words
                    </Badge>
                    <Button asChild>
                      <Link href={`/journal/${format(selectedDate, "yyyy-MM-dd")}`}>
                        View Entry
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click &ldquo;View Entry&rdquo; to read your full journal entry from this day.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Entries List - Now in main area */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {mockEntries.slice(0, 9).map((entry, index) => (
                  <Link 
                    key={index}
                    href={`/journal/${format(entry.date, "yyyy-MM-dd")}`}
                    className="group p-4 rounded-xl border bg-card hover:bg-accent hover:shadow-lg transition-all"
                  >
                    <div className="space-y-2">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {format(entry.date, "MMM d, yyyy")}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{entry.wordCount} words</span>
                        <Badge variant="outline" className="text-xs">
                          View
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
              <div className="grid gap-4">
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{mockEntries.length}</p>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {Math.round(mockEntries.reduce((acc, e) => acc + e.wordCount, 0) / mockEntries.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Words</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-3xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Day Streak 🔥</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Writing Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Most productive day</span>
                <Badge variant="secondary">Thursday</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Favorite time</span>
                <Badge variant="secondary">Evening</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total words</span>
                <Badge variant="secondary">
                  {mockEntries.reduce((acc, e) => acc + e.wordCount, 0).toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}