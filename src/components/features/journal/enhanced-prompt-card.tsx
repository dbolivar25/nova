"use client"

import { useState } from "react"
import { Textarea } from "@/components/shared/ui/textarea"
import { cn } from "@/shared/lib/utils"
import { Check, Circle } from "lucide-react"
import { Badge } from "@/components/shared/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface EnhancedPromptCardProps {
  prompt: string
  value: string
  onChange: (value: string) => void
  index: number
  isCompleted: boolean
}

export function EnhancedPromptCard({
  prompt,
  value,
  onChange,
  index,
  isCompleted
}: EnhancedPromptCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        isFocused
          ? "border-primary/40 shadow-lg shadow-primary/10"
          : "border-border/50",
        isCompleted && !isFocused && "bg-muted/20"
      )}>
        {/* Gradient overlay when focused */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Header */}
        <div className="relative p-5 pb-0">
          <div className="flex items-start gap-4">
            {/* Completion indicator */}
            <motion.div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="circle"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Circle className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Prompt content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  Prompt {index + 1}
                </Badge>
                <AnimatePresence>
                  {wordCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                        {wordCount} words
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="font-serif text-lg font-medium leading-relaxed text-foreground">
                {prompt}
              </p>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative p-5 pt-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Take your time to reflect on this..."
            className={cn(
              "min-h-[140px] resize-none rounded-xl border-border/40 bg-background/50 p-4 text-base transition-all",
              "placeholder:text-muted-foreground/50",
              "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30"
            )}
          />
        </div>
      </div>
    </motion.div>
  )
}
