"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/shared/ui/card"
import { Textarea } from "@/components/shared/ui/textarea"
import { cn } from "@/shared/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface PromptCardProps {
  prompt: string
  value: string
  onChange: (value: string) => void
  index: number
}

export function PromptCard({ prompt, value, onChange, index }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0)

  return (
    <Card className={cn(
      "transition-all duration-300",
      isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md"
    )}>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-relaxed">{prompt}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your thoughts here..."
            className="min-h-[120px] resize-none"
          />
        </CardContent>
      )}
    </Card>
  )
}