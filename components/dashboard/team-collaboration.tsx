"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Loader2, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface TeamMember {
  id: string
  full_name: string
  role: string
  status: string
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  away: "bg-amber-100 text-amber-700",
  pending: "bg-rose-100 text-rose-700",
  offline: "bg-gray-100 text-gray-700",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TeamCollaboration() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMembers = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name, role, status")
        .order("created_at", { ascending: false })
        .limit(4)

      if (!error && data) {
        setMembers(data)
      }
      setIsLoading(false)
    }

    fetchMembers()
  }, [])

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
      style={{ animationDelay: "600ms" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Team Collaboration</h2>
        <Link href="/team">
          <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-105 bg-transparent">
            <Plus className="w-4 h-4 mr-1" />
            Add Member
          </Button>
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No team members yet. Add your first team member!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${650 + index * 100}ms` }}
            >
              <Avatar className="w-12 h-12 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-110">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{member.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
              </div>
              <span
                className={`${statusStyles[member.status] || statusStyles.offline} text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300 group-hover:scale-105 whitespace-nowrap capitalize`}
              >
                {member.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
