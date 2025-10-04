import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sparkles, User, Calendar, ChevronDown, FileText, ArrowRight, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Source {
  type: string
  entryDate: string
  excerpt: string
}

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  sources?: Source[]
  isStreaming?: boolean
}

export function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  isStreaming
}: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null)
  const router = useRouter()
  const isUser = role === "user"
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset refs when sources change
  useEffect(() => {
    if (sources) {
      sourceRefs.current = sourceRefs.current.slice(0, sources.length)
    }
  }, [sources])

  const handleCitationClick = (sourceIndex: number) => {
    // Auto-expand sources if collapsed
    if (!showSources) {
      setShowSources(true)
    }

    // Wait for expansion animation, then scroll
    setTimeout(() => {
      const sourceElement = sourceRefs.current[sourceIndex]
      if (sourceElement) {
        sourceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

        // Highlight the source briefly
        setHighlightedSource(sourceIndex)
        setTimeout(() => setHighlightedSource(null), 2000)
      }
    }, showSources ? 0 : 150)
  }

  const handleSourceClick = (source: Source) => {
    router.push(`/journal?date=${source.entryDate}`)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Sparkles className={cn("h-4 w-4", isStreaming && "animate-pulse")} />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-3", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "text-base leading-relaxed max-w-none",
          isUser && "text-right"
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom paragraph styling
              p: ({ children }) => (
                <p className="mb-4 last:mb-0">{children}</p>
              ),
              // Custom link renderer for citations
              a: ({ href, children, ...props }) => {
                const isCitation = href?.startsWith('@source-')

                if (isCitation && href) {
                  const sourceNum = href.replace('@source-', '')
                  const sourceIndex = parseInt(sourceNum) - 1

                  return (
                    <span
                      onClick={() => handleCitationClick(sourceIndex)}
                      className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5
                        mr-0.5 text-[12px] font-semibold
                        bg-primary/10 text-primary
                        border border-primary/20 rounded
                        hover:bg-primary/20 hover:scale-105
                        transition-all cursor-pointer -translate-y-[3px]"
                    >
                      {sourceNum}
                    </span>
                  )
                }

                return <a href={href} {...props} className="text-primary underline">{children}</a>
              }
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-1 bg-foreground/60 animate-pulse" />
          )}
        </div>

        {/* Action Bar (Meetingflow style) */}
        {!isStreaming && !isUser && (
          <div className="border-t border-border pt-2 mt-3">
            <div className="flex items-center justify-between">
              {/* Left: Quick actions */}
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Right: Sources toggle */}
              {sources && sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSources(!showSources)}
                >
                  <FileText className="h-3 w-3 mr-1.5" />
                  {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}
                  <ChevronDown className={cn(
                    "h-3 w-3 ml-1 transition-transform",
                    showSources && "rotate-180"
                  )} />
                </Button>
              )}
            </div>

            {/* Expanded sources list */}
            {sources && sources.length > 0 && showSources && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    ref={el => { sourceRefs.current[index] = el }}
                    onClick={() => handleSourceClick(source)}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md transition-all",
                      "hover:bg-muted cursor-pointer group",
                      highlightedSource === index && "bg-primary/10 ring-2 ring-primary/20 animate-in fade-in"
                    )}
                  >
                    <span className="flex-shrink-0 w-4 h-4 flex items-center
                      justify-center text-[10px] font-semibold
                      bg-primary/10 text-primary border border-primary/20 rounded
                      mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {source.entryDate}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        &ldquo;{source.excerpt}&rdquo;
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground
                      opacity-0 group-hover:opacity-100 transition-opacity
                      flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 border-t border-border" />
          </div>
        )}
      </div>
    </div>
  )
}
