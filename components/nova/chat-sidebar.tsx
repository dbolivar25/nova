"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageSquarePlus, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatThread {
  id: string
  title: string | null
  lastMessage?: string
  updatedAt: string
  messageCount: number
}

interface ChatSidebarProps {
  currentChatId?: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  className?: string
}

export function ChatSidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const response = await fetch('/api/nova/chats')
      if (!response.ok) {
        if (response.status === 404) {
          // No chats found - this is OK
          setChats([])
          return
        }
        throw new Error('Failed to load chats')
      }

      const data = await response.json()
      setChats(data.chats || [])
    } catch (error) {
      console.error('Failed to load chats:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/nova/chats/${chatId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete chat')

      // Remove from list
      setChats(prev => prev.filter(c => c.id !== chatId))

      // If deleting current chat, start new one
      if (chatId === currentChatId) {
        onNewChat()
      }

      toast.success('Chat deleted')
    } catch (error) {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    }
  }

  const confirmDelete = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {/* Sidebar header with New Chat button */}
        <div className="p-2">
          <Button
            variant="default"
            size="sm"
            onClick={onNewChat}
            className="w-full gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          ) : (
            <div className="px-2 pb-2 space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer transition-all",
                    "hover:bg-accent/50",
                    currentChatId === chat.id && "bg-accent"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {chat.title || 'Untitled Chat'}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          confirmDelete(chat.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {chat.lastMessage}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (chatToDelete) {
                  handleDeleteChat(chatToDelete)
                  setChatToDelete(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
