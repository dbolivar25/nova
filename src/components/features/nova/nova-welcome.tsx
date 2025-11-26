"use client"

import { useState } from "react"
import { Textarea } from "@/components/shared/ui/textarea"
import { Button } from "@/components/shared/ui/button"
import { Send } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface NovaWelcomeProps {
  onSendMessage: (message: string) => void
  isStreaming: boolean
}

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

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-center justify-center pb-32">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome to Nova
          </h1>
          <p className="mt-2 text-muted-foreground">
            How can I help you today?
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div
              className={cn(
                "flex-1 rounded-xl transition-all duration-200",
                "bg-muted/40 border border-border/50",
                "focus-within:bg-muted/60 focus-within:border-primary/30"
              )}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Nova..."
                className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:outline-none"
                disabled={isStreaming}
                rows={1}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl"
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
