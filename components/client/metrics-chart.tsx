"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function SingleMetricChart({ 
  data, 
  title, 
  description, 
  dataKey, 
  name, 
  color 
}: { 
  data: any[], 
  title: string, 
  description: string, 
  dataKey: string, 
  name: string, 
  color: string 
}) {
  const chartConfig = {
    [dataKey]: {
      label: name,
      color: color,
    }
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card className="bg-card border-none shadow-xl mt-6">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 10%)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="oklch(1 0 0 / 50%)"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              stroke="oklch(1 0 0 / 50%)" 
              domain={['auto', 'auto']}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="linear" 
              dataKey={dataKey} 
              name={name}
              stroke={`var(--color-${dataKey})`}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0, fill: `var(--color-${dataKey})` }} 
              activeDot={{ r: 6, strokeWidth: 0, fill: `var(--color-${dataKey})` }} 
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
