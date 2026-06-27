import React, { useState } from "react"
import { getSubjects, createSubject, updateSubject, deleteSubject, type SubjectData } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, BookOpen, Tag, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 75 + Math.floor(Math.random() * 15) // 75-90%
  const lightness = 55 + Math.floor(Math.random() * 10) // 55-65%
  const h = hue
  const s = saturation / 100
  const l = lightness / 100
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const colorVal = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * colorVal).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`
}

export const SubjectsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<SubjectData | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#8b5cf6")
  const [description, setDescription] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  // Filter subjects based on search term
  const filteredSubjects = React.useMemo(() => {
    if (!subjects) return []
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [subjects, searchTerm])

  // Paginated subjects
  const paginatedSubjects = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredSubjects.slice(startIndex, startIndex + pageSize)
  }, [filteredSubjects, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize))

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
    setName(""); setColor(generateRandomColor()); setDescription("")
    setIsOpen(true)
  }

  const openEdit = (s: SubjectData) => {
    setEditSubject(s)
    setName(s.name); setColor(s.color); setDescription(s.description || "")
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false); setEditSubject(null)
    setName(""); setColor("#8b5cf6"); setDescription("")
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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        <p className="text-slate-500 font-medium text-sm">Loading subjects...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">Organize your study topics by subject before creating plans</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-500 flex items-center gap-2 rounded-xl shrink-0">
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="relative w-full md:max-w-xs">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          className="pl-10 bg-[#020617] border-slate-800"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <Card className="border-dashed border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BookOpen className="h-12 w-12 text-slate-700" />
            <div className="text-center">
              <p className="font-semibold text-slate-300">No subjects found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm ? "No subjects match your search criteria." : 'Add subjects like "Financial Reporting", "Taxation" to organize your plans.'}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-500 mt-2">
                <Plus className="h-4 w-4 mr-2" /> Create Your First Subject
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedSubjects.map((subject) => (
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

          {/* Pagination controls */}
          {filteredSubjects.length > pageSize && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-800/60 mt-4">
              <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-800 hover:bg-slate-900"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-800 hover:bg-slate-900"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
              <Label className="text-slate-200">Subject Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl shrink-0 border border-slate-700 transition-all duration-300" style={{ backgroundColor: color }} />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#8b5cf6"
                  className="bg-[#020617] border-slate-700 font-mono text-sm h-10 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-850 text-slate-300 hover:bg-slate-800"
                  onClick={() => setColor(generateRandomColor())}
                >
                  Randomize
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {editSubject ? "Save Changes" : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
