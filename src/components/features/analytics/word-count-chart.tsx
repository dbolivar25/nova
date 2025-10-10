"use client"

import { memo, useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { format, parseISO } from "date-fns"
import { ChartContainer, ChartTooltip } from "@/components/shared/ui/chart"

export interface WordCountDatum {
  date: string
  wordCount: number
}

interface WordCountChartProps {
  data: WordCountDatum[]
}

const formatTick = (isoDate: string) => {
  try {
    return format(parseISO(isoDate), "MMM d")
  } catch {
    return isoDate
  }
}

function WordCountChartComponent({ data }: WordCountChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      label: formatTick(point.date),
    }))
  }, [data])

  return (
    <ChartContainer
      config={{
        wordCount: {
          label: "Word count",
          color: "var(--chart-1)",
        },
      }}
      className="h-[260px]"
    >
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wordCountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="85%" stopColor="var(--chart-1)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={8}
            minTickGap={20}
            tick={{ fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={8}
            width={32}
            allowDecimals={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
          />
          <ChartTooltip />
          <Area
            type="monotone"
            dataKey="wordCount"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#wordCountGradient)"
            name="wordCount"
            dot={false}
            activeDot={{ r: 4, stroke: "var(--chart-1)", fill: "var(--chart-1)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export const WordCountChart = memo(WordCountChartComponent)
