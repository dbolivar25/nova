"use client"

import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"
import { motion } from "framer-motion"

interface StreakFlameProps {
  streak: number
  className?: string
  showNumber?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function StreakFlame({ 
  streak, 
  className, 
  showNumber = true,
  size = "md" 
}: StreakFlameProps) {
  // Get size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }
  
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl",
  }
  
  // Get color based on streak length
  const getFlameColor = () => {
    if (streak === 0) return "text-muted-foreground"
    if (streak < 3) return "text-orange-400"
    if (streak < 7) return "text-orange-500"
    if (streak < 14) return "text-orange-600"
    if (streak < 30) return "text-red-500"
    if (streak < 60) return "text-red-600"
    return "text-blue-600" // Blue flame for very long streaks
  }
  
  // Animation variants
  const flameVariants = {
    idle: {
      scale: 1,
      rotate: 0,
    },
    active: {
      scale: [1, 1.1, 0.95, 1.05, 1],
      rotate: [0, -5, 5, -3, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
      },
    },
  }
  
  const glowVariants = {
    idle: {
      opacity: 0,
    },
    active: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  }
  
  if (streak === 0) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className={cn("relative", sizeClasses[size])}>
          <Flame className={cn("w-full h-full", getFlameColor())} />
        </div>
        {showNumber && (
          <div className="text-center">
            <p className={cn("font-bold text-muted-foreground", textSizeClasses[size])}>0</p>
            <p className="text-xs text-muted-foreground">Start your streak!</p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        className={cn("relative", sizeClasses[size])}
        variants={flameVariants}
        initial="idle"
        animate="active"
      >
        {/* Glow effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            getFlameColor()
          )}
          variants={glowVariants}
          initial="idle"
          animate="active"
        />
        
        {/* Main flame */}
        <Flame 
          className={cn(
            "relative w-full h-full drop-shadow-lg",
            getFlameColor()
          )}
          fill="currentColor"
        />
        
        {/* Extra flames for longer streaks */}
        {streak >= 7 && (
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [0.8, 0.9, 0.8],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.2,
            }}
          >
            <Flame 
              className={cn(
                "w-full h-full",
                getFlameColor()
              )}
              style={{ filter: "blur(2px)" }}
            />
          </motion.div>
        )}
        
        {/* Extra effect for very long streaks */}
        {streak >= 30 && (
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [0.6, 0.7, 0.6],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <Flame 
              className={cn(
                "w-full h-full",
                streak >= 60 ? "text-purple-500" : getFlameColor()
              )}
              style={{ filter: "blur(3px)" }}
            />
          </motion.div>
        )}
      </motion.div>
      
      {showNumber && (
        <div className="text-center">
          <motion.p 
            className={cn("font-bold", textSizeClasses[size], getFlameColor())}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {streak}
          </motion.p>
          <p className="text-xs text-muted-foreground">
            {streak === 1 ? "day streak" : "day streak"} 🔥
          </p>
        </div>
      )}
    </div>
  )
}