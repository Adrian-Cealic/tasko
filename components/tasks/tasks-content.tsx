"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Calendar, Tag, Plus, Loader2, Trash2, Pencil } from "lucide-react"
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

interface Task {
  id: string
  title: string
  description: string | null
  priority: "High" | "Medium" | "Low"
  completed: boolean
  due_date: string | null
  tags: string[]
  project_id: string | null
  created_at: string
}

interface Project {
  id: string
  name: string
}

type TaskFormData = {
  title: string
  description: string
  priority: "High" | "Medium" | "Low"
  due_date: string
  project_id: string
  tags: string
}

const emptyForm: TaskFormData = {
  title: "",
  description: "",
  priority: "Medium",
  due_date: "",
  project_id: "",
  tags: "",
}

export function TasksContent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(emptyForm)

  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [])

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setIsLoading(false)
  }

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .order("name")

    if (data) {
      setProjects(data)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      project_id: formData.project_id || null,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
    })

    if (!error) {
      setFormData(emptyForm)
      setIsCreateOpen(false)
      fetchTasks()
    }
    setIsSubmitting(false)
  }

  const openEditDialog = (task: Task) => {
    setEditingTaskId(task.id)
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date || "",
      project_id: task.project_id || "",
      tags: task.tags ? task.tags.join(", ") : "",
    })
    setIsEditOpen(true)
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTaskId) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from("tasks")
      .update({
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        project_id: formData.project_id || null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      })
      .eq("id", editingTaskId)

    if (!error) {
      setTasks(tasks.map(t =>
        t.id === editingTaskId
          ? {
              ...t,
              title: formData.title,
              description: formData.description || null,
              priority: formData.priority,
              due_date: formData.due_date || null,
              project_id: formData.project_id || null,
              tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
            }
          : t
      ))
      setIsEditOpen(false)
      setEditingTaskId(null)
      setFormData(emptyForm)
    }
    setIsSubmitting(false)
  }

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", taskId)

    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !completed } : t
    ))
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId)
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "No Project"
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Unknown Project"
  }

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "completed") return task.completed
      if (filter === "active") return !task.completed
      return true
    })
    .filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const renderTaskForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="task-title">Title</FieldLabel>
          <Input
            id="task-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Task title"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-description">Description</FieldLabel>
          <Input
            id="task-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Task description (optional)"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
          <Select
            value={formData.priority}
            onValueChange={(value: "High" | "Medium" | "Low") =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="task-due_date">Due Date</FieldLabel>
          <Input
            id="task-due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-project">Project</FieldLabel>
          <Select
            value={formData.project_id}
            onValueChange={(value) => setFormData({ ...formData, project_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="task-tags">Tags</FieldLabel>
          <Input
            id="task-tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Comma separated tags"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FieldGroup>
    </form>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) setFormData(emptyForm)
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              {renderTaskForm(handleCreateTask, "Create Task")}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
          All ({tasks.length})
        </Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">
          Active ({tasks.filter((t) => !t.completed).length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Completed ({tasks.filter((t) => t.completed).length})
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {tasks.length === 0
              ? "No tasks yet. Create your first task to get started!"
              : "No tasks match your current filter."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task, index) => (
            <Card
              key={task.id}
              className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => openEditDialog(task)}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-semibold text-foreground ${task.completed ? "line-through opacity-60" : ""}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"
                        }
                        className="shrink-0"
                      >
                        {task.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(task)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTask(task.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {getProjectName(task.project_id)}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-2">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) {
          setEditingTaskId(null)
          setFormData(emptyForm)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {renderTaskForm(handleEditTask, "Save Changes")}
        </DialogContent>
      </Dialog>
    </div>
  )
}
