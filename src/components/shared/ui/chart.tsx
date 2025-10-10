"use client"

import * as React from "react"
import {
  Tooltip as RechartsTooltip,
  TooltipProps,
  Legend as RechartsLegend,
  LegendProps,
} from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import type { Payload } from "recharts/types/component/DefaultTooltipContent"
import { cn } from "@/shared/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

const ChartContext = React.createContext<ChartConfig | null>(null)

export function useChartConfig() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartConfig must be used within a ChartContainer")
  }
  return context
}

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig
}

export function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  const style = React.useMemo(() => {
    const cssVariables: Record<string, string> = {}
    Object.entries(config).forEach(([key, value], index) => {
      if (value.color) {
        cssVariables[`--chart-${index + 1}`] = value.color
        cssVariables[`--color-${key}`] = value.color
      }
    })
    return cssVariables
  }, [config])

  return (
    <ChartContext.Provider value={config}>
      <div
        className={cn(
          "flex w-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm",
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  indicator?: "dot" | "line"
}

export function ChartTooltip({ indicator = "dot", ...props }: ChartTooltipProps) {
  return (
    <RechartsTooltip
      {...props}
      cursor={{ strokeDasharray: "3 3" }}
      content={<ChartTooltipContent indicator={indicator} />}
    />
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Payload<ValueType, NameType>[]
  label?: string
  indicator?: "dot" | "line"
  className?: string
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = "dot",
  className,
}: ChartTooltipContentProps) {
  const config = React.useContext(ChartContext)

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-lg border border-border/70 bg-popover/95 px-3 py-2 text-sm shadow-lg backdrop-blur",
        className,
      )}
    >
      {label && <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="grid gap-2">
        {payload.map((item, index) => {
          const key = item.dataKey?.toString() ?? `value-${index}`
          const color =
            item.color ??
            (key in (config ?? {}) ? config?.[key]?.color : undefined) ??
            "var(--primary)"

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    indicator === "line" && "h-0.5 w-3 rounded-none",
                  )}
                  style={{ backgroundColor: color, borderColor: color }}
                />
                <span className="text-xs text-muted-foreground">
                  {config?.[key]?.label ?? item.name ?? key}
                </span>
              </div>
              <span className="text-xs font-medium tabular-nums">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ChartLegendProps extends LegendProps {
  contentClassName?: string
}

export function ChartLegend({ contentClassName, ...props }: ChartLegendProps) {
  return (
    <RechartsLegend
      {...props}
      wrapperStyle={{ paddingTop: 16 }}
      content={
        <ChartLegendContent
          align={props.align}
          layout={props.layout}
          contentClassName={contentClassName}
        />
      }
    />
  )
}

interface ChartLegendContentProps {
  payload?: Payload<ValueType, NameType>[]
  align?: LegendProps["align"]
  layout?: LegendProps["layout"]
  contentClassName?: string
}

export function ChartLegendContent({
  payload,
  align = "left",
  layout = "horizontal",
  contentClassName,
}: ChartLegendContentProps) {
  if (!payload?.length) return null

  return (
    <div
      className={cn(
        "flex flex-wrap gap-3 text-xs text-muted-foreground",
        layout === "vertical" ? "flex-col" : "items-center",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        contentClassName,
      )}
    >
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  )
}
