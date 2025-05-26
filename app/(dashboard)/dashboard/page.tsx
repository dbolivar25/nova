"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PromptCard } from "@/components/journal/prompt-card"
import { getRandomPrompts } from "@/lib/prompts"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const today = new Date()
  const [prompts, setPrompts] = useState<string[]>([])
  const [promptResponses, setPromptResponses] = useState<Record<number, string>>({})
  const [freeformEntry, setFreeformEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Get random prompts for today
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
    // TODO: Save to Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Journal entry saved successfully")
    setIsSaving(false)
  }

  const hasContent = Object.values(promptResponses).some(r => r.trim()) || freeformEntry.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Good {getGreeting()}</h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Today&apos;s Reflections</h2>
        {prompts.map((prompt, index) => (
          <PromptCard
            key={index}
            prompt={prompt}
            value={promptResponses[index] || ""}
            onChange={(value) => handlePromptChange(index, value)}
            index={index}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={freeformEntry}
            onChange={(e) => setFreeformEntry(e.target.value)}
            placeholder="What else is on your mind today?"
            className="min-h-[200px] resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="lg"
          disabled={!hasContent}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Talk to Nova
        </Button>

        <Button
          size="lg"
          onClick={handleSave}
          disabled={!hasContent || isSaving}
        >
          {isSaving ? "Saving..." : "Save Entry"}
        </Button>
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