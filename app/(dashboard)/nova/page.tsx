"use client"

import { useState, useRef, useEffect, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatMessage } from "@/components/nova/chat-message"
import { NovaChatSidebarLayout, NovaChatContext } from "@/components/nova/nova-chat-sidebar-layout"
import { NovaWelcome } from "@/components/nova/nova-welcome"
import { Send, Sparkles } from "lucide-react"
import { useNovaChat } from "@/hooks/use-nova-chat"

export default function NovaPage() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get current chat ID from global context
  const context = useContext(NovaChatContext)
  const currentChatId = context?.currentChatId

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
    <NovaChatSidebarLayout.PageProvider>
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

            {/* Input area - cleaner, more minimal */}
            <div className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur">
              <div className="max-w-4xl mx-auto px-6 py-3">
                <form onSubmit={handleSubmit} className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="min-h-[52px] max-h-[200px] pr-12 resize-none
                      border-muted-foreground/20 focus:border-muted-foreground/30
                      rounded-xl transition-colors"
                    disabled={isStreaming}
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
        )}
      </div>
    </NovaChatSidebarLayout.PageProvider>
  )
}