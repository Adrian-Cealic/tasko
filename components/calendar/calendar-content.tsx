"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Video, Plus, Loader2, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string | null
  duration: string | null
  event_type: "meeting" | "review" | "presentation" | "deadline" | "reminder"
  color: string
  created_at: string
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const eventColors = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-green-600", label: "Green" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-cyan-500", label: "Cyan" },
]

export function CalendarContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    duration: "",
    event_type: "meeting" as CalendarEvent["event_type"],
    color: "bg-blue-500",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("event_date", startOfMonth.toISOString().split("T")[0])
      .lte("event_date", endOfMonth.toISOString().split("T")[0])
      .order("start_time")

    if (!error && data) {
      setEvents(data)
    }
    setIsLoading(false)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description || null,
      event_date: newEvent.event_date,
      start_time: newEvent.start_time,
      end_time: newEvent.end_time || null,
      duration: newEvent.duration || null,
      event_type: newEvent.event_type,
      color: newEvent.color,
    })

    if (!error) {
      setNewEvent({
        title: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        duration: "",
        event_type: "meeting",
        color: "bg-blue-500",
      })
      setIsDialogOpen(false)
      fetchEvents()
    }
    setIsSubmitting(false)
  }

  const deleteEvent = async (eventId: string) => {
    await supabase.from("calendar_events").delete().eq("id", eventId)
    setEvents(events.filter(e => e.id !== eventId))
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDay = (day: number | null) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter(e => e.event_date === dateStr)
  }

  const getTodayEvents = () => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    return events.filter(e => e.event_date === dateStr)
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[150px] text-center">{formatMonthYear()}</span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event_date">Date</FieldLabel>
                  <Input
                    id="event_date"
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="start_time">Start Time</FieldLabel>
                    <Input
                      id="start_time"
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end_time">End Time</FieldLabel>
                    <Input
                      id="end_time"
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="event_type">Event Type</FieldLabel>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(value: CalendarEvent["event_type"]) =>
                      setNewEvent({ ...newEvent, event_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="color">Color</FieldLabel>
                  <Select
                    value={newEvent.color}
                    onValueChange={(value) => setNewEvent({ ...newEvent, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventColors.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${color.value}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">Duration</FieldLabel>
                  <Input
                    id="duration"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
                    placeholder="e.g., 30 min, 1 hour"
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => (
              <button
                key={index}
                onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                disabled={!day}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium
                  transition-all duration-300 hover:scale-110 relative
                  ${!day ? "invisible" : ""}
                  ${
                    isToday(day)
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-secondary text-foreground"
                  }
                `}
              >
                {day}
                {day && getEventsForDay(day).length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {getEventsForDay(day).slice(0, 3).map((event, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${event.color}`} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Events for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h3>
          {getTodayEvents().length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
          ) : (
            <div className="space-y-3">
              {getTodayEvents().map((event, index) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-border hover:shadow-md transition-all duration-300 cursor-pointer animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full min-h-[60px] rounded-full ${event.color}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTime(event.start_time)}</p>
                      <div className="flex items-center gap-2">
                        {event.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {event.duration}
                          </Badge>
                        )}
                        {event.event_type === "meeting" && <Video className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
