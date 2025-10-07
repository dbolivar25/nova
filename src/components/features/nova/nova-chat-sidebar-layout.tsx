"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { MessageSquarePlus, Trash2, MessageSquare, Loader2, Menu } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/shared/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from "@/components/shared/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog"

interface ChatThread {
  id: string
  title: string | null
  lastMessage?: string
  updatedAt: string
  messageCount: number
}

interface NovaChatContextType {
  currentChatId?: string
  setCurrentChatId: (id: string | undefined) => void
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export const NovaChatContext = createContext<NovaChatContextType | null>(null)

// Global provider for chat state only (not sidebar state)
function NovaChatSidebarGlobalProvider({ children }: { children: React.ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()

  const onSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const onNewChat = () => {
    setCurrentChatId(undefined)
  }

  return (
    <NovaChatContext.Provider value={{ currentChatId, setCurrentChatId, onSelectChat, onNewChat }}>
      {children}
    </NovaChatContext.Provider>
  )
}

export function useNovaChatContext() {
  const context = useContext(NovaChatContext)
  if (!context) {
    throw new Error("useNovaChatContext must be used within NovaChatSidebarGlobalProvider")
  }
  return context
}

// RIGHT sidebar provider - wraps trigger and sidebar
function RightSidebarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      {children}
    </SidebarProvider>
  )
}

// Conditional wrapper - only provides RIGHT sidebar context on nova page
function ConditionalRightProvider({ children, isNovaPage }: { children: React.ReactNode; isNovaPage: boolean }) {
  if (isNovaPage) {
    return <RightSidebarProvider>{children}</RightSidebarProvider>
  }
  return <>{children}</>
}

// RIGHT sidebar trigger button
function RightSidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <Menu />
      <span className="sr-only">Toggle Chat Sidebar</span>
    </Button>
  )
}

// RIGHT sidebar content
function RightSidebarContent() {
  const { currentChatId, onSelectChat, onNewChat } = useNovaChatContext()
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

      setChats(prev => prev.filter(c => c.id !== chatId))

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
      <Sidebar side="right" variant="floating" collapsible="offcanvas">
        <SidebarHeader className="border-b border-border/20 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="w-full gap-2 hover:bg-accent/50 transition-colors justify-between"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="flex-1 text-right">New Chat</span>
          </Button>
        </SidebarHeader>

        <SidebarContent className="p-2">
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
            <SidebarMenu className="gap-1">
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="relative group">
                    <SidebarMenuButton
                      isActive={currentChatId === chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={cn(
                        "w-full h-auto py-3 px-3 flex-col items-start gap-1 rounded-xl transition-all duration-200",
                        currentChatId === chat.id && "bg-accent shadow-sm font-medium"
                      )}
                    >
                      <div className="flex items-center w-full gap-2 pr-0 group-hover:pr-7 transition-[padding]">
                        <span className="text-sm truncate flex-1">
                          {chat.title || 'Untitled Chat'}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate w-full text-left">
                          {chat.lastMessage}
                        </p>
                      )}
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(chat.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarContent>
      </Sidebar>

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

// Helper to capture LEFT sidebar toggle and pass it to children
function WithLeftSidebarToggle({ children }: { children: (toggle: () => void) => React.ReactNode }) {
  const { toggleSidebar } = useSidebar()
  return <>{children(toggleSidebar)}</>
}

export const NovaChatSidebarLayout = {
  GlobalProvider: NovaChatSidebarGlobalProvider,
  RightProvider: ConditionalRightProvider,
  WithLeftToggle: WithLeftSidebarToggle,
  RightTrigger: RightSidebarTrigger,
  RightSidebar: RightSidebarContent,
}
