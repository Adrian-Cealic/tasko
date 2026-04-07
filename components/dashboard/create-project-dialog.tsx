"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
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

const projectColors = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-emerald-500", label: "Green" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-red-500", label: "Red" },
]

const projectIcons = ["⚡", "🌊", "🎨", "🔍", "📁", "🚀", "💡", "🎯"]

type ProjectStatus = "running" | "completed" | "pending"

export function CreateProjectDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
    icon: "📁",
    due_date: "",
    status: "running" as ProjectStatus,
  })
  const supabase = createClient()

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
      window.location.reload()
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
          <Plus className="w-4 h-4 mr-1" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateProject}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="proj-name">Project Name</FieldLabel>
              <Input
                id="proj-name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="My awesome project"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="proj-desc">Description</FieldLabel>
              <Input
                id="proj-desc"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project description (optional)"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="proj-color">Color</FieldLabel>
                <Select
                  value={newProject.color}
                  onValueChange={(value) => setNewProject({ ...newProject, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectColors.map((color) => (
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
                <FieldLabel htmlFor="proj-icon">Icon</FieldLabel>
                <Select
                  value={newProject.icon}
                  onValueChange={(value) => setNewProject({ ...newProject, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="text-lg">{icon}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="proj-status">Status</FieldLabel>
              <Select
                value={newProject.status}
                onValueChange={(value: ProjectStatus) => setNewProject({ ...newProject, status: value })}
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
              <FieldLabel htmlFor="proj-due">Due Date</FieldLabel>
              <Input
                id="proj-due"
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
  )
}
