"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Search,
  Filter,
  Calendar,
  Tag,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ChevronRight,
  ListTree,
} from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
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
  parent_id: string | null
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
  const [isSubtaskOpen, setIsSubtaskOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(emptyForm)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

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

  const parentTasks = useMemo(
    () => tasks.filter(t => !t.parent_id),
    [tasks],
  )

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (task.parent_id) {
        const existing = map.get(task.parent_id) || []
        existing.push(task)
        map.set(task.parent_id, existing)
      }
    }
    return map
  }, [tasks])

  const getSubtaskProgress = useCallback(
    (parentId: string) => {
      const subs = subtasksByParent.get(parentId) || []
      if (subs.length === 0) return null
      const completed = subs.filter(s => s.completed).length
      return { completed, total: subs.length, percent: Math.round((completed / subs.length) * 100) }
    },
    [subtasksByParent],
  )

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
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
      parent_id: null,
    })

    if (!error) {
      setFormData(emptyForm)
      setIsCreateOpen(false)
      fetchTasks()
    }
    setIsSubmitting(false)
  }

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subtaskParentId) return
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const parent = tasks.find(t => t.id === subtaskParentId)

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      project_id: formData.project_id || parent?.project_id || null,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      parent_id: subtaskParentId,
    })

    if (!error) {
      setFormData(emptyForm)
      setIsSubtaskOpen(false)
      setSubtaskParentId(null)
      setExpandedTasks(prev => new Set(prev).add(subtaskParentId))
      fetchTasks()
    }
    setIsSubmitting(false)
  }

  const openSubtaskDialog = (parentId: string) => {
    const parent = tasks.find(t => t.id === parentId)
    setSubtaskParentId(parentId)
    setFormData({
      ...emptyForm,
      project_id: parent?.project_id || "",
    })
    setIsSubtaskOpen(true)
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
    setTasks(tasks.filter(t => t.id !== taskId && t.parent_id !== taskId))
  }

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null
    const project = projects.find(p => p.id === projectId)
    return project?.name || null
  }

  const filteredParentTasks = parentTasks
    .filter(task => {
      const subs = subtasksByParent.get(task.id) || []
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && task.completed) ||
        (filter === "active" && !task.completed)
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subs.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })

  const rootCount = parentTasks.length
  const activeRootCount = parentTasks.filter(t => !t.completed).length
  const completedRootCount = parentTasks.filter(t => t.completed).length

  const renderTaskForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="task-title">Titlu</FieldLabel>
          <Input
            id="task-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Denumirea task-ului"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-description">Descriere</FieldLabel>
          <Input
            id="task-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descriere (opțional)"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-priority">Prioritate</FieldLabel>
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
          <FieldLabel htmlFor="task-due_date">Deadline</FieldLabel>
          <Input
            id="task-due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-project">Proiect</FieldLabel>
          <Select
            value={formData.project_id}
            onValueChange={(value) => setFormData({ ...formData, project_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează proiect" />
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
          <FieldLabel htmlFor="task-tags">Tag-uri</FieldLabel>
          <Input
            id="task-tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Tag-uri separate prin virgulă"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se salvează...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FieldGroup>
    </form>
  )

  const renderSubtaskRow = (subtask: Task) => (
    <div
      key={subtask.id}
      className="group/subtask flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-border hover:bg-muted/50"
    >
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => toggleTaskCompletion(subtask.id, subtask.completed)}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {subtask.title}
        </p>
        {subtask.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subtask.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover/subtask:opacity-100 transition-opacity">
        <Badge
          variant={subtask.priority === "High" ? "destructive" : subtask.priority === "Medium" ? "default" : "secondary"}
          className="text-[10px] px-1.5 py-0"
        >
          {subtask.priority}
        </Badge>
        {subtask.due_date && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar className="w-3 h-3" />
            {new Date(subtask.due_date).toLocaleDateString("ro-RO")}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation()
            openEditDialog(subtask)
          }}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            deleteTask(subtask.id)
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
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
            placeholder="Caută task-uri..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) setFormData(emptyForm)
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Task Nou
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creează Task</DialogTitle>
              </DialogHeader>
              {renderTaskForm(handleCreateTask, "Creează")}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
          Toate ({rootCount})
        </Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">
          Active ({activeRootCount})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Finalizate ({completedRootCount})
        </Button>
      </div>

      {filteredParentTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {tasks.length === 0
              ? "Nu ai niciun task. Creează primul tău task!"
              : "Niciun task nu corespunde filtrului curent."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredParentTasks.map((task, index) => {
            const progress = getSubtaskProgress(task.id)
            const subs = subtasksByParent.get(task.id) || []
            const isExpanded = expandedTasks.has(task.id)
            const projectName = getProjectName(task.project_id)

            return (
              <Collapsible
                key={task.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(task.id)}
              >
                <Card
                  className="overflow-hidden transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {subs.length > 0 && (
                              <CollapsibleTrigger asChild>
                                <button className="shrink-0 rounded-md p-0.5 hover:bg-muted transition-colors">
                                  <ChevronRight
                                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                </button>
                              </CollapsibleTrigger>
                            )}
                            <h3
                              className={`font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors ${task.completed ? "line-through opacity-60" : ""}`}
                              onClick={() => openEditDialog(task)}
                            >
                              {task.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Badge
                              variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}
                              className="shrink-0"
                            >
                              {task.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              title="Adaugă sub-task"
                              onClick={(e) => {
                                e.stopPropagation()
                                openSubtaskDialog(task.id)
                              }}
                            >
                              <ListTree className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
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
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
                          {projectName && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {projectName}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(task.due_date).toLocaleDateString("ro-RO")}
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

                        {progress && (
                          <div className="flex items-center gap-3 pt-1">
                            <Progress value={progress.percent} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {subs.length > 0 && (
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 px-4 py-2 space-y-0.5">
                        <div className="pl-7">
                          {subs.map(renderSubtaskRow)}
                          <button
                            onClick={() => openSubtaskDialog(task.id)}
                            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adaugă sub-task
                          </button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </Card>
              </Collapsible>
            )
          })}
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
            <DialogTitle>Editează Task</DialogTitle>
          </DialogHeader>
          {renderTaskForm(handleEditTask, "Salvează")}
        </DialogContent>
      </Dialog>

      <Dialog open={isSubtaskOpen} onOpenChange={(open) => {
        setIsSubtaskOpen(open)
        if (!open) {
          setSubtaskParentId(null)
          setFormData(emptyForm)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adaugă Sub-task
              {subtaskParentId && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  în „{tasks.find(t => t.id === subtaskParentId)?.title}"
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {renderTaskForm(handleCreateSubtask, "Adaugă Sub-task")}
        </DialogContent>
      </Dialog>
    </div>
  )
}
