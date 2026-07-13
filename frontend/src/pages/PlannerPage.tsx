import React, { useState, useMemo } from "react"
import { getClasses, createPlan, getPlannedClassIds, getPlans, deletePlan, updatePlan, getSubjects, toggleClassActive, activateAllClasses, getAllSchedules, completeSchedule } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus, AlertCircle, CheckCircle2, Pencil, Trash2, BookOpen, GraduationCap, EyeOff, Eye, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const PlannerPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // Create Plan Dialog state
  const [isOpen, setIsOpen] = useState(false)
  const [planName, setPlanName] = useState("")
  const [planDesc, setPlanDesc] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")

  // Edit Plan Dialog state
  const [editPlanId, setEditPlanId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  const [editSubjectId, setEditSubjectId] = useState("")

  // Fetch subjects first
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  const [filterSubjectId, setFilterSubjectId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "planned" | "unplanned" | "completed" | "excluded">("all")

  // Fetch classes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ["classes", search, filterSubjectId, statusFilter, page],
    queryFn: () => getClasses(search, page, 10, filterSubjectId === "all" ? undefined : filterSubjectId, statusFilter),
  })

  const totalPages = classesData?.page?.totalPages ?? classesData?.totalPages ?? 0

  const toggleActiveMutation = useMutation({
    mutationFn: toggleClassActive,
    onSuccess: () => {
      toast.success("Lecture status updated!")
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update lecture status."),
  })

  const activateAllMutation = useMutation({
    mutationFn: activateAllClasses,
    onSuccess: (data) => {
      toast.success(`${data.activated} lecture(s) activated!`)
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to activate lectures."),
  })

  // Fetch IDs of classes already scheduled in any plan
  const { data: plannedIds } = useQuery({
    queryKey: ["plannedClassIds"],
    queryFn: getPlannedClassIds,
  })
  const plannedSet = new Set<string>(plannedIds?.map(String) ?? [])

  // Fetch all schedules to map completed items
  const { data: allSchedules } = useQuery({
    queryKey: ["allSchedules"],
    queryFn: getAllSchedules,
  })

  const completedClassIds = useMemo(() => {
    if (!allSchedules) return new Set<string>()
    return new Set<string>(
      allSchedules.filter(s => s.status === "COMPLETED").map(s => String(s.classId))
    )
  }, [allSchedules])

  // Map classId -> schedule for quick lookup (used for Mark Complete action)
  const classScheduleMap = useMemo(() => {
    if (!allSchedules) return new Map<string, any>()
    const map = new Map<string, any>()
    for (const s of allSchedules) {
      // Keep the latest non-completed schedule for each class
      if (!map.has(String(s.classId)) || s.status !== "COMPLETED") {
        map.set(String(s.classId), s)
      }
    }
    return map
  }, [allSchedules])

  const completeScheduleMutation = useMutation({
    mutationFn: completeSchedule,
    onSuccess: () => {
      toast.success("Lecture marked as completed!")
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to mark as completed."),
  })

  // Fetch all plans for management panel
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  })

  const createPlanMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      toast.success("Learning plan created and classes scheduled!")
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      setIsOpen(false)
      setSelectedClasses([])
      setPlanName(""); setPlanDesc(""); setStartDate(""); setEndDate(""); setSelectedSubjectId("")
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to create plan.";
      toast.error(errMsg);
    },
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePlan(id, data),
    onSuccess: () => {
      toast.success("Plan updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      setEditPlanId(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update plan."),
  })

  const deletePlanMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      toast.success("Plan deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to delete plan.";
      toast.error(errMsg);
    },
  })

  const toggleSelectClass = (id: string) => {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (checked: any) => {
    if (classesData?.content) {
      if (checked) {
        // Only select active lectures that are NOT already scheduled or completed
        const pageIds = classesData.content
          .filter((c) => c.isActive && !plannedSet.has(String(c.id)) && !completedClassIds.has(String(c.id)))
          .map((c) => String(c.id))
        setSelectedClasses((prev) => Array.from(new Set([...prev, ...pageIds])))
      } else {
        const pageIds = classesData.content.map((c) => String(c.id))
        setSelectedClasses((prev) => prev.filter((id) => !pageIds.includes(id)))
      }
    }
  }

  // Check if there are any skipped classes on the current page
  const hasSkippedClasses = classesData?.content?.some((c) => !c.isActive) ?? false

  const handleCreatePlan = () => {
    if (!planName.trim() || !startDate || !endDate) {
      toast.error("Please fill all mandatory fields.")
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after the start date.")
      return
    }
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class/lecture to schedule.")
      return
    }
    createPlanMutation.mutate({
      name: planName,
      description: planDesc,
      startDate: startDate as any,
      endDate: endDate as any,
      classIds: selectedClasses,
      subjectId: selectedSubjectId || undefined,
    })
  }

  const handleUpdatePlan = () => {
    if (!editPlanId || !editName.trim() || !editStartDate || !editEndDate) {
      toast.error("Mandatory fields missing.")
      return
    }
    if (new Date(editEndDate) < new Date(editStartDate)) {
      toast.error("End date must be on or after the start date.")
      return
    }
    updatePlanMutation.mutate({
      id: editPlanId,
      data: {
        name: editName,
        description: editDesc,
        startDate: editStartDate,
        endDate: editEndDate,
        subjectId: editSubjectId || undefined,
      }
    })
  }

  const isAllPageSelected = classesData?.content
    ? classesData.content.every((c) => selectedClasses.includes(String(c.id)))
    : false

  if (isLoading || isLoadingSubjects) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        <p className="text-slate-500 font-medium text-sm">Loading planner...</p>
      </div>
    )
  }

  // If there are no subjects, display prompt to create subjects first
  if (!isLoading && (!subjects || subjects.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <GraduationCap className="h-16 w-16 text-violet-500 animate-pulse" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">Subjects Required</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            You must add at least one subject before configuring study planners. Adding subjects helps map schedules.
          </p>
        </div>
        <Button onClick={() => navigate("/subjects")} className="bg-violet-600 hover:bg-violet-500 rounded-xl">
          Create Subjects Now
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Learning Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Select imported classes and plan your study distribution</p>
        </div>
        {selectedClasses.length > 0 && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Create Plan ({selectedClasses.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0b1329] border border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Create Learning Plan</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter dates and details to distribute study tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-slate-200">Plan Name *</Label>
                  <Input id="name" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Mathematics Module A" className="bg-[#020617]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject" className="text-slate-200">Map to Subject</Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="bg-[#020617] border-slate-800 text-slate-200">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-slate-200">Description</Label>
                  <Input id="desc" value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Topics to cover" className="bg-[#020617]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start" className="text-slate-200">Start Date *</Label>
                    <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#020617]" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end" className="text-slate-200">End Date *</Label>
                    <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#020617]" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="border-slate-800 hover:bg-slate-900 text-slate-300">Cancel</Button>
                <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending} className="bg-violet-600 hover:bg-violet-500">
                  {createPlanMutation.isPending ? "Scheduling..." : "Schedule Distribution"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Existing Plans Management */}
      {plans && plans.length > 0 && (
        <Card className="border-slate-800/60 bg-[#0b1329]/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-400" /> Active Study Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-y-auto pr-1 space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between bg-[#070d1e]/60 border border-slate-800/60 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200 truncate">{plan.name}</p>
                      {plan.subjectName && (
                        <Badge style={{ backgroundColor: `${plan.subjectColor}20`, color: plan.subjectColor, borderColor: `${plan.subjectColor}40` }} className="text-[10px] py-0 border shrink-0">
                          {plan.subjectName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <p className="text-xs text-slate-500">{plan.startDate} → {plan.endDate}</p>
                      <span className="text-xs text-slate-600 font-semibold hidden sm:inline">•</span>
                      <span className="text-xs text-indigo-400 font-medium bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {(() => {
                          const daysLeft = Math.ceil((new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          if (daysLeft > 0) return `⏳ ${daysLeft} days left`
                          if (daysLeft === 0) return `🚨 Deadline today!`
                          return `⚠️ Overdue by ${Math.abs(daysLeft)} day(s)`
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={plan.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}>
                      {plan.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-indigo-400"
                      onClick={() => {
                        setEditPlanId(plan.id)
                        setEditName(plan.name)
                        setEditDesc(plan.description || "")
                      setEditStartDate(plan.startDate || "")
                      setEditEndDate(plan.endDate || "")
                      setEditSubjectId(plan.subjectId || "")
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-500 hover:text-rose-400"
                    disabled={deletePlanMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete plan "${plan.name}" and all its schedules?`)) {
                        deletePlanMutation.mutate(plan.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Plan Dialog */}
      <Dialog open={!!editPlanId} onOpenChange={(o) => !o && setEditPlanId(null)}>
        <DialogContent className="sm:max-w-[420px] bg-[#0b1329] border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Edit Plan Details</DialogTitle>
            <DialogDescription className="text-slate-400">Modify properties or date intervals.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-slate-200">Plan Name *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[#020617]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Subject Mapping</Label>
              <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                <SelectTrigger className="bg-[#020617] border-slate-800 text-slate-200">
                  <SelectValue placeholder="Select subject..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="bg-[#020617]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-slate-200">Start Date *</Label>
                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="bg-[#020617]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-200">End Date *</Label>
                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="bg-[#020617]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanId(null)} className="border-slate-800 text-slate-300">Cancel</Button>
            <Button
              onClick={handleUpdatePlan}
              disabled={updatePlanMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-10 bg-[#020617] border-slate-800"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-400">Filter by Subject:</span>
            <Select value={filterSubjectId} onValueChange={(val) => { setFilterSubjectId(val); setPage(0) }}>
              <SelectTrigger className="w-[180px] bg-[#020617] border-slate-800 text-slate-200">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card className="border-slate-800/60 bg-[#0b1329]/20">
        <CardHeader className="border-b border-slate-800/60 pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Study Sessions & Lectures</h3>
                <p className="text-xs text-slate-500 mt-0.5">Filter by study progress or skip optional lectures</p>
              </div>
              {hasSkippedClasses && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs font-semibold"
                  onClick={() => activateAllMutation.mutate()}
                  disabled={activateAllMutation.isPending}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {activateAllMutation.isPending ? "Activating..." : "Activate All"}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800/40 self-start">
              {(["all", "planned", "unplanned", "completed", "excluded"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(0) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === status
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/45"
                  }`}
                >
                  {status === "all" ? "All Lectures" : status === "planned" ? "Scheduled" : status === "unplanned" ? "Remaining" : status === "completed" ? "Completed" : "Skipped"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#070d1e] text-xs font-semibold text-slate-400 uppercase border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <Checkbox checked={isAllPageSelected} onCheckedChange={handleSelectAll} />
                  </th>
                  <th className="px-6 py-4">Lecture No</th>
                  <th className="px-6 py-4">Paper</th>
                  <th className="px-6 py-4">Chapter / Topic</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading classes...</td></tr>
                ) : !classesData || !classesData.content || classesData.content.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-500" />
                        <span className="text-slate-400">No lectures found matching this category.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classesData.content.map((cl) => {
                    const isSelected = selectedClasses.includes(String(cl.id))
                    const isPlanned = plannedSet.has(String(cl.id))
                    const isCompleted = completedClassIds.has(String(cl.id))
                    const isActive = cl.isActive
                    const canSelect = isActive && !isPlanned && !isCompleted
                    const schedule = classScheduleMap.get(String(cl.id))

                    return (
                      <tr
                        key={cl.id}
                        className={`hover:bg-[#070d1e]/80 transition-colors ${
                          isSelected ? "bg-violet-600/10" : ""
                        } ${!isActive ? "opacity-50 bg-slate-950/20" : ""} ${
                          canSelect ? "cursor-pointer" : "cursor-default"
                        }`}
                        onClick={() => {
                          if (!isActive) {
                            toggleActiveMutation.mutate(cl.id, {
                              onSuccess: () => toggleSelectClass(String(cl.id))
                            })
                          } else if (canSelect) {
                            toggleSelectClass(String(cl.id))
                          }
                        }}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            disabled={!canSelect}
                            onCheckedChange={() => {
                              if (!isActive) {
                                toggleActiveMutation.mutate(cl.id, {
                                  onSuccess: () => toggleSelectClass(String(cl.id))
                                })
                              } else if (canSelect) {
                                toggleSelectClass(String(cl.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">{cl.classNo}</td>
                        <td className="px-6 py-4">
                          {cl.subject ? (
                            <Badge style={{ backgroundColor: `${cl.subject.color}20`, color: cl.subject.color, borderColor: `${cl.subject.color}40` }} className="text-[10px] py-0 border">
                              {cl.subject.name}
                            </Badge>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{cl.topic}</td>
                        <td className="px-6 py-4 text-slate-400">{cl.durationDisplay}</td>
                        <td className="px-6 py-4">
                          {!isActive ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
                              Skipped
                            </Badge>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1.5 text-violet-400 font-semibold text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/20 text-emerald-400" /> Completed
                            </span>
                          ) : isPlanned ? (
                            <span className="inline-flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
                              <Clock className="h-3.5 w-3.5 text-indigo-400" /> Scheduled
                            </span>
                          ) : (
                            <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-[10px]">
                              Remaining
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end h-8">
                            {/* Completed lectures — no actions needed */}
                            {isCompleted ? (
                              <span className="text-emerald-500/80 text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                            ) : isPlanned && schedule ? (
                              /* Scheduled lectures — Mark Complete button */
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => completeScheduleMutation.mutate(schedule.id)}
                                disabled={completeScheduleMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                              </Button>
                            ) : (
                              /* Remaining/Skipped lectures — Skip/Include toggle */
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold ${
                                  isActive
                                    ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                    : "text-emerald-450 hover:text-emerald-350 hover:bg-emerald-500/10"
                                }`}
                                onClick={() => toggleActiveMutation.mutate(cl.id)}
                                disabled={toggleActiveMutation.isPending}
                              >
                                {isActive ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" /> Skip Topic
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" /> Include
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
 
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800/60">
              <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
