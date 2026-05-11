"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  weight: {
    label: "Súly (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ProgressChart({ data, exerciseName }: { data: any[], exerciseName: string }) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100">Súlyterhelés alakulása</CardTitle>
          <CardDescription className="text-zinc-400">Válassz ki egy gyakorlatot</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-zinc-500">
          Nincs elegendő adat a grafikon megjelenítéséhez.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-none shadow-xl">
      <CardHeader>
        <CardTitle className="text-zinc-100">Fejlődés: {exerciseName || 'Gyakorlat'}</CardTitle>
        <CardDescription className="text-zinc-400">A feljegyzett eredményeid alakulása</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="var(--color-weight)" 
              strokeWidth={4}
              fill="url(#fillWeight)"
              dot={{ r: 4, fill: "var(--color-weight)", strokeWidth: 0 }} 
              activeDot={{ r: 8, strokeWidth: 0 }} 
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
