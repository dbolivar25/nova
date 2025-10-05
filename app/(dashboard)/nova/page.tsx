"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/nova/chat-message"
import { NovaChatSidebarLayout, NovaChatContext } from "@/components/nova/nova-chat-sidebar-layout"
import { NovaWelcome } from "@/components/nova/nova-welcome"
import { Send, Sparkles } from "lucide-react"
import { useNovaChat } from "@/hooks/use-nova-chat"
import { useContext } from "react"

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

  // These are handled by the global context now
  // No need for local handlers

  const handleWelcomeMessage = async (message: string) => {
    await sendMessage(message)
  }

  // Determine if we should show the welcome screen
  const showWelcome = messages.length === 0 && !currentChatId && !isLoadingHistory

  return (
    <NovaChatSidebarLayout.PageProvider>
      <div className="flex h-full min-h-0 flex-col">
        {showWelcome ? (
          <NovaWelcome
            onSendMessage={handleWelcomeMessage}
            isStreaming={isStreaming}
          />
        ) : (
          <>
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 min-h-0 px-4 mb-4"
            >
                <div className="space-y-6 pb-4 max-w-4xl mx-auto">
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
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="px-4 pb-4">
              <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Continue the conversation..."
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
          </>
        )}
      </div>
    </NovaChatSidebarLayout.PageProvider>
  )
}
