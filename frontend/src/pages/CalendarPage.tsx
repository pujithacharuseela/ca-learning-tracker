import React, { useState } from "react"
import { getPlans, getPlanSchedules } from "@/api/planner"
import { useQuery } from "@tanstack/react-query"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")

  // Fetch plans
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  })

  // Fetch schedules for plan
  const { data: schedules } = useQuery({
    queryKey: ["planSchedules", selectedPlanId],
    queryFn: () => getPlanSchedules(selectedPlanId),
    enabled: !!selectedPlanId,
  })

  // Date generators
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getSchedulesForDay = (day: Date) => {
    if (!schedules) return []
    return schedules.filter((sc) => {
      const scDate = new Date(sc.scheduledDate)
      return isSameDay(scDate, day)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and reschedule study calendars</p>
        </div>

        {/* Plan Selector */}
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

      {/* Calendar Grid Container */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-100">
            <CalendarIcon className="h-5 w-5 text-violet-400" />
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -30))} className="border-slate-800 hover:bg-slate-900 text-slate-400">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="border-slate-800 hover:bg-slate-900 text-slate-400">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPlanId ? (
            <p className="text-center text-slate-400 py-12">Please select a learning plan to load schedules.</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <div key={dayName} className="text-center font-bold text-xs text-slate-400 py-2">
                  {dayName}
                </div>
              ))}

              {/* Grid Days */}
              {dateRange.map((day, idx) => {
                const dailyTasks = getSchedulesForDay(day)
                return (
                  <div
                    key={idx}
                    className="min-h-[100px] border border-slate-850 rounded-xl p-2 bg-[#070d1e]/30 hover:bg-[#070d1e]/80 transition-all duration-300"
                  >
                    <span className="text-xs font-bold text-slate-500">{format(day, "d")}</span>
                    <div className="mt-2 space-y-1">
                      {dailyTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`text-[10px] p-1.5 rounded-lg font-bold truncate border ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          }`}
                          title={task.topic}
                        >
                          {task.topic}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
