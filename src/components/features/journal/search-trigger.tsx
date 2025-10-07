"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/shared/ui/button"
import { Search } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { SearchCommand } from "./search-command"

interface SearchTriggerProps {
  className?: string
  variant?: "floating" | "inline"
}

export function SearchTrigger({ className, variant = "inline" }: SearchTriggerProps) {
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)

  // Detect if user is on Mac for proper keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  // Handle keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (variant === "floating") {
    return (
      <>
        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className={cn(
              "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "h-14 w-14 p-0 md:w-auto md:px-4 md:h-12",
              "group relative overflow-hidden",
              className
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Search className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline-block">Search Journal</span>
            <div className="hidden md:flex items-center ml-2 gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>K
              </kbd>
            </div>
          </Button>
        </div>
        
        {/* Mobile-optimized floating button */}
        <div className="fixed bottom-20 right-6 z-50 md:hidden">
          <div className="relative">
            {/* Pulse animation for discoverability */}
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            <Button
              size="icon"
              onClick={() => setOpen(true)}
              className={cn(
                "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "h-14 w-14",
                "relative",
                className
              )}
            >
              <Search className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <SearchCommand open={open} onOpenChange={setOpen} />
      </>
    )
  }

  return (
    <>
      {/* Inline Search Button */}
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn(
          "relative justify-start text-sm text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-200",
          className
        )}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="flex-1 text-left">Search journal entries...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>K
        </kbd>
      </Button>

      <SearchCommand open={open} onOpenChange={setOpen} />
    </>
  )
}