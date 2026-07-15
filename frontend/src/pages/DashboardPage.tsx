import React, { useState, useEffect } from "react"
import { getDashboard, startSession, completeSession } from "@/api/dashboard"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Play, CheckCircle, Clock, BookOpen, Flame, Award, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient()
  
  // Active session state — restored from localStorage on mount for instant recovery
  const [activeSession, setActiveSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("active_study_session")
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [seconds, setSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("active_study_session")
      if (saved) {
        const session = JSON.parse(saved)
        if (session.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
          return elapsed > 0 ? elapsed : 0
        }
      }
    } catch {}
    return 0
  })

  // Complete Session Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [difficulty, setDifficulty] = useState("3")
  const [rating, setRating] = useState("3")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("COMPLETED")

  // Load Dashboard Data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  })

  // Also restore from backend response (works after backend deploy, or cross-browser)
  useEffect(() => {
    if (dashboard?.activeSession && !activeSession) {
      const backendSession = dashboard.activeSession
      const sessionData = {
        id: backendSession.sessionId,
        scheduleId: backendSession.scheduleId,
        status: backendSession.status,
        startedAt: backendSession.startedAt,
      }
      setActiveSession(sessionData)
      localStorage.setItem("active_study_session", JSON.stringify(sessionData))
      if (backendSession.startedAt) {
        const startTime = new Date(backendSession.startedAt).getTime()
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setSeconds(elapsed > 0 ? elapsed : 0)
      }
    }
  }, [dashboard])

  // Mutations
  const startMutation = useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      const sessionData = { ...data, startedAt: data.startedAt || new Date().toISOString() }
      setActiveSession(sessionData)
      setSeconds(0)
      localStorage.setItem("active_study_session", JSON.stringify(sessionData))
      toast.success("Study session started! Timer is active.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to start study session.")
    },
  })

  const completeMutation = useMutation({
    mutationFn: (variables: {
      sessionId: string;
      difficultyRating: number;
      overallRating: number;
      notes: string;
      status: any;
    }) =>
      completeSession(variables.sessionId, {
        difficultyRating: variables.difficultyRating,
        overallRating: variables.overallRating,
        notes: variables.notes,
        status: variables.status,
      }),
    onSuccess: () => {
      toast.success("Study session saved successfully!")
      setIsModalOpen(false)
      setActiveSession(null)
      setSeconds(0)
      setNotes("")
      localStorage.removeItem("active_study_session")
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save study session.")
    },
  })

  // Timer Effect
  useEffect(() => {
    let interval: any = null
    if (activeSession && activeSession.status === "IN_PROGRESS") {
      interval = setInterval(() => {
        setSeconds((prev) => {
          return prev + 1
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [activeSession])

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        <p className="text-slate-500 font-medium text-sm">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Current Streak", value: `${dashboard?.currentStreak || 0} Days`, icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { title: "Classes Completed", value: dashboard?.completedClassesCount || "0", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { title: "Hours Studied", value: `${dashboard?.totalStudyHours || 0}h`, icon: Clock, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
          { title: "Completion Rate", value: `${Math.round(dashboard?.completionPercentage || 0)}%`, icon: BookOpen, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((item, i) => (
          <Card key={i} className="hover:border-slate-700/80 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.title}</span>
                  <p className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-slate-100">{item.value}</p>
                </div>
                <div className={`p-3 rounded-xl border ${item.color.split(" ").slice(1).join(" ")}`}>
                  <item.icon className={`h-6 w-6 ${item.color.split(" ")[0]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Session Tracker */}
      {activeSession && (
        <Card className="border-indigo-200 bg-indigo-50/20 dark:border-indigo-900/50 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Clock className="h-5 w-5 animate-pulse" /> Active Study Session
            </CardTitle>
            <CardDescription>Keep studying! Your elapsed time is being tracked.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-4xl font-mono font-bold tracking-widest">{formatTime(seconds)}</span>
            <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              End Session & Track
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Panel Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Today's Tasks */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" /> Today's Scheduled Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard?.todayTasks?.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No tasks scheduled for today. Enjoy your day off!</p>
            ) : (
              dashboard?.todayTasks?.map((task: any) => (
                <div key={task.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <span className="text-sm font-semibold">{task.topic}</span>
                    <div className="flex gap-2 text-xs text-slate-500 mt-1">
                      <span>Class {task.classNo}</span>
                      <span>•</span>
                      <span>{task.durationDisplay}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : task.status === "IN_PROGRESS" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                        <Play className="h-3.5 w-3.5 fill-blue-400/25" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800">
                        <Clock className="h-3.5 w-3.5" />
                        Not Started
                      </span>
                    )}

                    {task.status !== "COMPLETED" && task.status !== "IN_PROGRESS" && !activeSession && (
                      <Button size="sm" onClick={() => startMutation.mutate(task.id)} className="bg-indigo-600 text-white hover:bg-indigo-500">
                        <Play className="h-3.5 w-3.5 mr-1" /> Start Study
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Badges / Streaks Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-500" /> Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard?.recentBadges?.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No achievements unlocked yet. Finish classes to earn badges!</p>
            ) : (
              dashboard?.recentBadges?.map((badge: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="text-2xl bg-amber-50 dark:bg-slate-900 p-2 rounded-lg">{badge.icon || "🏆"}</div>
                  <div>
                    <span className="text-sm font-semibold block">{badge.displayName}</span>
                    <span className="text-xs text-slate-500">{badge.description}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Complete Study Session</DialogTitle>
            <DialogDescription>
              Select status, log notes, and rate the class performance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Study Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SKIPPED">Skipped</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Overall Rating (1-5)</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Study Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Formulas, key items covered..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!activeSession) return;
                completeMutation.mutate({
                  sessionId: activeSession.id,
                  difficultyRating: Number(difficulty),
                  overallRating: Number(rating),
                  notes,
                  status,
                });
              }}
              disabled={completeMutation.isPending}
            >
              Save Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
