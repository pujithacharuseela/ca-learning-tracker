import React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { 
  LayoutDashboard, 
  Calendar, 
  ListTodo, 
  Upload, 
  BarChart3, 
  Award, 
  Settings, 
  GraduationCap,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

export const SidebarContent: React.FC = () => {
  const { user } = useAuth()
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Planner", href: "/planner", icon: ListTodo },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Upload Plan", href: "/upload", icon: Upload },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Badges & Streaks", href: "/badges", icon: Award },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Header / Brand */}
      <div className="flex h-16 items-center px-6 gap-2 border-b border-[var(--border)]">
        <GraduationCap className="h-6 w-6 text-violet-500" />
        <span className="text-xl font-bold tracking-tight text-slate-100">
          Learning Tracker
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-violet-600/25 text-violet-400 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Info */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 font-bold border border-violet-500/20">
            {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-medium text-slate-200">
              {user ? `${user.firstName} ${user.lastName}` : "Learner"}
            </span>
            <span className="truncate text-xs text-slate-500">
              {user?.email || ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0 select-none">
      <SidebarContent />
    </aside>
  )
}
