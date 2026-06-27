import React, { useState } from "react"
import { getClasses, createPlan } from "@/api/planner"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export const PlannerPage: React.FC = () => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  
  // Create Plan Dialog state
  const [isOpen, setIsOpen] = useState(false)
  const [planName, setPlanName] = useState("")
  const [planDesc, setPlanDesc] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch classes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ["classes", search, page],
    queryFn: () => getClasses(search, page, 10),
  })

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      toast.success("Learning plan created successfully and classes scheduled!")
      setIsOpen(false)
      setSelectedClasses([])
      setPlanName("")
      setPlanDesc("")
      setStartDate("")
      setEndDate("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create plan.")
    },
  })

  const toggleSelectClass = (id: string) => {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const handleSelectAll = (checked: any) => {
    if (classesData?.content) {
      if (checked) {
        const pageIds = classesData.content.map((c) => String(c.id))
        setSelectedClasses((prev) => Array.from(new Set([...prev, ...pageIds])))
      } else {
        const pageIds = classesData.content.map((c) => String(c.id))
        setSelectedClasses((prev) => prev.filter((id) => !pageIds.includes(id)))
      }
    }
  }

  const handleCreatePlan = () => {
    if (!planName || !startDate || !endDate) {
      toast.error("Please fill all mandatory fields.")
      return
    }

    createPlanMutation.mutate({
      name: planName,
      description: planDesc,
      startDate: startDate as any,
      endDate: endDate as any,
      classIds: selectedClasses,
    })
  }

  const isAllPageSelected = classesData?.content 
    ? classesData.content.every((c) => selectedClasses.includes(String(c.id))) 
    : false

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Learning Planner</h1>
          <p className="text-slate-500 text-sm mt-1">Select imported classes and plan your study distribution</p>
        </div>

        {selectedClasses.length > 0 && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Plan ({selectedClasses.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Learning Plan</DialogTitle>
                <DialogDescription>
                  Enter dates and details to distribute study tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input id="name" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Mathematics Module A" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Topics to cover" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start">Start Date *</Label>
                    <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end">End Date *</Label>
                    <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                  Schedule Distribution
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase border-b">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <Checkbox checked={isAllPageSelected} onCheckedChange={handleSelectAll} />
                  </th>
                  <th className="px-6 py-4">Class No</th>
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">Loading classes...</td>
                  </tr>
                ) : classesData?.content.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                        <span>No classes found. Go to Upload Plan page to import schedules.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classesData?.content.map((cl) => (
                    <tr
                      key={cl.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer ${
                        selectedClasses.includes(cl.id) ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""
                      }`}
                      onClick={() => toggleSelectClass(String(cl.id))}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedClasses.includes(String(cl.id))}
                          onCheckedChange={() => toggleSelectClass(String(cl.id))}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium">{cl.classNo}</td>
                      <td className="px-6 py-4">{cl.topic}</td>
                      <td className="px-6 py-4">{cl.durationDisplay}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {classesData && classesData.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {classesData.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(classesData.totalPages - 1, p + 1))} disabled={page === classesData.totalPages - 1}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
