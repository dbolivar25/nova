import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, ChevronDown, Calendar, ArrowRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Source {
  type: string
  entryDate: string
  excerpt: string
}

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  isStreaming?: boolean
}

export function ChatMessage({
  role,
  content,
  sources,
  isStreaming
}: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const [highlightedSource, _setHighlightedSource] = useState<number | null>(null)
  const router = useRouter()
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([])
  const isUser = role === "user"

  // Reset refs when sources change
  useEffect(() => {
    if (sources) {
      sourceRefs.current = sourceRefs.current.slice(0, sources.length)
    }
  }, [sources])

  const handleSourceClick = (source: Source) => {
    router.push(`/journal/${source.entryDate}`)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }

  if (isUser) {
    // User message - right aligned with dark bubble (Gemini style)
    return (
      <div className="flex justify-end mb-8">
        <div className="max-w-[70%]">
          <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3">
            <div className="text-base leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assistant message - left aligned without avatar (Gemini style)
  return (
    <div className="mb-8">
      <div className="flex gap-3">
        {/* Content - no avatar */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-base max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 text-base leading-relaxed">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-semibold mb-3 mt-5 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-3 mt-4 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-base leading-relaxed">{children}</li>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-muted-foreground/20 pl-4 italic mb-4">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => {
                  const isCitation = href?.startsWith('@source-')

                  if (isCitation && href) {
                    const sourceNum = href.replace('@source-', '')
                    const sourceIndex = parseInt(sourceNum) - 1

                    return (
                      <span
                        onClick={() => {
                          const source = sources?.[sourceIndex]
                          if (source) {
                            handleSourceClick(source)
                          }
                        }}
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

                  return (
                    <a href={href} className="text-primary underline underline-offset-2 hover:no-underline">
                      {children}
                    </a>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Action buttons and sources - Gemini style */}
          {!isStreaming && (
            <div className="mt-4 flex items-center gap-1">
              {/* Copy button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground/70"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>

              {/* Thumbs up */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground/70"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>

              {/* Thumbs down */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground/70"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>

              {/* Sources dropdown - right aligned */}
              {sources && sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 px-3 rounded-full hover:bg-muted/50 text-xs text-muted-foreground hover:text-foreground/70"
                  onClick={() => setShowSources(!showSources)}
                >
                  {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}
                  <ChevronDown className={cn(
                    "h-3 w-3 ml-1.5 transition-transform",
                    showSources && "rotate-180"
                  )} />
                </Button>
              )}
            </div>
          )}

          {/* Expanded sources */}
          {sources && showSources && (
            <div className="mt-3 space-y-2">
              {sources.map((source, index) => (
                <div
                  key={index}
                  ref={el => { sourceRefs.current[index] = el }}
                  onClick={() => handleSourceClick(source)}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-xl transition-all duration-150",
                    "bg-muted/40 border border-border/30 shadow-sm",
                    "hover:bg-muted/50 hover:border-border/40",
                    "cursor-pointer group",
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
        </div>
      </div>
    </div>
  )
}
