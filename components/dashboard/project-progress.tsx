"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface ProjectStats {
  total: number
  completed: number
  running: number
  pending: number
}

export function ProjectProgress() {
  const [progress, setProgress] = useState(0)
  const [targetProgress, setTargetProgress] = useState(0)
  const [stats, setStats] = useState<ProjectStats>({ total: 0, completed: 0, running: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: projects } = await supabase
        .from("projects")
        .select("status")

      if (projects && projects.length > 0) {
        const total = projects.length
        const completed = projects.filter((p) => p.status === "completed").length
        const running = projects.filter((p) => p.status === "running").length
        const pending = projects.filter((p) => p.status === "pending").length
        const percentage = Math.round((completed / total) * 100)

        setStats({ total, completed, running, pending })
        setTargetProgress(percentage)
      }
      setIsLoading(false)
    }

    fetchProgress()
  }, [])

  useEffect(() => {
    if (isLoading) return
    const timer = setTimeout(() => {
      if (progress < targetProgress) {
        setProgress((prev) => Math.min(prev + 1, targetProgress))
      }
    }, 30)
    return () => clearTimeout(timer)
  }, [progress, targetProgress, isLoading])

  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="p-4 transition-all duration-500 hover:shadow-xl animate-slide-in-up overflow-hidden"
      style={{ animationDelay: "800ms" }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Project Progress</h2>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-4">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 6px, oklch(0.42 0.15 155) 6px, oklch(0.42 0.15 155) 12px)",
            }}
          />
          <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{progress}%</span>
            <span className="text-xs text-muted-foreground mt-1">Overall Completion</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Completed ({stats.completed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Running ({stats.running})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, oklch(0.55 0.02 120) 2px, oklch(0.55 0.02 120) 4px)",
              }}
            />
            <span className="text-muted-foreground whitespace-nowrap">Pending ({stats.pending})</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
