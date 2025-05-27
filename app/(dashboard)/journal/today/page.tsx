"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EnhancedPromptCard } from "@/components/journal/enhanced-prompt-card"
import { getRandomPrompts } from "@/lib/prompts"
import { 
  Sparkles, 
  Save, 
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

export default function TodayPage() {
  const today = new Date()
  const [prompts, setPrompts] = useState<string[]>([])
  const [promptResponses, setPromptResponses] = useState<Record<number, string>>({})
  const [freeformEntry, setFreeformEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    const todaysPrompts = getRandomPrompts(3)
    setPrompts(todaysPrompts)
  }, [])

  const handlePromptChange = (index: number, value: string) => {
    setPromptResponses(prev => ({
      ...prev,
      [index]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastSaved(new Date())
    toast.success("Journal entry saved successfully")
    setIsSaving(false)
  }

  // Calculate progress and stats
  const completedPrompts = Object.values(promptResponses).filter(r => r.trim().length > 20).length
  const progress = (completedPrompts / prompts.length) * 100
  const totalWords = useMemo(() => {
    const promptWords = Object.values(promptResponses).join(' ')
    const allWords = `${promptWords} ${freeformEntry}`.trim()
    return allWords.split(/\s+/).filter(Boolean).length
  }, [promptResponses, freeformEntry])
  
  const hasContent = Object.values(promptResponses).some(r => r.trim()) || freeformEntry.trim()
  const readingTime = Math.max(1, Math.ceil(totalWords / 200))

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
            key={index}
            prompt={prompt}
            value={promptResponses[index] || ""}
            onChange={(value) => handlePromptChange(index, value)}
            index={index}
            isCompleted={(promptResponses[index] || "").trim().length > 20}
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 -mx-4 rounded-xl">
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
          onClick={handleSave}
          disabled={!hasContent || isSaving}
          className="sm:min-w-[150px]"
        >
          {isSaving ? (
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

      {/* Floating Nova Button */}
      <Link
        href="/nova"
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow lg:hidden"
      >
        <Sparkles className="h-6 w-6" />
      </Link>
    </div>
  )
}