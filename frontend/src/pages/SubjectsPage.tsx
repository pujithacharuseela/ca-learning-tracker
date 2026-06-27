import React, { useState } from "react"
import { getSubjects, createSubject, updateSubject, deleteSubject, type SubjectData } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, BookOpen, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const PRESET_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#3b82f6", "#ec4899", "#84cc16",
  "#f97316", "#6366f1",
]

export const SubjectsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<SubjectData | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [description, setDescription] = useState("")

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) => createSubject(data),
    onSuccess: () => {
      toast.success("Subject created!")
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
      closeDialog()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create subject."),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; color: string; description?: string } }) => updateSubject(id, data),
    onSuccess: () => {
      toast.success("Subject updated!")
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
      closeDialog()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update subject."),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted.")
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete subject."),
  })

  const openCreate = () => {
    setEditSubject(null)
    setName(""); setColor(PRESET_COLORS[0]); setDescription("")
    setIsOpen(true)
  }

  const openEdit = (s: SubjectData) => {
    setEditSubject(s)
    setName(s.name); setColor(s.color); setDescription(s.description || "")
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false); setEditSubject(null)
    setName(""); setColor(PRESET_COLORS[0]); setDescription("")
  }

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Subject name is required."); return }
    const descriptionParam: string = description.trim();
    if (editSubject) {
      updateMutation.mutate({ id: editSubject.id, data: { name, color, description: descriptionParam } })
    } else {
      createMutation.mutate({ name, color, description: descriptionParam })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">Organize your study topics by subject before creating plans</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-500 flex items-center gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-12">Loading subjects...</p>
      ) : !subjects || subjects.length === 0 ? (
        <Card className="border-dashed border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BookOpen className="h-12 w-12 text-slate-700" />
            <div className="text-center">
              <p className="font-semibold text-slate-300">No subjects yet</p>
              <p className="text-sm text-slate-500 mt-1">Add subjects like "Financial Reporting", "Taxation", "Auditing" to organise your plans</p>
            </div>
            <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-500 mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create Your First Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="border-slate-800/60 hover:border-slate-700 transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${subject.color}20`, border: `1.5px solid ${subject.color}40` }}
                    >
                      <Tag className="h-5 w-5" style={{ color: subject.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-100">{subject.name}</CardTitle>
                      {subject.description && (
                        <CardDescription className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subject.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-indigo-400" onClick={() => openEdit(subject)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-rose-400"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete subject "${subject.name}"?`)) {
                          deleteMutation.mutate(subject.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                  <span className="text-xs text-slate-500 font-mono">{subject.color}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-[420px] bg-[#0b1329] border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>{editSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editSubject ? "Update subject details." : "Create a new subject to group your study plans."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-2">
              <Label className="text-slate-200">Subject Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Financial Reporting, Taxation..."
                className="bg-[#020617] border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="bg-[#020617] border-slate-700"
              />
            </div>
            <div className="grid gap-3">
              <Label className="text-slate-200">Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-lg transition-all duration-150 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b1329] scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-8 w-8 rounded-lg shrink-0" style={{ backgroundColor: color }} />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#8b5cf6"
                  className="bg-[#020617] border-slate-700 font-mono text-sm h-8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500"
              style={{ backgroundColor: color }}
            >
              {editSubject ? "Save Changes" : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
