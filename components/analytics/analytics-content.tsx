"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, Target, ArrowUpRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsStats {
  completedTasks: number
  activeProjects: number
  teamMembers: number
  totalTasks: number
}

interface MonthlyRow {
  month: string
  tasks: number
}

interface DistributionRow {
  name: string
  count: number
  color: string
}

export function AnalyticsContent() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats>({
    completedTasks: 0,
    activeProjects: 0,
    teamMembers: 0,
    totalTasks: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([])
  const [distribution, setDistribution] = useState<DistributionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const [tasksRes, projectsRes, teamRes] = await Promise.all([
      supabase.from("tasks").select("completed, created_at"),
      supabase.from("projects").select("status"),
      supabase.from("team_members").select("id", { count: "exact", head: true }),
    ])

    const tasks = tasksRes.data || []
    const projects = projectsRes.data || []
    const teamCount = teamRes.count || 0

    const completedTasks = tasks.filter((t) => t.completed).length
    const activeProjects = projects.filter((p) => p.status === "running").length

    setAnalyticsStats({
      completedTasks,
      activeProjects,
      teamMembers: teamCount,
      totalTasks: tasks.length,
    })

    const monthCounts: Record<string, number> = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthCounts[key] = 0
    }

    for (const task of tasks) {
      const d = new Date(task.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key in monthCounts) {
        monthCounts[key]++
      }
    }

    const monthly: MonthlyRow[] = Object.entries(monthCounts).map(([key, count]) => {
      const [, monthIdx] = key.split("-")
      return { month: monthNames[parseInt(monthIdx)], tasks: count }
    })
    setMonthlyData(monthly)

    const running = projects.filter((p) => p.status === "running").length
    const completed = projects.filter((p) => p.status === "completed").length
    const pending = projects.filter((p) => p.status === "pending").length

    setDistribution([
      { name: "Running", count: running, color: "bg-blue-500" },
      { name: "Completed", count: completed, color: "bg-green-600" },
      { name: "Pending", count: pending, color: "bg-amber-500" },
    ])

    setIsLoading(false)
  }

  const maxTasks = monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.tasks), 1) : 1

  const stats = [
    { title: "Tasks Completed", value: analyticsStats.completedTasks.toString(), icon: CheckCircle },
    { title: "Active Projects", value: analyticsStats.activeProjects.toString(), icon: Target },
    { title: "Team Members", value: analyticsStats.teamMembers.toString(), icon: Users },
    { title: "Total Tasks", value: analyticsStats.totalTasks.toString(), icon: Clock },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ animationDelay: `${index * 100}ms` }}
            className={`bg-card text-foreground p-4 transition-all duration-500 ease-out animate-slide-in-up cursor-pointer ${
              hoveredCard === index ? "scale-105 shadow-2xl" : "shadow-lg"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-xs font-medium opacity-90">{stat.title}</h3>
              </div>
              <div
                className={`w-6 h-6 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 ${
                  hoveredCard === index ? "rotate-45" : ""
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Monthly Task Activity</h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No task data available yet.</p>
          ) : (
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div
                  key={data.month}
                  className="space-y-2 animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{data.month}</span>
                    <span className="text-muted-foreground">{data.tasks} tasks</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(data.tasks / maxTasks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Project Distribution</h3>
          {distribution.length === 0 || distribution.every((d) => d.count === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects available yet.</p>
          ) : (
            <div className="space-y-4">
              {distribution.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:shadow-md transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
