"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/shared/ui/button"
import { Textarea } from "@/components/shared/ui/textarea"
import { ChatMessage } from "@/components/features/nova/chat-message"
import { useNovaChatContext } from "@/components/features/nova/nova-chat-sidebar-layout"
import { NovaWelcome } from "@/components/features/nova/nova-welcome"
import { Send, Sparkles } from "lucide-react"
import { useNovaChat } from "@/features/nova/hooks/use-nova-chat"
import { cn } from "@/shared/lib/utils"

export default function NovaPage() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { currentChatId, setCurrentChatId: setContextChatId, refreshChats } = useNovaChatContext()

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
      void refreshChats({ silent: true })
    },
    onChatCreated: (chatId) => {
      setContextChatId(chatId)
      void refreshChats({ silent: true })
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
          {/* Messages area */}
          <div
            ref={scrollAreaRef}
            className="absolute inset-x-0 top-0 bottom-[100px] overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                    <span className="font-medium">Loading conversation...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      sources={"sources" in message ? message.sources : undefined}
                    />
                  ))}

                  {isStreaming && currentResponse && (
                    <ChatMessage
                      role="assistant"
                      content={currentResponse}
                      isStreaming={true}
                    />
                  )}

                  {isStreaming && !currentResponse && (
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "150ms" }} />
                          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share a thought with Nova..."
                    className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-5 py-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:outline-none"
                    disabled={isStreaming}
                    rows={1}
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
        </>
      )}
    </div>
  )
}
