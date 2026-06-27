import React, { useState } from "react"
import { getAnalytics, downloadExcelReport } from "@/api/analytics"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Download, BarChart2, TrendingUp, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const AnalyticsPage: React.FC = () => {
  const [start, setStart] = useState("2026-06-01")
  const [end, setEnd] = useState("2026-06-30")

  // Load analytics metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["analytics", start, end],
    queryFn: () => getAnalytics(start, end),
  })

  const handleExport = async () => {
    try {
      const blob = await downloadExcelReport()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `StudyReport_${start}_to_${end}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Excel report downloaded successfully!")
    } catch (err) {
      toast.error("Failed to generate report.")
    }
  }

  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

  const pieData = metrics?.statusDistribution
    ? Object.entries(metrics.statusDistribution).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Review study trends, distributions, and ratings</p>
        </div>

        <div className="flex items-center gap-2">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
          <span className="text-slate-400">to</span>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
          <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Calculating analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* Overview Grid */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm font-medium text-slate-500">Hours Studied</span>
                <p className="text-3xl font-bold mt-2 text-indigo-600">{metrics?.totalHoursStudied}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm font-medium text-slate-500">Sessions Logged</span>
                <p className="text-3xl font-bold mt-2 text-emerald-600">{metrics?.totalSessionsCompleted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm font-medium text-slate-500">Avg Session Rating</span>
                <p className="text-3xl font-bold mt-2 text-amber-500">{metrics?.averageRating.toFixed(1)} / 5</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <span className="text-sm font-medium text-slate-500">Avg Difficulty</span>
                <p className="text-3xl font-bold mt-2 text-rose-500">{metrics?.averageDifficulty.toFixed(1)} / 5</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" /> Daily Minutes Studied
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.studyTimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="minutes" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject / Topic Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" /> Distribution by Topic (Minutes)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.topicDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip />
                    <Bar dataKey="minutesStudied" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-500" /> Class Schedule Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 pl-6">
                  {pieData.map((item: any, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-semibold">{item.name}: {item.value as any}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
