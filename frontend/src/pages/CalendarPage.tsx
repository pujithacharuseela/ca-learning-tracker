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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and reschedule study calendars</p>
        </div>

        {/* Plan Selector */}
        {plans && plans.length > 0 && (
          <div className="w-64">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select active plan..." />
              </SelectTrigger>
              <SelectContent>
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
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPlanId ? (
            <p className="text-center text-slate-500 py-12">Please select a learning plan to load schedules.</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <div key={dayName} className="text-center font-semibold text-xs text-slate-500 py-2">
                  {dayName}
                </div>
              ))}

              {/* Grid Days */}
              {dateRange.map((day, idx) => {
                const dailyTasks = getSchedulesForDay(day)
                return (
                  <div
                    key={idx}
                    className="min-h-[100px] border border-slate-100 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <span className="text-xs font-bold text-slate-500">{format(day, "d")}</span>
                    <div className="mt-2 space-y-1">
                      {dailyTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`text-[10px] p-1.5 rounded font-semibold truncate ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400"
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
