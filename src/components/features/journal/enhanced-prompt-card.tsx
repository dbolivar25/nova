"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/shared/ui/card"
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
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={cn(
        "transition-all duration-300 relative overflow-hidden",
        isFocused && "ring-2 ring-primary shadow-lg",
        isCompleted && "bg-muted/30"
      )}>
        <motion.div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        
        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <motion.div 
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center",
                    isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                  whileHover={{ scale: 1.1 }}
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
                        <Check className="h-3 w-3" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="circle"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Circle className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <Badge variant="secondary" className="text-xs">
                  Prompt {index + 1}
                </Badge>
                <AnimatePresence>
                  {wordCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge variant="outline" className="text-xs">
                        {wordCount} words
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm font-medium leading-relaxed pl-8">
                {prompt}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative pt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Take your time to reflect..."
            className={cn(
              "min-h-[140px] resize-none transition-all",
              "placeholder:text-muted-foreground/60"
            )}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}