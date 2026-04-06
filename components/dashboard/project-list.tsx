"use client"

import { Card } from "@/components/ui/card"
import { Plus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface Project {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  status: "running" | "completed" | "pending"
  due_date: string | null
  created_at: string
}

const projectColors = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-emerald-500", label: "Green" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-red-500", label: "Red" },
]

const projectIcons = ["⚡", "🌊", "🎨", "🔍", "📁", "🚀", "💡", "🎯"]

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
    icon: "📁",
    due_date: "",
    status: "running" as Project["status"],
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (!error && data) {
      setProjects(data)
    }
    setIsLoading(false)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: newProject.name,
      description: newProject.description || null,
      color: newProject.color,
      icon: newProject.icon,
      status: newProject.status,
      due_date: newProject.due_date || null,
    })

    if (!error) {
      setNewProject({
        name: "",
        description: "",
        color: "bg-blue-500",
        icon: "📁",
        due_date: "",
        status: "running",
      })
      setIsDialogOpen(false)
      fetchProjects()
    }
    setIsSubmitting(false)
  }

  const deleteProject = async (projectId: string) => {
    await supabase.from("projects").delete().eq("id", projectId)
    setProjects(projects.filter(p => p.id !== projectId))
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
      style={{ animationDelay: "700ms" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-105 bg-transparent">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Project Name</FieldLabel>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="My awesome project"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Input
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Project description (optional)"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="color">Color</FieldLabel>
                    <Select
                      value={newProject.color}
                      onValueChange={(value) => setNewProject({ ...newProject, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projectColors.map(color => (
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
                    <FieldLabel htmlFor="icon">Icon</FieldLabel>
                    <Select
                      value={newProject.icon}
                      onValueChange={(value) => setNewProject({ ...newProject, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projectIcons.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            <span className="text-lg">{icon}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={newProject.status}
                    onValueChange={(value: Project["status"]) => setNewProject({ ...newProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="due_date">Due Date</FieldLabel>
                  <Input
                    id="due_date"
                    type="date"
                    value={newProject.due_date}
                    onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No projects yet. Create your first project!
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${800 + index * 100}ms` }}
            >
              <div
                className={`${project.color} w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}
              >
                {project.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.due_date
                    ? `Due: ${new Date(project.due_date).toLocaleDateString()}`
                    : "No due date"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteProject(project.id)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
