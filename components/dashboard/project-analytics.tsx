"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const dayShort = ["S", "M", "T", "W", "T", "F", "S"]
const barColors = ["#059669", "#047857", "#10b981", "#065f46", "#059669", "#047857", "#10b981"]

interface ChartDay {
  day: string
  value: number
  label: string
}

export function ProjectAnalytics() {
  const [chartData, setChartData] = useState<ChartDay[]>([])
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data: tasks } = await supabase
        .from("tasks")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString())

      const counts: Record<number, number> = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(sevenDaysAgo.getDate() + i)
        counts[d.getDay()] = 0
      }

      if (tasks) {
        for (const task of tasks) {
          const dayOfWeek = new Date(task.created_at).getDay()
          counts[dayOfWeek] = (counts[dayOfWeek] || 0) + 1
        }
      }

      const result: ChartDay[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(sevenDaysAgo.getDate() + i)
        const dow = d.getDay()
        result.push({
          day: dayShort[dow],
          value: counts[dow] || 0,
          label: dayLabels[dow],
        })
      }

      setChartData(result)
      setIsLoading(false)
    }

    fetchWeeklyData()
  }, [])

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value), 1) : 1
  const average = chartData.length > 0
    ? Math.round(chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length)
    : 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs font-semibold shadow-lg">
          <p className="font-bold">{payload[0].value} tasks</p>
          <p className="text-[10px] opacity-80">{payload[0].payload.label}</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up bg-linear-to-br from-background to-muted/20"
      style={{ animationDelay: "400ms" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Project Analytics</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
          <span>Tasks Created (Last 7 Days)</span>
        </div>
      </div>

      <div className="h-64 mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor", fontSize: 14 }}
              className="text-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
            <Bar
              dataKey="value"
              fill="url(#barGradient)"
              radius={[12, 12, 12, 12]}
              maxBarSize={60}
              onMouseEnter={(_, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                  className="transition-all duration-300"
                  style={{
                    filter:
                      hoveredBar === index ? "brightness(1.2) drop-shadow(0 4px 8px rgba(5, 150, 105, 0.4))" : "none",
                    transformOrigin: "center bottom",
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4 border-t border-muted/50 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Average: </span>
          <span className="font-semibold text-foreground">{average} tasks/day</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Peak: </span>
          <span className="font-semibold text-emerald-600">{maxValue} tasks</span>
        </div>
      </div>
    </Card>
  )
}
