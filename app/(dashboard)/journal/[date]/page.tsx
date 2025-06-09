"use client"

import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"
import { useJournalEntryByDate } from "@/hooks/use-journal"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MessageSquare, Edit } from "lucide-react"

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
        <PageHeader 
          title="Error Loading Entry"
          subtitle="Something went wrong"
        />
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
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="No Entry Found"
          subtitle={format(parseISO(date), "EEEE, MMMM d, yyyy")}
        />
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

  const wordCount = entry.word_count || 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))
  const hasPromptResponses = entry.prompt_responses && entry.prompt_responses.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader 
          title={format(parseISO(date), "EEEE, MMMM d, yyyy")}
          subtitle="Journal Entry"
          className="mb-0"
        />
        {date === format(new Date(), "yyyy-MM-dd") && (
          <Button variant="outline" asChild>
            <Link href="/journal/today">
              <Edit className="h-4 w-4 mr-2" />
              Edit Entry
            </Link>
          </Button>
        )}
      </div>

      {/* Entry Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(date), "PPP")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{wordCount} words • {readingTime} min read</span>
            </div>
            {entry.mood && (
              <Badge variant="secondary">
                {entry.mood}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prompt Responses */}
      {hasPromptResponses && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Reflection Prompts</h2>
          {entry.prompt_responses!.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  {response.prompt?.prompt_text || "Prompt"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {response.response_text || <span className="text-muted-foreground italic">No response</span>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Freeform Entry */}
      {entry.freeform_text && (
        <>
          {hasPromptResponses && <Separator className="my-8" />}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Open Reflection</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">
                  {entry.freeform_text}
                </p>
              </CardContent>
            </Card>
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