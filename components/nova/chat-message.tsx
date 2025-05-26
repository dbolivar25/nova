import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles, User } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  sources?: Array<{
    date: string
    excerpt: string
  }>
}

export function ChatMessage({ role, content, timestamp, sources }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          isUser && "text-right"
        )}>
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {sources && sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sources from your journal:</p>
            {sources.map((source, index) => (
              <Card key={index} className="p-3 text-xs">
                <p className="font-medium mb-1">{source.date}</p>
                <p className="text-muted-foreground italic">&ldquo;{source.excerpt}&rdquo;</p>
              </Card>
            ))}
          </div>
        )}

        {timestamp && (
          <p className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}