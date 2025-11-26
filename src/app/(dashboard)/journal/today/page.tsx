"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { Textarea } from "@/components/shared/ui/textarea"
import { Button } from "@/components/shared/ui/button"
import { Progress } from "@/components/shared/ui/progress"
import { Badge } from "@/components/shared/ui/badge"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { EnhancedPromptCard } from "@/components/features/journal/enhanced-prompt-card"
import {
  Save,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  MessageSquare,
  Feather,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTodaysJournalEntry, useTodaysPrompts, useUpdateJournalEntry } from "@/features/journal/hooks/use-journal"
import { calculateWordCount } from "@/features/journal/api/journal"

export default function TodayPage() {
  const today = new Date()
  const [promptResponses, setPromptResponses] = useState<Record<string, string>>({})
  const [freeformEntry, setFreeformEntry] = useState("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasLoadedEntry, setHasLoadedEntry] = useState(false)
  const [isManualSaving, setIsManualSaving] = useState(false)

  const { entry, isLoading: isLoadingEntry, getOrCreateEntry } = useTodaysJournalEntry()
  const { data: prompts = [], isLoading: isLoadingPrompts } = useTodaysPrompts()
  const todayDate = format(today, "yyyy-MM-dd")
  const updateEntryMutation = useUpdateJournalEntry(todayDate)

  useEffect(() => {
    if (entry && !hasLoadedEntry) {
      setFreeformEntry(entry.freeform_text || "")
      if (entry.prompt_responses && Array.isArray(entry.prompt_responses)) {
        const responses: Record<string, string> = {}
        entry.prompt_responses.forEach((pr) => {
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
        toast.success("Entry saved")
      }
    } catch (error) {
      console.error('Failed to save:', error)
      if (showToast) {
        toast.error("Failed to save entry")
      }
    } finally {
      if (showToast) {
        setIsManualSaving(false)
      }
    }
  }, [entry, prompts, promptResponses, freeformEntry, updateEntryMutation])

  const completedPrompts = Object.values(promptResponses).filter(r => r.trim().length > 20).length
  const progress = prompts.length > 0 ? (completedPrompts / prompts.length) * 100 : 0
  const totalWords = useMemo(() => {
    const promptWords = Object.values(promptResponses).join(' ')
    const allWords = `${promptWords} ${freeformEntry}`.trim()
    return calculateWordCount(allWords)
  }, [promptResponses, freeformEntry])

  const hasContent = Object.values(promptResponses).some(r => r.trim()) || freeformEntry.trim()
  const readingTime = Math.max(1, Math.ceil(totalWords / 200))

  useEffect(() => {
    if (!hasContent || !entry) return

    const autoSaveTimer = setTimeout(() => {
      handleSave(false)
    }, 3000)

    return () => clearTimeout(autoSaveTimer)
  }, [promptResponses, freeformEntry, hasContent, entry, handleSave])

  if (isLoadingEntry || isLoadingPrompts) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Today&apos;s Reflection
            </h1>
            <p className="mt-1 text-muted-foreground">
              {format(today, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          {lastSaved && (
            <Badge variant="outline" className="font-normal text-muted-foreground border-border/60">
              <Clock className="h-3 w-3 mr-1.5" />
              Saved {format(lastSaved, "h:mm a")}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              {progress === 100 ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Target className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium">
                  {completedPrompts} of {prompts.length} prompts
                </p>
                {progress === 100 && (
                  <Badge className="bg-primary/10 text-primary border-0">
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalWords} words · ~{readingTime} min read
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Prompts Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Feather className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl font-semibold">Reflection Prompts</h2>
        </div>

        <div className="space-y-4">
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
      </div>

      {/* Freeform Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-serif text-xl font-semibold">Open Reflection</h2>
          </div>
          <Badge variant="outline" className="font-normal text-muted-foreground border-border/60">
            Optional
          </Badge>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-1">
          <Textarea
            value={freeformEntry}
            onChange={(e) => setFreeformEntry(e.target.value)}
            placeholder="What else is on your mind? This is your space to write freely about anything that moved you today..."
            className="min-h-[180px] resize-none border-0 bg-transparent p-5 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 -mx-6 mt-8 border-t border-border/40 bg-background/95 px-6 py-4 backdrop-blur-sm sm:-mx-0 sm:rounded-2xl sm:border sm:border-border/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!hasContent}
              asChild
              className="flex-1 sm:flex-none rounded-xl border-border/60"
            >
              <Link href="/nova">
                <MessageSquare className="h-4 w-4 mr-2" />
                Discuss with Nova
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 sm:flex-none rounded-xl border-border/60"
            >
              <Link href="/journal">
                <Calendar className="h-4 w-4 mr-2" />
                History
              </Link>
            </Button>
          </div>

          <Button
            onClick={() => handleSave(true)}
            disabled={!hasContent || isManualSaving}
            className="rounded-xl h-11 px-6"
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
