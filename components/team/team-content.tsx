"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MoreHorizontal, Plus, Loader2, Trash2, UserPlus } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  status: "active" | "away" | "pending" | "offline"
  created_at: string
}

export function TeamContent() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newMember, setNewMember] = useState({
    full_name: "",
    email: "",
    role: "Member",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTeamMembers(data)
    }
    setIsLoading(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("team_members").insert({
      owner_id: user.id,
      full_name: newMember.full_name,
      email: newMember.email,
      role: newMember.role,
      status: "pending",
    })

    if (!error) {
      setNewMember({
        full_name: "",
        email: "",
        role: "Member",
      })
      setIsDialogOpen(false)
      fetchTeamMembers()
    }
    setIsSubmitting(false)
  }

  const updateMemberStatus = async (memberId: string, status: TeamMember["status"]) => {
    await supabase
      .from("team_members")
      .update({ status })
      .eq("id", memberId)

    setTeamMembers(teamMembers.map(m => 
      m.id === memberId ? { ...m, status } : m
    ))
  }

  const deleteMember = async (memberId: string) => {
    await supabase.from("team_members").delete().eq("id", memberId)
    setTeamMembers(teamMembers.filter(m => m.id !== memberId))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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
        <h2 className="text-lg font-semibold">Team Members ({teamMembers.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                  <Input
                    id="full_name"
                    value={newMember.full_name}
                    onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teamMembers.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">No team members yet</h3>
              <p className="text-muted-foreground">
                Add your first team member to start collaborating.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <Card
              key={member.id}
              className="p-6 hover:shadow-lg transition-all duration-300 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src="/placeholder.svg" alt={member.full_name} />
                  <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "active")}>
                      Set as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "away")}>
                      Set as Away
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "offline")}>
                      Set as Offline
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMember(member.id)}
                      className="text-destructive"
                    >
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{member.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>

                <Badge 
                  variant={
                    member.status === "active" ? "default" : 
                    member.status === "pending" ? "outline" : 
                    "secondary"
                  }
                >
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-transparent"
                    onClick={() => window.location.href = `mailto:${member.email}`}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
