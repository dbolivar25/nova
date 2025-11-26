"use client"

import { useState } from "react"
import { Textarea } from "@/components/shared/ui/textarea"
import { Button } from "@/components/shared/ui/button"
import { Send, Sparkles, BookOpen, Brain, Heart } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface NovaWelcomeProps {
  onSendMessage: (message: string) => void
  isStreaming: boolean
}

const suggestions = [
  {
    icon: BookOpen,
    text: "What themes have emerged in my recent entries?",
  },
  {
    icon: Brain,
    text: "Help me understand patterns in my writing",
  },
  {
    icon: Heart,
    text: "What moments of growth have you noticed?",
  },
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleSuggestionClick = (text: string) => {
    if (isStreaming) return
    onSendMessage(text)
  }

  return (
    <div className="relative h-full">
      {/* Welcome content */}
      <div className="absolute inset-0 flex items-center justify-center pb-40">
        <div className="max-w-lg px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Welcome to Nova
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            I&apos;m here to help you explore your journal and uncover insights. What would you like to reflect on?
          </p>

          {/* Suggestion buttons */}
          <div className="mt-8 space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                onClick={() => handleSuggestionClick(suggestion.text)}
                disabled={isStreaming}
                className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-card/80 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-primary/10">
                  <suggestion.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <span className="text-sm text-foreground">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="absolute inset-x-0 bottom-0 border-t border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div
              className={cn(
                "flex-1 rounded-2xl transition-all duration-200",
                "bg-muted/30 border border-border/40",
                "focus-within:bg-muted/50 focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5"
              )}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share a thought with Nova..."
                className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-5 py-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:outline-none"
                disabled={isStreaming}
                rows={1}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="icon"
              className={cn(
                "h-[52px] w-[52px] shrink-0 rounded-xl transition-all duration-200",
                "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                "hover:scale-105 hover:shadow-xl hover:shadow-primary/25",
                "disabled:opacity-40 disabled:hover:scale-100"
              )}
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground/60">
            Nova uses your journal entries to provide personalized insights
          </p>
        </div>
      </div>
    </div>
  )
}
