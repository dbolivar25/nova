"use client"

import { Badge } from "@/components/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import { Trophy, Award, Medal, Star, Crown, Gem, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface StreakBadgesProps {
  milestones?: { days: number; achieved: boolean; achievedDate?: string }[]
  currentStreak: number
  longestStreak: number
  className?: string
}

const milestoneConfig = [
  { days: 7, icon: Star, label: "Week Warrior", color: "bg-yellow-500", description: "7 day streak" },
  { days: 14, icon: Award, label: "Fortnight Fighter", color: "bg-orange-500", description: "14 day streak" },
  { days: 30, icon: Medal, label: "Monthly Master", color: "bg-blue-500", description: "30 day streak" },
  { days: 60, icon: Trophy, label: "Commitment Champion", color: "bg-purple-500", description: "60 day streak" },
  { days: 90, icon: Gem, label: "Quarterly Quest", color: "bg-green-500", description: "90 day streak" },
  { days: 180, icon: Crown, label: "Half-Year Hero", color: "bg-indigo-500", description: "180 day streak" },
  { days: 365, icon: Zap, label: "Annual Legend", color: "bg-red-500", description: "365 day streak" },
]

export function StreakBadges({ 
  milestones = [], 
  currentStreak, 
  longestStreak,
  className 
}: StreakBadgesProps) {
  // Merge milestone data with config
  const badges = milestoneConfig.map(config => {
    const milestone = milestones.find(m => m.days === config.days)
    return {
      ...config,
      achieved: milestone?.achieved || false,
      isActive: currentStreak >= config.days,
      progress: Math.min(100, (currentStreak / config.days) * 100),
    }
  })
  
  // Find next milestone
  const nextMilestone = badges.find(b => !b.achieved)
  const daysToNext = nextMilestone ? nextMilestone.days - currentStreak : 0
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Next Milestone Progress */}
      {nextMilestone && currentStreak > 0 && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <nextMilestone.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Next: {nextMilestone.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {daysToNext} {daysToNext === 1 ? 'day' : 'days'} to go
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div 
              className={cn("h-full", nextMilestone.color)}
              initial={{ width: 0 }}
              animate={{ width: `${nextMilestone.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
      
      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((badge, index) => {
          const Icon = badge.icon
          const isAchieved = badge.achieved
          const isActive = badge.isActive
          
          return (
            <motion.div
              key={badge.days}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={cn(
                  "relative p-3 rounded-lg border transition-all",
                  isAchieved 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-card/50 opacity-60",
                  isActive && !isAchieved && "animate-pulse"
                )}
              >
                {/* Achievement Indicator */}
                {isAchieved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
                
                {/* Badge Content */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={cn(
                    "p-2 rounded-full",
                    isAchieved ? badge.color : "bg-secondary"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isAchieved ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      isAchieved ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {badge.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                  
                  {/* Progress for unachieved badges */}
                  {!isAchieved && currentStreak > 0 && (
                    <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all", badge.color)}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Badge variant="outline" className="text-xs">
          Current: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
        </Badge>
      </div>
    </div>
  )
}