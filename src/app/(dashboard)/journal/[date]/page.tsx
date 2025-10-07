"use client"

import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Badge } from "@/components/shared/ui/badge"
import { Separator } from "@/components/shared/ui/separator"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { useJournalEntryByDate } from "@/features/journal/hooks/use-journal"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Edit } from "lucide-react"

export default function JournalEntryPage() {
  const params = useParams()
  const router = useRouter()
  const date = params?.date as string

  const { data: entry, isLoading, error } = useJournalEntryByDate(date || "")

  // Validate date format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    router.push("/journal")
    return null
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Error Loading Entry</h1>
          <p className="text-sm text-muted-foreground">Something went wrong</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Failed to load journal entry. Please try again.
            </p>
            <Button className="mt-4" onClick={() => router.push("/journal")}>
              Back to Journal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">No Entry Found</h1>
          <p className="text-sm text-muted-foreground">{format(parseISO(date), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No journal entry exists for this date.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/journal")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Journal
              </Button>
              {date === format(new Date(), "yyyy-MM-dd") && (
                <Button onClick={() => router.push("/journal/today")}>
                  Write Today&apos;s Entry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate actual word count from content
  const calculateWordCount = () => {
    let count = 0

    // Count words in prompt responses
    if (entry.prompt_responses) {
      entry.prompt_responses.forEach(response => {
        if (response.response_text) {
          count += response.response_text.trim().split(/\s+/).filter(word => word.length > 0).length
        }
      })
    }

    // Count words in freeform text
    if (entry.freeform_text) {
      count += entry.freeform_text.trim().split(/\s+/).filter(word => word.length > 0).length
    }

    return count
  }

  const wordCount = calculateWordCount()
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))
  const hasPromptResponses = entry.prompt_responses && entry.prompt_responses.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{format(parseISO(date), "EEEE, MMMM d, yyyy")}</h1>
            {entry.mood && (
              <Badge variant="secondary" className="capitalize">
                {entry.mood}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {wordCount} words • {readingTime} min read
          </p>
        </div>
        {date === format(new Date(), "yyyy-MM-dd") && (
          <Button variant="outline" asChild>
            <Link href="/journal/today">
              <Edit className="h-4 w-4 mr-2" />
              Edit Entry
            </Link>
          </Button>
        )}
      </div>

      {/* Prompt Responses */}
      {hasPromptResponses && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Reflection Prompts</h2>
          <div className="space-y-6">
            {entry.prompt_responses!.map((response, index) => (
              <div key={response.id} className="space-y-2">
                <p className="text-lg font-medium text-foreground/70">
                  {response.prompt?.prompt_text || "Prompt"}
                </p>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                  {response.response_text || <span className="text-muted-foreground italic">No response</span>}
                </p>
                {index < entry.prompt_responses!.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Freeform Entry */}
      {entry.freeform_text && (
        <>
          {hasPromptResponses && <Separator className="my-6" />}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Open Reflection</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {entry.freeform_text}
            </p>
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasPromptResponses && !entry.freeform_text && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              This entry is empty.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between pt-4">
        <Button variant="outline" onClick={() => router.push("/journal")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Button>
        <Button variant="outline" asChild>
          <Link href="/nova">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuss with Nova
          </Link>
        </Button>
      </div>
    </div>
  )
}