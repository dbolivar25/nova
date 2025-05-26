"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

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
    <div className="grid md:grid-cols-[1fr_350px] gap-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Journal History</h1>
          <p className="text-muted-foreground">
            Browse and revisit your past journal entries
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border w-full"
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
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-semibold">{mockEntries.length}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
              <Separator />
              <div>
                <p className="text-2xl font-semibold">
                  {Math.round(mockEntries.reduce((acc, e) => acc + e.wordCount, 0) / mockEntries.length)}
                </p>
                <p className="text-sm text-muted-foreground">Average Words per Entry</p>
              </div>
              <Separator />
              <div>
                <p className="text-2xl font-semibold">4</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {mockEntries.slice(0, 5).map((entry, index) => (
                  <div key={index}>
                    <Link 
                      href={`/journal/${format(entry.date, "yyyy-MM-dd")}`}
                      className="block p-2 -mx-2 rounded hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">
                        {format(entry.date, "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.wordCount} words
                      </p>
                    </Link>
                    {index < mockEntries.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}