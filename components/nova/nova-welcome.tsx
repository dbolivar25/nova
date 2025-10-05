"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface NovaWelcomeProps {
  onSendMessage: (message: string) => void
  isStreaming: boolean
}

const SUGGESTIONS = [
  { label: "Feelings", prompt: "How am I feeling this week?" },
  { label: "Patterns", prompt: "What patterns do you see in my entries?" },
  { label: "Reflection", prompt: "Help me reflect on today" },
]

export function NovaWelcome({ onSendMessage, isStreaming }: NovaWelcomeProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const message = input.trim()
    setInput("")
    onSendMessage(message)
  }

  const handleSuggestionClick = (prompt: string) => {
    if (isStreaming) return
    onSendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
      {/* Welcome header */}
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-3xl font-semibold mb-3">Welcome to Nova</h2>
        <p className="text-muted-foreground">
          I'm here to help you. Ask me anything about your journal, feelings, or reflection.
        </p>
      </div>

      {/* Search/input section */}
      <div className="w-full space-y-6">
        <form onSubmit={handleSubmit} className="w-full relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask or search for anything from your journal..."
            className="h-14 text-base pr-12"
            disabled={isStreaming}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Suggestion buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {SUGGESTIONS.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.prompt)}
              disabled={isStreaming}
              variant="outline"
              size="lg"
              className="rounded-full px-6"
            >
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
