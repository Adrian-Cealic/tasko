"use client"

import { ArrowUpRight, TrendingUp, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Stats {
  total: number
  completed: number
  running: number
  pending: number
}

export function StatsCards() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, running: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: projects } = await supabase
      .from("projects")
      .select("status")

    if (projects) {
      const total = projects.length
      const completed = projects.filter(p => p.status === "completed").length
      const running = projects.filter(p => p.status === "running").length
      const pending = projects.filter(p => p.status === "pending").length

      setStats({ total, completed, running, pending })
    }
    setIsLoading(false)
  }

  const statsData = [
    {
      title: "Total Projects",
      value: stats.total.toString(),
      increase: "Your total projects",
      bgColor: "bg-primary",
      textColor: "text-primary-foreground",
      delay: "0ms",
    },
    {
      title: "Completed",
      value: stats.completed.toString(),
      increase: "Finished projects",
      bgColor: "bg-card",
      textColor: "text-foreground",
      delay: "100ms",
    },
    {
      title: "Running",
      value: stats.running.toString(),
      increase: "Active projects",
      bgColor: "bg-card",
      textColor: "text-foreground",
      delay: "200ms",
    },
    {
      title: "Pending",
      value: stats.pending.toString(),
      subtitle: "Awaiting start",
      bgColor: "bg-card",
      textColor: "text-foreground",
      delay: "300ms",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {statsData.map((stat, index) => (
        <Card
          key={stat.title}
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ animationDelay: stat.delay }}
          className={`${stat.bgColor} ${stat.textColor} p-4 transition-all duration-500 ease-out animate-slide-in-up cursor-pointer ${
            hoveredCard === index ? "scale-105 shadow-2xl" : "shadow-lg"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xs font-medium opacity-90">{stat.title}</h3>
            <div
              className={`w-6 h-6 rounded-full ${
                stat.bgColor === "bg-primary" ? "bg-primary-foreground/20" : "bg-primary"
              } flex items-center justify-center transition-transform duration-300 ${
                hoveredCard === index ? "rotate-45" : ""
              }`}
            >
              <ArrowUpRight
                className={`w-3 h-3 ${stat.bgColor === "bg-primary" ? "text-primary-foreground" : "text-primary-foreground"}`}
              />
            </div>
          </div>
          <p className="text-3xl font-bold mb-2">{stat.value}</p>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            {stat.increase && (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>{stat.increase}</span>
              </>
            )}
            {stat.subtitle && <span>{stat.subtitle}</span>}
          </div>
        </Card>
      ))}
    </div>
  )
}
