"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, Clock } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export function TimeTracker() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [todayTotal, setTodayTotal] = useState(0)
  const startedAtRef = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTodayTotal()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const fetchTodayTotal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split("T")[0]

    const { data } = await supabase
      .from("time_entries")
      .select("duration_seconds")
      .gte("started_at", `${today}T00:00:00`)
      .lte("started_at", `${today}T23:59:59`)

    if (data) {
      const total = data.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0)
      setTodayTotal(total)
    }
  }

  const handleStart = useCallback(() => {
    startedAtRef.current = new Date().toISOString()
    setIsRunning(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const handleStop = useCallback(async () => {
    setIsRunning(false)

    if (seconds > 0 && startedAtRef.current) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("time_entries").insert({
          user_id: user.id,
          started_at: startedAtRef.current,
          ended_at: new Date().toISOString(),
          duration_seconds: seconds,
        })
        setTodayTotal((prev) => prev + seconds)
      }
    }

    setSeconds(0)
    startedAtRef.current = null
  }, [seconds, supabase])

  const formatTime = (num: number) => String(num).padStart(2, "0")
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const todayHours = Math.floor(todayTotal / 3600)
  const todayMinutes = Math.floor((todayTotal % 3600) / 60)

  return (
    <Card
      className="bg-foreground text-background p-4 transition-all duration-500 hover:shadow-2xl animate-slide-in-up overflow-hidden relative group"
      style={{ animationDelay: "1000ms" }}
    >
      <div className="absolute top-0 right-0 w-48 h-full opacity-15">
        {[...Array(6)].map((_, i) => (
          <svg
            key={i}
            className="absolute"
            style={{
              top: `${i * 50}px`,
              right: `-${i * 10}px`,
              width: "150px",
              height: "80px",
            }}
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            <path
              d="M0,25 Q12.5,10 25,25 T50,25 T75,25 T100,25"
              fill="none"
              stroke="oklch(0.42 0.15 155)"
              strokeWidth="2"
            />
          </svg>
        ))}
      </div>

      <div className="relative z-10">
        <h2 className="text-lg font-semibold mb-4">Time Tracker</h2>
        <div className="text-4xl sm:text-5xl font-mono font-bold mb-2 tracking-tight break-all">
          {formatTime(hours)}:{formatTime(minutes)}:{formatTime(secs)}
        </div>

        <div className="flex items-center gap-2 text-xs opacity-70 mb-4">
          <Clock className="w-3 h-3" />
          <span>Today: {todayHours}h {todayMinutes}m tracked</span>
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="icon"
              className="w-10 h-10 rounded-full bg-background text-foreground hover:bg-background/90 transition-all duration-300 hover:scale-110"
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              size="icon"
              className="w-10 h-10 rounded-full bg-background text-foreground hover:bg-background/90 transition-all duration-300 hover:scale-110"
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={handleStop}
            size="icon"
            disabled={seconds === 0}
            className="w-10 h-10 rounded-full bg-destructive hover:bg-destructive/90 transition-all duration-300 hover:scale-110 disabled:opacity-40"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
