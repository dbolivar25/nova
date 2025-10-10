"use client"

import { memo, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/shared/ui/chart"

interface StreakTimelineChartProps {
  days: { date: string; hasEntry: boolean }[]
  currentStreak?: number
  longestStreak?: number
}

function StreakTimelineChartComponent({
  days,
  currentStreak = 0,
  longestStreak = 0,
}: StreakTimelineChartProps) {
  const chartData = useMemo(() => {
    let running = 0
    return days.map((day) => {
      running = day.hasEntry ? running + 1 : 0
      const parsedDate = parseISO(day.date)
      return {
        date: format(parsedDate, "MMM d"),
        value: running,
        hasEntry: day.hasEntry,
        iso: day.date,
      }
    })
  }, [days])

  if (!chartData.length) {
    return (
      <ChartContainer
        config={{ value: { label: "Streak", color: "var(--chart-2)" } }}
        className="h-[260px] items-center justify-center text-sm text-muted-foreground"
      >
        <p>Keep journaling and Nova will chart your streak momentum here.</p>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: "Streak momentum",
          color: "var(--primary)",
        },
      }}
      className="h-[260px]"
    >
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={8}
            minTickGap={18}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={34}
            fontSize={12}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#streakGradient)"
            name="value"
            dot={false}
            activeDot={{ r: 4, stroke: "var(--primary)", fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1">
          Current streak
          <span className="font-semibold text-foreground">{currentStreak}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1">
          Longest
          <span className="font-semibold text-foreground">{longestStreak}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1">
          Window • last {chartData.length} days
        </span>
      </div>
    </ChartContainer>
  )
}

export const StreakTimelineChart = memo(StreakTimelineChartComponent)
