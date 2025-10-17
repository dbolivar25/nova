"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Textarea } from "@/components/shared/ui/textarea"
import { Button } from "@/components/shared/ui/button"
import { Progress } from "@/components/shared/ui/progress"
import { Badge } from "@/components/shared/ui/badge"
import { Separator } from "@/components/shared/ui/separator"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { EnhancedPromptCard } from "@/components/features/journal/enhanced-prompt-card"
import {
  Save,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/page-header"
import { useTodaysJournalEntry, useTodaysPrompts, useUpdateJournalEntry } from "@/features/journal/hooks/use-journal"
import { calculateWordCount } from "@/features/journal/api/journal"

export default function TodayPage() {
  const today = new Date()
  const [promptResponses, setPromptResponses] = useState<Record<string, string>>({})
  const [freeformEntry, setFreeformEntry] = useState("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasLoadedEntry, setHasLoadedEntry] = useState(false)
  const [isManualSaving, setIsManualSaving] = useState(false)

  // Fetch today's journal entry and prompts
  const { entry, isLoading: isLoadingEntry, getOrCreateEntry } = useTodaysJournalEntry()
  const { data: prompts = [], isLoading: isLoadingPrompts } = useTodaysPrompts()
  const todayDate = format(today, "yyyy-MM-dd")
  const updateEntryMutation = useUpdateJournalEntry(todayDate)

  // Load existing entry data
  useEffect(() => {
    if (entry && !hasLoadedEntry) {
      setFreeformEntry(entry.freeform_text || "")
      if (entry.prompt_responses && Array.isArray(entry.prompt_responses)) {
        const responses: Record<string, string> = {}
        entry.prompt_responses.forEach((pr) => {
          // The prompt_responses includes prompt_id and response_text
          if (pr.prompt_id && pr.response_text !== null) {
            responses[pr.prompt_id] = pr.response_text
          }
        })
        setPromptResponses(responses)
      }
      setLastSaved(entry.updated_at ? new Date(entry.updated_at) : null)
      setHasLoadedEntry(true)
    }
  }, [entry, hasLoadedEntry])

  // Create entry on mount if it doesn't exist
  useEffect(() => {
    if (!isLoadingEntry && !entry) {
      getOrCreateEntry()
    }
  }, [isLoadingEntry, entry, getOrCreateEntry])

  const handlePromptChange = (promptId: string, value: string) => {
    setPromptResponses(prev => ({
      ...prev,
      [promptId]: value
    }))
  }

  const handleSave = useCallback(async (showToast = true) => {
    if (!entry) return

    if (showToast) {
      setIsManualSaving(true)
    }

    try {
      // Prepare prompt responses - include all responses, not just non-empty ones
      const promptResponsesData = prompts.map(prompt => ({
        promptId: prompt.id,
        responseText: promptResponses[prompt.id] || ""
      }))

      await updateEntryMutation.mutateAsync({
        freeformText: freeformEntry,
        promptResponses: promptResponsesData
      })

      if (showToast) {
        setLastSaved(new Date())
        toast.success("Journal entry saved successfully")
      }
    } catch (error) {
      console.error('Failed to save:', error)
      if (showToast) {
        toast.error("Failed to save journal entry")
      }
    } finally {
      if (showToast) {
        setIsManualSaving(false)
      }
    }
  }, [entry, prompts, promptResponses, freeformEntry, updateEntryMutation])

  // Calculate progress and stats
  const completedPrompts = Object.values(promptResponses).filter(r => r.trim().length > 20).length
  const progress = prompts.length > 0 ? (completedPrompts / prompts.length) * 100 : 0
  const totalWords = useMemo(() => {
    const promptWords = Object.values(promptResponses).join(' ')
    const allWords = `${promptWords} ${freeformEntry}`.trim()
    return calculateWordCount(allWords)
  }, [promptResponses, freeformEntry])
  
  const hasContent = Object.values(promptResponses).some(r => r.trim()) || freeformEntry.trim()
  const readingTime = Math.max(1, Math.ceil(totalWords / 200))

  // Auto-save functionality (silent)
  useEffect(() => {
    if (!hasContent || !entry) return

    const autoSaveTimer = setTimeout(() => {
      handleSave(false) // Silent save - no toast or visual feedback
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [promptResponses, freeformEntry, hasContent, entry, handleSave])

  if (isLoadingEntry || isLoadingPrompts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Today's Journal Entry"
            subtitle={format(today, "EEEE, MMMM d, yyyy")}
            className="mb-0"
          />
          <div className="flex items-center gap-4">
            {lastSaved && (
              <Badge variant="outline" className="font-normal">
                <Clock className="h-3 w-3 mr-1" />
                Saved {format(lastSaved, "h:mm a")}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Today&apos;s Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {completedPrompts} of {prompts.length} prompts completed
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">{totalWords} words</p>
                  <p className="text-xs text-muted-foreground">
                    ~{readingTime} min read
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Goal: 3 prompts</span>
                </div>
                {progress === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Reflection Prompts</h2>
          <Badge variant="secondary">
            {completedPrompts > 0 && `${completedPrompts} completed`}
          </Badge>
        </div>
        
        {prompts.map((prompt, index) => (
          <EnhancedPromptCard
            key={prompt.id}
            prompt={prompt.prompt_text}
            value={promptResponses[prompt.id] || ""}
            onChange={(value) => handlePromptChange(prompt.id, value)}
            index={index}
            isCompleted={(promptResponses[prompt.id] || "").trim().length > 20}
          />
        ))}
      </div>

      <Separator className="my-8" />

      {/* Open Reflection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Open Reflection</CardTitle>
            <Badge variant="outline">Optional</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={freeformEntry}
            onChange={(e) => setFreeformEntry(e.target.value)}
            placeholder="What else is on your mind today? This is your space to write freely..."
            className="min-h-[200px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-6 px-6 py-4 -mb-6 mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              disabled={!hasContent}
              asChild
            >
              <Link href="/nova">
                <MessageSquare className="h-4 w-4 mr-2" />
                Discuss with Nova
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
            >
              <Link href="/journal">
                <Calendar className="h-4 w-4 mr-2" />
                View History
              </Link>
            </Button>
          </div>

          <Button
            size="lg"
            onClick={() => handleSave(true)}
            disabled={!hasContent || isManualSaving}
            className="sm:min-w-[150px]"
          >
            {isManualSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}
