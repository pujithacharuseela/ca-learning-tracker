import React, { useState } from "react"
import { getPlans, getPlanSchedules, completeSchedule } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export const CalendarPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  })

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["planSchedules", selectedPlanId],
    queryFn: () => getPlanSchedules(selectedPlanId),
    enabled: !!selectedPlanId,
  })

  const completeMutation = useMutation({
    mutationFn: completeSchedule,
    onSuccess: (updated) => {
      const msg = updated.status === "COMPLETED" ? "Marked as completed! 🎉" : "Marked as not started."
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ["planSchedules", selectedPlanId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false })
    },
    onError: () => toast.error("Failed to update status."),
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Find offset for first day of month (0=Sun, 6=Sat)
  const startOffset = monthStart.getDay()

  const getSchedulesForDay = (day: Date) => {
    if (!schedules) return []
    const dayStr = format(day, "yyyy-MM-dd")
    return schedules.filter((sc) => {
      // scheduledDate comes as "yyyy-MM-dd" string - compare directly to avoid timezone issues
      const scDateStr = typeof sc.scheduledDate === "string"
        ? sc.scheduledDate
        : format(parseISO(String(sc.scheduledDate)), "yyyy-MM-dd")
      return scDateStr === dayStr
    })
  }

  const completedCount = schedules?.filter((s) => s.status === "COMPLETED").length ?? 0
  const totalCount = schedules?.length ?? 0
  const selectedPlan = plans?.find((p) => p.id === selectedPlanId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">View and manage your study schedule</p>
        </div>
        {plans && plans.length > 0 && (
          <div className="w-64">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="bg-[#0b1329] border-slate-800 text-slate-200">
                <SelectValue placeholder="Select active plan..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Plan Progress Bar */}
      {selectedPlanId && selectedPlan && totalCount > 0 && (
        <Card className="border-slate-800/60 bg-[#0b1329]/40">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">{selectedPlan.name}</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                  {selectedPlan.status}
                </Badge>
              </div>
              <span className="text-sm font-bold text-violet-400">{completedCount} / {totalCount} completed</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {selectedPlan.startDate} → {selectedPlan.endDate}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-100">
            <CalendarIcon className="h-5 w-5 text-violet-400" />
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline" size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="border-slate-800 hover:bg-slate-900 text-slate-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="border-slate-800 hover:bg-slate-900 text-slate-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPlanId ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarIcon className="h-12 w-12 text-slate-700" />
              <p className="text-slate-400 font-medium">Select a learning plan to view your schedule</p>
              {(!plans || plans.length === 0) && (
                <p className="text-slate-600 text-sm">No plans yet — go to Planner to create one.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-slate-500 py-2 tracking-wider uppercase">
                  {d}
                </div>
              ))}

              {/* Empty offset cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="min-h-[110px]" />
              ))}

              {/* Day cells */}
              {dateRange.map((day, idx) => {
                const dailyTasks = getSchedulesForDay(day)
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] border rounded-xl p-2 transition-all duration-200 ${
                      isToday
                        ? "border-violet-500/50 bg-violet-500/5"
                        : dailyTasks.length > 0
                        ? "border-indigo-500/20 bg-[#070d1e]/60"
                        : "border-slate-800/40 bg-[#070d1e]/20 hover:bg-[#070d1e]/40"
                    }`}
                  >
                    <span className={`text-xs font-bold ${isToday ? "text-violet-400" : "text-slate-500"}`}>
                      {format(day, "d")}
                    </span>
                    {schedulesLoading && dailyTasks.length === 0 ? null : (
                      <div className="mt-1.5 space-y-1">
                        {dailyTasks.map((task) => (
                          <div key={task.id} className="group relative">
                            <div
                              className={`text-[10px] px-1.5 py-1 rounded-lg font-semibold truncate border cursor-pointer transition-all ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 line-through opacity-70"
                                  : "bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20"
                              }`}
                              title={`Class ${task.classNo}: ${task.topic}`}
                            >
                              <span className="flex items-center gap-1">
                                {task.status === "COMPLETED"
                                  ? <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                                  : <Clock className="h-2.5 w-2.5 shrink-0" />
                                }
                                <span className="truncate">C{task.classNo}: {task.topic}</span>
                              </span>
                            </div>
                            {/* Complete/Undo button on hover */}
                            <button
                              className={`absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center h-4 w-4 rounded-full text-[8px] font-bold transition-all ${
                                task.status === "COMPLETED"
                                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500"
                              }`}
                              onClick={() => completeMutation.mutate(task.id)}
                              title={task.status === "COMPLETED" ? "Mark as not started" : "Mark as completed"}
                            >
                              {task.status === "COMPLETED" ? "↩" : "✓"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {selectedPlanId && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/30 border border-violet-500/40 inline-block" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30 inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/10 border border-violet-500/30 inline-block" /> Today
          </span>
          <span className="text-slate-600">Hover over a class → click ✓ to mark complete</span>
        </div>
      )}
    </div>
  )
}
