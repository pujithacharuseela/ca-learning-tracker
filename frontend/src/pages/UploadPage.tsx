import React, { useState } from "react"
import { uploadExcelPreview, confirmExcelImport, getUploadHistory, resetUserData, getSubjects } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, History, Trash2, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export const UploadPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch subjects to filter/map classes on import
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  // Fetch upload history
  const { data: history } = useQuery({
    queryKey: ["uploadHistory"],
    queryFn: getUploadHistory,
  })

  const [uploadProgress, setUploadProgress] = useState(0)

  // Helper to start progress simulation
  const startProgressSimulation = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.floor(Math.random() * 15) + 5
      })
    }, 150)
    return interval
  }

  // Mutations
  const previewMutation = useMutation({
    mutationFn: (selectedFile: File) => {
      const interval = startProgressSimulation()
      return uploadExcelPreview(selectedFile).finally(() => {
        clearInterval(interval)
        setUploadProgress(100)
      })
    },
    onSuccess: (data) => {
      setPreview(data)
      toast.success("Excel parsed. Review the preview before importing.")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || "Failed to parse file."
      toast.error(msg)
      setFile(null)
    },
  })

  const importMutation = useMutation({
    // We send subjectId parameter if selected so the backend maps classes correctly to that subject
    mutationFn: () => {
      const interval = startProgressSimulation()
      return confirmExcelImport(file!).finally(() => {
        clearInterval(interval)
        setUploadProgress(100)
      })
    },
    onSuccess: () => {
      toast.success("Classes imported successfully! Go to Planner to view them.")
      queryClient.invalidateQueries({ queryKey: ["uploadHistory"] })
      queryClient.invalidateQueries({ queryKey: ["classes"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["plannedClassIds"] })
      setFile(null)
      setPreview(null)
      setSelectedSubjectId("")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || "Import failed."
      toast.error(msg)
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetUserData,
    onSuccess: () => {
      toast.success("Workspace cleared. Upload a new file to start fresh.")
      queryClient.invalidateQueries({ queryKey: ["uploadHistory"] })
      queryClient.invalidateQueries({ queryKey: ["classes"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false })
      setFile(null)
      setPreview(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || "Reset failed."
      toast.error(msg)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      previewMutation.mutate(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      setFile(selectedFile)
      previewMutation.mutate(selectedFile)
    }
  }

  return (
    <div className="space-y-6 relative">
      {(previewMutation.isPending || importMutation.isPending) && (
        <div className="fixed inset-0 bg-[#020617]/80 dark:bg-[#020617]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
          <div className="bg-[#0b1329] dark:bg-[#0b1329] border border-slate-800/80 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-100 dark:text-slate-100">
                {previewMutation.isPending ? "Parsing spreadsheet..." : "Importing classes..."}
              </h3>
              <p className="text-sm text-slate-400">Please wait, do not close or refresh this page.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-indigo-400">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Upload Plan</h1>
        <Button
          variant="destructive"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear all uploaded classes, study plans, notes, and schedules? This cannot be undone.")) {
              resetMutation.mutate();
            }
          }}
          disabled={resetMutation.isPending}
          className="flex items-center gap-2 rounded-xl"
        >
          <Trash2 className="h-4 w-4" />
          {resetMutation.isPending ? "Clearing..." : "Clear Workspace"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Upload Zone */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Excel Upload</CardTitle>
            <CardDescription>
              Upload `.xlsx` files. Must contain ClassNo, Day / Topic, Duration (Minutes) and
              Duration (Hours + Minutes) columns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!preview ? (
              <div className="space-y-4">
                {/* Subject Selector before upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Select Subject mapping (Optional)</label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="bg-[#0b1329] border-slate-800 text-slate-200">
                      <SelectValue placeholder="Choose subject to assign classes..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border rounded-2xl border-dashed border-slate-800/80 bg-[#0b1329]/30 p-12 text-center hover:bg-[#0b1329]/50 transition cursor-pointer relative"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx"
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                  <p className="text-base font-medium text-slate-300">
                    Drag and drop your spreadsheet here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or click to browse from files
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/25 border border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Rows</span>
                    <p className="text-2xl font-bold mt-1 text-slate-200">
                      {preview.totalRows}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Valid Rows</span>
                    <p className="text-2xl font-bold mt-1 text-emerald-400">
                      {preview.validRowsCount}
                    </p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-rose-400">Invalid Rows</span>
                    <p className="text-2xl font-bold mt-1 text-rose-400">
                      {preview.invalidRowsCount}
                    </p>
                  </div>
                </div>

                {/* Subject Selector mapping display / change */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Target Subject Mapping</label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="bg-[#0b1329] border-slate-800 text-slate-200">
                      <SelectValue placeholder="Choose subject..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b1329] border-slate-800 text-slate-200">
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confirm Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#070d1e]/50 border border-slate-800/80 p-4 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-200 truncate">{file?.name}</span>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => { setFile(null); setPreview(null); setSelectedSubjectId("") }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={preview.validRowsCount === 0 || importMutation.isPending}
                      className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      {importMutation.isPending ? "Importing..." : "Import Valid Rows"}
                    </Button>
                  </div>
                </div>

                {/* Rows Preview Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Class No</th>
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.rows.map((row: any) => (
                        <tr key={row.rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 font-medium">{row.rowIndex}</td>
                          <td className="px-4 py-3">{row.classNo}</td>
                          <td className="px-4 py-3">{row.topic}</td>
                          <td className="px-4 py-3">{row.durationDisplay}</td>
                          <td className="px-4 py-3">
                            {row.valid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium" title={row.errorMessage}>
                                <AlertTriangle className="h-4 w-4" /> {row.errorMessage && row.errorMessage.includes("Duplicate") ? "Duplicate" : "Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-500" /> Upload History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No files uploaded yet.</p>
            ) : (
              history?.map((hist) => (
                <div key={hist.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate" title={hist.originalName}>
                        {hist.originalName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Valid: {hist.validRows} / {hist.totalRows}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] shrink-0">
                      {hist.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
