"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <>
      {/* Welcome content - centered with more space */}
      <div className="absolute inset-0 flex items-center justify-center pb-32">
        <div className="text-center">
          <h1 className="text-4xl font-light mb-3">Welcome to Nova</h1>
          <p className="text-muted-foreground text-lg font-light">
            How can I help you today?
          </p>
        </div>
      </div>

      {/* Input area - elevated glass design */}
      <div className="absolute inset-x-0 bottom-0 pb-8 md:pb-0 backdrop-blur-md bg-background/80">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div
              className={cn(
                "flex-1 rounded-2xl transition-all duration-200",
                "bg-muted/40 border border-border/30 shadow-sm",
                "focus-within:bg-muted/60 focus-within:shadow-md focus-within:border-border/50"
              )}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a thought to Nova..."
                className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none"
                disabled={isStreaming}
                rows={1}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-150",
                "hover:scale-105 hover:shadow-md disabled:opacity-40"
              )}
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}