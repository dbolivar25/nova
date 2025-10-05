"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

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

      {/* Input area - same as chat view */}
      <div className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="min-h-[52px] max-h-[200px] pr-12 resize-none
                border-muted-foreground/20 focus:border-muted-foreground/30
                rounded-xl transition-colors"
              disabled={isStreaming}
              autoFocus
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg
                hover:bg-muted transition-colors"
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