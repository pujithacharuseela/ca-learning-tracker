import React, { useMemo, useState } from "react"
import { getPlans, getAllSchedules, completeSchedule, getSubjects } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, endOfMonth, eachDayOfInterval } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, Filter } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i)

export const CalendarPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [filterType, setFilterType] = useState<"all" | "subject" | "plan">("all")
  const [filterSubjectId, setFilterSubjectId] = useState<string>("")
  const [filterPlanId, setFilterPlanId] = useState<string>("")
  const [selectedDateClasses, setSelectedDateClasses] = useState<Date | null>(null)

  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: getPlans })
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects })
  const { data: allSchedules, isLoading } = useQuery({
    queryKey: ["allSchedules"],
    queryFn: getAllSchedules,
  })

  const completeMutation = useMutation({
    mutationFn: completeSchedule,
    onMutate: async (scheduleId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["allSchedules"] })

      // Snapshot the previous value
      const previousSchedules = queryClient.getQueryData<any[]>(["allSchedules"])

      let newStatus = "COMPLETED"
      // Optimistically update to the new value
      if (previousSchedules) {
        const target = previousSchedules.find((s) => s.id === scheduleId)
        if (target) {
          newStatus = target.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED"
        }
        queryClient.setQueryData(
          ["allSchedules"],
          previousSchedules.map((s) =>
            s.id === scheduleId
              ? { ...s, status: newStatus }
              : s
          )
        )
      }

      // Show toast instantly
      toast.success(newStatus === "COMPLETED" ? "✅ Marked as completed!" : "↩ Marked as not started.")

      // Return context for potential rollbacks
      return { previousSchedules }
    },
    onError: (_err, _scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(["allSchedules"], context.previousSchedules)
      }
      toast.error("Failed to update status.")
    },
    onSuccess: () => {
      // Toast shown onMutate for instant feedback
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["analytics"], exact: false })
    },
  })

  const handleFilterTypeChange = (type: "all" | "subject" | "plan") => {
    setFilterType(type)
    if (type === "subject") {
      if (subjects && subjects.length > 0 && subjects[0]) {
        setFilterSubjectId(subjects[0].id)
      } else {
        setFilterSubjectId("")
      }
      setFilterPlanId("")
    } else if (type === "plan") {
      if (plans && plans.length > 0 && plans[0]) {
        setFilterPlanId(plans[0].id)
      } else {
        setFilterPlanId("")
      }
      setFilterSubjectId("")
    } else {
      setFilterSubjectId("")
      setFilterPlanId("")
    }
  }

  const monthStart = useMemo(() => new Date(year, month, 1), [year, month])
  const monthEnd = endOfMonth(monthStart)
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startOffset = monthStart.getDay()

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    if (!allSchedules) return []
    if (filterType === "plan" && filterPlanId) {
      return allSchedules.filter((s) => s.planId === filterPlanId)
    }
    if (filterType === "subject" && filterSubjectId) {
      const planIds = new Set(plans?.filter((p) => p.subjectId === filterSubjectId).map((p) => p.id) ?? [])
      return allSchedules.filter((s) => planIds.has(s.planId))
    }
    return allSchedules
  }, [allSchedules, filterType, filterPlanId, filterSubjectId, plans])

  const getSchedulesForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return filteredSchedules.filter((sc) => {
      const scDateStr = typeof sc.scheduledDate === "string"
        ? sc.scheduledDate
        : format(new Date(sc.scheduledDate), "yyyy-MM-dd")
      return scDateStr === dayStr
    })
  }

  const completedCount = filteredSchedules.filter((s) => s.status === "COMPLETED").length
  const totalCount = filteredSchedules.length

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        <p className="text-slate-500 font-medium text-sm">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">
            All your study schedules in one place • <span className="text-violet-400 font-semibold">Tip: Click any class to toggle complete/incomplete</span>
          </p>
        </div>
        {/* Month + Year Pickers */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="bg-[#0b1329] border-slate-800 text-slate-200 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={String(i)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="bg-[#0b1329] border-slate-800 text-slate-200 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-800/60 bg-[#0b1329]/40">
        <CardContent className="py-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Filter className="h-4 w-4" /> Filter:
          </div>
          {/* Filter type */}
          <div className="flex gap-2">
            {(["all", "subject", "plan"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleFilterTypeChange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === t
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {t === "all" ? "All Plans" : t === "subject" ? "By Subject" : "By Plan"}
              </button>
            ))}
          </div>

          {/* Subject filter */}
          {filterType === "subject" && subjects && subjects.length > 0 && (
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="bg-[#020617] border-slate-800 text-slate-200 w-48 h-8 text-xs">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Plan filter */}
          {filterType === "plan" && plans && plans.length > 0 && (
            <Select value={filterPlanId} onValueChange={setFilterPlanId}>
              <SelectTrigger className="bg-[#020617] border-slate-800 text-slate-200 w-48 h-8 text-xs">
                <SelectValue placeholder="Select plan..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Progress summary */}
          {totalCount > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">{completedCount}/{totalCount} completed</span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-100">
            <CalendarIcon className="h-5 w-5 text-violet-400" />
            {MONTH_NAMES[month]} {year}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline" size="icon"
              onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
              className="border-slate-800 hover:bg-slate-900 text-slate-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon"
              onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
              className="border-slate-800 hover:bg-slate-900 text-slate-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 py-2 tracking-wider uppercase">{d}</div>
            ))}

            {/* Empty offset cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[110px]" />
            ))}

            {/* Day cells */}
            {dateRange.map((day, idx) => {
              const dailyTasks = getSchedulesForDay(day)
              const todayStr = format(new Date(), "yyyy-MM-dd")
              const isToday = format(day, "yyyy-MM-dd") === todayStr
              const hasTasks = dailyTasks.length > 0
              return (
                <div
                  key={idx}
                  onClick={() => { if (hasTasks) setSelectedDateClasses(day) }}
                  className={`min-h-[110px] border rounded-xl p-2 transition-all duration-200 ${
                    hasTasks ? "cursor-pointer" : ""
                  } ${
                    isToday
                      ? "border-violet-500/50 bg-violet-500/5"
                      : hasTasks
                      ? "border-slate-700/60 bg-[#070d1e]/60 hover:bg-[#070d1e]/85"
                      : "border-slate-800/40 bg-[#070d1e]/20 hover:bg-[#070d1e]/40"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "bg-violet-600 text-white px-1.5 py-0.5 rounded-md" : "text-slate-500"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {isLoading
                      ? null
                      : dailyTasks.slice(0, 2).map((task) => (
                        <div key={task.id} className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => completeMutation.mutate(task.id)}
                            className={`w-full text-left text-[10px] px-1.5 py-1 rounded-lg font-semibold truncate border transition-all ${
                              task.status === "COMPLETED"
                                ? "opacity-80 hover:opacity-100"
                                : "hover:brightness-125"
                            }`}
                            style={{
                              backgroundColor: task.status === "COMPLETED" ? "#10b98115" : `${task.planColor || "#8b5cf6"}18`,
                              borderColor: task.status === "COMPLETED" ? "#10b98135" : `${task.planColor || "#8b5cf6"}35`,
                              color: task.status === "COMPLETED" ? "#34d399" : (task.planColor || "#c4b5fd"),
                            }}
                            title={`[${task.planName}] Class ${task.classNo}: ${task.topic} - Click to toggle completion`}
                          >
                            <span className="flex items-center gap-1.5">
                              {task.status === "COMPLETED"
                                ? <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                                : <Clock className="h-2.5 w-2.5 shrink-0 text-indigo-400" />
                              }
                              <span className="truncate text-[9.5px]">C{task.classNo}: {task.topic}</span>
                            </span>
                          </button>
                        </div>
                      ))
                    }
                    {dailyTasks.length > 2 && (
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md inline-block">
                          + {dailyTasks.length - 2} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Classes List Day Dialog */}
      <Dialog open={!!selectedDateClasses} onOpenChange={(o) => !o && setSelectedDateClasses(null)}>
        <DialogContent className="sm:max-w-[420px] bg-[#0b1329] border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>
              Classes for {selectedDateClasses ? format(selectedDateClasses, "MMMM d, yyyy") : ""}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and update class completion status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3 max-h-[350px] overflow-y-auto pr-1">
            {selectedDateClasses && getSchedulesForDay(selectedDateClasses).map((task) => (
              <div
                key={task.id}
                onClick={() => completeMutation.mutate(task.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 group/item ${
                  task.status === "COMPLETED"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-slate-350 hover:bg-emerald-500/15"
                    : "bg-slate-900/40 border-slate-800 hover:bg-[#070d1e] hover:border-violet-500/40"
                }`}
                title="Click to toggle completion status"
              >
                <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{task.planName}</span>
                    {task.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="h-2.5 w-2.5" />
                        Incomplete
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-200 truncate">C{task.classNo}: {task.topic}</span>
                  <span className="text-xs text-slate-400">{task.durationDisplay}</span>
                </div>
                <div className="shrink-0">
                  {task.status === "COMPLETED" ? (
                    <div className="h-5 w-5 rounded-full border border-emerald-500 bg-emerald-500/10 flex items-center justify-center transition-all group-hover/item:border-rose-500 group-hover/item:bg-rose-500/10">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 group-hover/item:hidden" />
                      <span className="text-[10px] text-rose-500 font-bold hidden group-hover/item:inline">↩</span>
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-slate-700 group-hover/item:border-violet-500 group-hover/item:bg-violet-500/10 flex items-center justify-center transition-all">
                      <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Scheduled (hover → ✓ to complete)</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Completed (hover → ↩ to undo)</span>
        {plans && plans.length > 0 && (
          <span className="flex items-center gap-2 ml-auto">
            {plans.slice(0, 5).map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.subjectColor || "#8b5cf6" }} />
                <span>{p.name}</span>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
