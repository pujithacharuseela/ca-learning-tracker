import React, { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useNavigate } from "react-router-dom"
import { Theme } from "@/types"
import { Sun, Moon, Bell, LogOut, User as UserIcon, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "./Sidebar"
import { toast } from "sonner"
import apiClient from "@/api/client"

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  // Track profile pic state with listener
  const [profilePic, setProfilePic] = useState<string>("")
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; type: string; read: boolean }[]>([])

  const loadPic = () => {
    if (user) {
      setProfilePic(user.profilePicture || localStorage.getItem(`profile_pic_${user.email}`) || "")
    }
  }

  useEffect(() => {
    loadPic()
    window.addEventListener("profile-picture-updated", loadPic)
    return () => window.removeEventListener("profile-picture-updated", loadPic)
  }, [user])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const list = []
        const storedReadIds = JSON.parse(localStorage.getItem("read_notification_ids") || "[]")

        // 1. Welcoming Notification
        list.push({
          id: "welcome",
          text: "Welcome to CA Learning Tracker! Set up your papers and upload your study planner to begin.",
          time: "Just now",
          type: "welcome",
          read: storedReadIds.includes("welcome")
        })

        // 2. Fetch Plans to show Scheduled Notifications
        try {
          const plansRes = await apiClient.get('/planner/plans')
          if (plansRes.data && Array.isArray(plansRes.data)) {
            plansRes.data.forEach((plan: any) => {
              const id = `plan-${plan.id}`
              list.push({
                id,
                text: `📅 Study Plan Scheduled: "${plan.name}" starts on ${plan.startDate}. Subject: ${plan.subjectName || "None"}`,
                time: "Recently",
                type: "plan",
                read: storedReadIds.includes(id)
              })
            })
          }
        } catch (e) {
          // ignore
        }

        // 3. Fetch User Settings and Daily Schedules for Deadline Reminders
        try {
          const settingsRes = await apiClient.get('/settings')
          const reminderTimeStr = settingsRes.data?.reminderTime || "09:00"
          const [rHour, rMin] = reminderTimeStr.split(':').map(Number)

          const todayStr = new Date().toISOString().split('T')[0]
          const dailyRes = await apiClient.get(`/planner/schedules/daily?date=${todayStr}`)

          if (dailyRes.data && Array.isArray(dailyRes.data)) {
            const now = new Date()
            const targetTime = new Date()
            targetTime.setHours(rHour, rMin, 0, 0)

            const diffMs = targetTime.getTime() - now.getTime()
            const diffMinutes = Math.round(diffMs / (1000 * 60))

            dailyRes.data.forEach((task: any) => {
              if (task.status !== "COMPLETED") {
                if (diffMinutes > 0) {
                  if (diffMinutes <= 180 && diffMinutes > 120) {
                    const id = `rem-3h-${task.id}`
                    list.push({
                      id,
                      text: `⏰ Reminder: Lecture "L${task.classNo}: ${task.topic}" is due in less than 3 hours!`,
                      time: "3 hours left",
                      type: "reminder",
                      read: storedReadIds.includes(id)
                    })
                  } else if (diffMinutes <= 60 && diffMinutes > 30) {
                    const id = `rem-1h-${task.id}`
                    list.push({
                      id,
                      text: `⏰ Urgent Reminder: Lecture "L${task.classNo}: ${task.topic}" is due in less than 1 hour!`,
                      time: "1 hour left",
                      type: "reminder",
                      read: storedReadIds.includes(id)
                    })
                  } else if (diffMinutes <= 30 && diffMinutes > 0) {
                    const id = `rem-30m-${task.id}`
                    list.push({
                      id,
                      text: `🚨 Final Reminder: Lecture "L${task.classNo}: ${task.topic}" is due in ${diffMinutes} minutes!`,
                      time: `${diffMinutes}m left`,
                      type: "reminder",
                      read: storedReadIds.includes(id)
                    })
                  }
                } else {
                  const id = `rem-overdue-${task.id}`
                  list.push({
                    id,
                    text: `⚠️ Overdue: Lecture "L${task.classNo}: ${task.topic}" deadline missed today!`,
                    time: "Overdue",
                    type: "reminder",
                    read: storedReadIds.includes(id)
                  })
                }
              }
            })
          }
        } catch (e) {
          // ignore
        }

        // 4. Fetch Streak and Achievement Notifications
        try {
          const res = await apiClient.get('/gamification/streak')
          const hasPendingToday = list.some(item => item.id.startsWith("rem-"))
          
          if (res.data) {
            const currentStreak = res.data.currentStreak || 0
            if (currentStreak > 0) {
              const id1 = "streak-active"
              list.push({
                id: id1,
                text: `🔥 Study Streak: You are on a ${currentStreak}-day streak! Keep studying to maintain it.`,
                time: "Today",
                type: "streak",
                read: storedReadIds.includes(id1)
              })
              
              const currentHour = new Date().getHours()
              if (hasPendingToday && currentHour >= 18) {
                const id2 = "streak-warning"
                list.push({
                  id: id2,
                  text: `⚠️ Streak Warning: You have pending lectures today! Complete them before midnight to keep your streak alive.`,
                  time: "Action needed",
                  type: "streak",
                  read: storedReadIds.includes(id2)
                })
              }
            } else if (res.data.longestStreak > 0) {
              const id3 = "streak-missed"
              list.push({
                id: id3,
                text: `💔 Streak Missed: You missed your daily study streak. Complete your scheduled lectures today to start a new streak!`,
                time: "Streak Missed",
                type: "streak",
                read: storedReadIds.includes(id3)
              })
            }
          }
        } catch (e) {
          // ignore
        }

        // 5. Fetch Achievements
        try {
          const res = await apiClient.get('/gamification/achievements')
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((ach: any, idx: number) => {
              const id = `ach-${idx}`
              list.push({
                id,
                text: `🏆 Achievement Unlocked: "${ach.badge?.displayName || 'Earned Badge'}" - ${ach.badge?.description || ''}`,
                time: ach.earnedAt ? new Date(ach.earnedAt).toLocaleDateString() : "Recently",
                type: "achievement",
                read: storedReadIds.includes(id)
              })
            })
          }
        } catch (e) {
          // ignore
        }

        setNotifications(list)
      } catch (err) {
        console.error("Failed to load notifications", err)
      }
    }

    if (user?.email) {
      fetchNotifications()
    }
  }, [user?.email])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      const allIds = updated.map(n => n.id)
      localStorage.setItem("read_notification_ids", JSON.stringify(allIds))
      return updated
    })
    toast.success("All notifications marked as read!")
  }

  const getInitials = () => {
    if (!user) return "U"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/75 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-300" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-slate-850">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <h2 className="text-lg font-semibold text-slate-100 hidden md:block">
          Welcome back, {user?.firstName || "Learner"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === Theme.DARK ? (
            <Sun className="h-5 w-5 text-amber-400 transition-all" />
          ) : (
            <Moon className="h-5 w-5 text-violet-400 transition-all" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 bg-[#0b1329] border border-slate-800 text-slate-200">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-850">
              <span className="font-bold text-sm">Notifications ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto py-1 space-y-1 mt-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No new notifications.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-lg text-xs transition-colors border ${
                      notif.read
                        ? "bg-[#0b1329]/20 border-transparent text-slate-400"
                        : "bg-[#101b38]/50 border-slate-800/85 text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium leading-relaxed">{notif.text}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-violet-500/20">
                {profilePic ? (
                  <img src={profilePic} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-violet-600/20 text-violet-400 font-bold border border-violet-500/20">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 font-normal">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile & Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
