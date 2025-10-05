"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatMessage } from "@/components/nova/chat-message"
import { useNovaChatContext } from "@/components/nova/nova-chat-sidebar-layout"
import { NovaWelcome } from "@/components/nova/nova-welcome"
import { Send, Sparkles } from "lucide-react"
import { useNovaChat } from "@/hooks/use-nova-chat"
import { cn } from "@/lib/utils"

export default function NovaPage() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get current chat ID from global context
  const { currentChatId } = useNovaChatContext()

  const {
    messages,
    sendMessage,
    isStreaming,
    currentResponse,
    isLoadingHistory,
  } = useNovaChat({
    chatId: currentChatId,
    onComplete: () => {
      textareaRef.current?.focus()
    },
  })

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, currentResponse])

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

  const handleWelcomeMessage = async (message: string) => {
    await sendMessage(message)
  }

  // Determine if we should show the welcome screen
  const showWelcome = messages.length === 0 && !currentChatId && !isLoadingHistory

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
        {showWelcome ? (
          <NovaWelcome
            onSendMessage={handleWelcomeMessage}
            isStreaming={isStreaming}
          />
        ) : (
          <>
            {/* Messages area - scrollable with wider content */}
            <div
              ref={scrollAreaRef}
              className="absolute inset-x-0 top-0 bottom-[76px] overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto px-6 py-6">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <span>Loading conversation...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
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
                      <div className="mb-8">
                        <div className="space-y-2">
                          <div className="h-2 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-2 w-32 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Input area - elevated glass design */}
            <div className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-background/80">
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
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send a thought to Nova..."
                      className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none"
                      disabled={isStreaming}
                      rows={1}
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
        )}
    </div>
  )
}