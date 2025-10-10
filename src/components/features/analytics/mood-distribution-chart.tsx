"use client"

import { memo, useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartLegend, ChartTooltipContent, ChartTooltip } from "@/components/shared/ui/chart"
import type { Mood } from "@/features/journal/types/journal"

const MOOD_LABELS: Record<Mood, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  thoughtful: "Thoughtful",
  grateful: "Grateful",
  anxious: "Anxious",
  excited: "Excited",
  sad: "Sad",
  angry: "Angry",
  peaceful: "Peaceful",
}

const MOOD_COLORS: Record<Mood, string> = {
  positive: "var(--chart-1)",
  neutral: "var(--chart-2)",
  negative: "var(--chart-3)",
  thoughtful: "var(--chart-4)",
  grateful: "var(--chart-5)",
  anxious: "oklch(0.68 0.1 45)",
  excited: "oklch(0.72 0.18 55)",
  sad: "oklch(0.58 0.12 255)",
  angry: "oklch(0.6 0.22 25)",
  peaceful: "oklch(0.74 0.08 170)",
}

interface MoodDistributionChartProps {
  distribution: Record<Mood, number>
}

function MoodDistributionChartComponent({ distribution }: MoodDistributionChartProps) {
  const chartData = useMemo(() => {
    return Object.entries(distribution)
      .map(([mood, count]) => ({
        mood: mood as Mood,
        label: MOOD_LABELS[mood as Mood],
        value: count,
      }))
      .filter((entry) => entry.value > 0)
  }, [distribution])

  return (
    <ChartContainer
      config={chartData.reduce(
        (acc, entry) => ({
          ...acc,
          [entry.label]: {
            label: entry.label,
            color: MOOD_COLORS[entry.mood],
          },
        }),
        {},
      )}
      className="h-[260px]"
    >
      {chartData.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
          Moods will begin to appear once Nova infers a few entries.
        </div>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend align="center" verticalAlign="bottom" iconType="circle" />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={1}
            >
              {chartData.map((entry) => (
                <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}

export const MoodDistributionChart = memo(MoodDistributionChartComponent)

