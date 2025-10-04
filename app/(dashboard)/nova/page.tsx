"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/nova/chat-message"
import { Send, Sparkles } from "lucide-react"
import { useNovaChat } from "@/hooks/use-nova-chat"

const initialMessage = {
  id: "1",
  role: "assistant" as const,
  content: "Hello! I'm Nova, your AI companion for reflection and growth. I've been reading your journal entries and I'm here to help you explore your thoughts, identify patterns, and support your personal development journey.\n\nWhat would you like to talk about today?",
}

export default function NovaPage() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, isStreaming, currentResponse } = useNovaChat({
    onComplete: () => {
      textareaRef.current?.focus()
    },
  })

  // Add initial message if no messages yet - memoized to prevent useEffect dependency changes
  const displayMessages = useMemo(
    () => (messages.length === 0 ? [initialMessage] : messages),
    [messages]
  )

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [displayMessages, currentResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const messageText = input.trim()
    setInput("")
    await sendMessage(messageText)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Nova</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Your AI companion for personal growth and reflection
        </p>
      </div>

      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 pr-4 mb-4"
      >
        <div className="space-y-6 pb-4">
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              sources={'sources' in message ? message.sources : undefined}
            />
          ))}

          {/* Show streaming response */}
          {isStreaming && currentResponse && (
            <ChatMessage
              role="assistant"
              content={currentResponse}
              isStreaming={true}
            />
          )}

          {/* Show loading indicator when waiting */}
          {isStreaming && !currentResponse && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="h-2 w-24 bg-muted animate-pulse rounded" />
                <div className="h-2 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your thoughts with Nova..."
          className="min-h-[80px] pr-12 resize-none"
          disabled={isStreaming}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-2 right-2"
          disabled={!input.trim() || isStreaming}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}