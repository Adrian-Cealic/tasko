"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Loader2, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string | null
  event_type: string
}

export function Reminders() {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchTodayEvents()
  }, [])

  const fetchTodayEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, end_time, event_type")
      .eq("event_date", today)
      .order("start_time")
      .limit(3)

    if (!error && data) {
      setTodayEvents(data)
    }
    setIsLoading(false)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up"
      style={{ animationDelay: "500ms" }}
    >
      <h2 className="text-xl font-semibold text-foreground mb-6">Today&apos;s Reminders</h2>
      {todayEvents.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No events scheduled for today.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayEvents.map((event) => (
            <div 
              key={event.id} 
              className="bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            >
              <h3 className="font-semibold text-foreground mb-1">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Time: {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </p>
              {event.event_type === "meeting" && (
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30">
                  <Video className="w-4 h-4 mr-2" />
                  Start Meeting
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
