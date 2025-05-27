"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/nova/chat-message"
import { Send, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: Array<{
    date: string
    excerpt: string
  }>
}

const initialMessage: Message = {
  id: "1",
  role: "assistant",
  content: "Hello! I'm Nova, your AI companion for reflection and growth. I've been reading your journal entries and I'm here to help you explore your thoughts, identify patterns, and support your personal development journey.\n\nWhat would you like to talk about today?",
  timestamp: new Date(),
}

export default function NovaPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // TODO: Integrate with BAML for AI responses
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand you're exploring that thought. Based on your recent journal entries, I notice you've been reflecting on similar themes. Let me share some insights...\n\nThis is a placeholder response. Once integrated with BAML, I'll provide personalized insights based on your journal history.",
        timestamp: new Date(),
        sources: [
          {
            date: "May 24, 2025",
            excerpt: "I've been thinking about growth and what it means to truly change..."
          }
        ]
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {  
      toast.error("Failed to get response from Nova")
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
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
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              sources={message.sources}
            />
          ))}
          
          {isLoading && (
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
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-2 right-2"
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}