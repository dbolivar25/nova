import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/shared/ui/button"
import { Copy, ThumbsUp, ThumbsDown, ChevronDown, Calendar, ArrowRight, Lightbulb, MessageCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { cn } from "@/shared/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type NovaSource =
  | {
      type: "JournalEntryRef"
      entryDate: string
      excerpt: string
      mood?: string
    }
  | {
      type: "WeeklyInsightRef"
      weekStartDate: string
      insightType: string
      summary: string
    }

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  sources?: NovaSource[]
  isStreaming?: boolean
}

function normalizeContent(text: string): string {
  return text
    .replace(/\u2011/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2010/g, '-')
    .replace(/\u2012/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
}

export function ChatMessage({
  role,
  content,
  sources,
  isStreaming
}: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const router = useRouter()
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([])
  const isUser = role === "user"
  const normalizedContent = normalizeContent(content)

  useEffect(() => {
    if (sources) {
      sourceRefs.current = sourceRefs.current.slice(0, sources.length)
    }
  }, [sources])

  const handleSourceClick = (source: NovaSource) => {
    if (source.type === "JournalEntryRef") {
      router.push(`/journal/${source.entryDate}`)
    } else {
      router.push(`/insights?week=${source.weekStartDate}`)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(normalizedContent)
    toast.success("Copied to clipboard")
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3 shadow-sm">
            <div className="text-base leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="prose prose-base max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 text-base leading-relaxed text-foreground">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="font-serif text-2xl font-semibold mb-3 mt-6 first:mt-0 text-foreground">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-serif text-xl font-semibold mb-3 mt-5 first:mt-0 text-foreground">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-serif text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-4 space-y-1.5 marker:text-primary/60">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-4 space-y-1.5 marker:text-primary/60">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-base leading-relaxed text-foreground">{children}</li>
                ),
                code: ({ children }) => (
                  <code className="bg-muted/60 text-foreground px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted/40 border border-border/40 p-4 rounded-xl overflow-x-auto mb-4 text-sm">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/30 pl-4 italic mb-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                br: () => <span className="block h-4" aria-hidden="true" />,
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
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                          text-[11px] font-semibold
                          bg-primary/10 text-primary
                          border border-primary/20 rounded
                          hover:bg-primary/20 hover:scale-105
                          transition-all cursor-pointer -translate-y-[2px]"
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
              {normalizedContent}
            </ReactMarkdown>
          </div>

          {!isStreaming && (
            <div className="mt-4 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>

              {sources && sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setShowSources(!showSources)}
                >
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                  <ChevronDown className={cn(
                    "h-3 w-3 ml-1.5 transition-transform",
                    showSources && "rotate-180"
                  )} />
                </Button>
              )}
            </div>
          )}

          {sources && showSources && (
            <div className="mt-3 space-y-2">
              {sources.map((source, index) => (
                <div
                  key={index}
                  ref={el => { sourceRefs.current[index] = el }}
                  onClick={() => handleSourceClick(source)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                    "bg-muted/30 border border-border/40",
                    "hover:bg-muted/50 hover:border-primary/20",
                    "cursor-pointer group",
                  )}
                >
                  <span className="flex-shrink-0 flex h-5 w-5 items-center
                    justify-center text-[10px] font-semibold
                    bg-primary/10 text-primary border border-primary/20 rounded
                    mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {source.type === "JournalEntryRef" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary/70" />
                          <span className="text-sm font-medium">
                            {source.entryDate}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          &ldquo;{source.excerpt}&rdquo;
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-primary/70" />
                          <span className="text-sm font-medium">
                            Week of {source.weekStartDate}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {source.insightType}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {source.summary}
                        </p>
                      </>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50
                    opacity-0 group-hover:opacity-100 transition-opacity
                    flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
