// frontend/src/components/ui/chart.tsx — [Frontend]
// {/* Shadcn UI Chart Component */}
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Re-export all recharts primitives
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PieChart as PieChartComponent,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: any
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: any }) => {
  const colorConfig = config?.colors || {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
    muted: "hsl(var(--muted))",
    destructive: "hsl(var(--destructive))",
    warning: "hsl(var(--warning))",
    success: "hsl(var(--success))",
    info: "hsl(var(--info))",
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart="${id}"] {
  --color-primary: ${colorConfig.primary};
  --color-primary-foreground: ${colorConfig["primary-foreground"] || "hsl(var(--primary-foreground))"};
  --color-secondary: ${colorConfig.secondary};
  --color-secondary-foreground: ${colorConfig["secondary-foreground"] || "hsl(var(--secondary-foreground))"};
  --color-accent: ${colorConfig.accent};
  --color-accent-foreground: ${colorConfig["accent-foreground"] || "hsl(var(--accent-foreground))"};
  --color-muted: ${colorConfig.muted};
  --color-muted-foreground: ${colorConfig["muted-foreground"] || "hsl(var(--muted-foreground))"};
  --color-destructive: ${colorConfig.destructive};
  --color-destructive-foreground: ${colorConfig["destructive-foreground"] || "hsl(var(--destructive-foreground))"};
  --color-warning: ${colorConfig.warning || "hsl(var(--warning))"};
  --color-warning-foreground: ${colorConfig["warning-foreground"] || "hsl(var(--warning-foreground))"};
  --color-success: ${colorConfig.success || "hsl(var(--success))"};
  --color-success-foreground: ${colorConfig["success-foreground"] || "hsl(var(--success-foreground))"};
  --color-info: ${colorConfig.info || "hsl(var(--info))"};
  --color-info-foreground: ${colorConfig["info-foreground"] || "hsl(var(--info-foreground))"};
  --color-chart-1: ${colorConfig.chart1 || "hsl(var(--chart-1))"};
  --color-chart-2: ${colorConfig.chart2 || "hsl(var(--chart-2))"};
  --color-chart-3: ${colorConfig.chart3 || "hsl(var(--chart-3))"};
  --color-chart-4: ${colorConfig.chart4 || "hsl(var(--chart-4))"};
  --color-chart-5: ${colorConfig.chart5 || "hsl(var(--chart-5))"};
}
        `,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartLegend = RechartsPrimitive.Legend

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const value =
        typeof label === "string" ? label : item?.[key] || item?.value || label
      const name = `${nameKey || item?.name || item?.dataKey || "value"}`

      if (labelFormatter) {
        return labelFormatter(value, payload)
      }

      return {
        label: value,
        name,
      }
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelKey,
      nameKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const [item] = payload

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!hideLabel && tooltipLabel && (
          <div className={cn("font-medium", labelClassName)}>
            {typeof tooltipLabel === "string"
              ? tooltipLabel
              : tooltipLabel.label}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => (
            <div
              key={item.dataKey || index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                color
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-l-2 border-dashed bg-transparent":
                            indicator === "dashed",
                        }
                      )}
                      style={
                        {
                          "--color-bg": item.color,
                          "--color-border": item.color,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      hideIndicator ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      <div className="flex items-center gap-2 font-medium leading-none">
                        {item.name}
                      </div>
                    </div>
                    {item.value && (
                      <div className="font-mono font-medium tabular-nums leading-none">
                        {item.value}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => (
          <div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-muted-foreground">
              {nameKey ? item.payload?.[nameKey] : item.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
