import React, { useState } from "react"
import { uploadExcelPreview, confirmExcelImport, getUploadHistory, resetUserData } from "@/api/planner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, History, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

export const UploadPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch upload history
  const { data: history } = useQuery({
    queryKey: ["uploadHistory"],
    queryFn: getUploadHistory,
  })

  // Mutations
  const previewMutation = useMutation({
    mutationFn: uploadExcelPreview,
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
    mutationFn: () => confirmExcelImport(file!),
    onSuccess: () => {
      toast.success("Import completed successfully!")
      queryClient.invalidateQueries({ queryKey: ["uploadHistory"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setFile(null)
      setPreview(null)
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
      toast.success("Workspace reset. All previous classes and plans cleared successfully.")
      queryClient.invalidateQueries({ queryKey: ["uploadHistory"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
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
        <div className="absolute inset-0 bg-[#020617]/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl min-h-[400px]">
          <LoadingSpinner size="lg" text={previewMutation.isPending ? "Parsing spreadsheet..." : "Importing classes..."} />
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

                {/* Confirm Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#070d1e]/50 border border-slate-800/80 p-4 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-200 truncate">{file?.name}</span>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => { setFile(null); setPreview(null); }}>
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
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold truncate max-w-[150px]">{hist.originalName}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-slate-900 dark:text-indigo-400">
                      {hist.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Valid: {hist.validRows} / {hist.totalRows}</span>
                    <span>{new Date(hist.uploadedAt).toLocaleDateString()}</span>
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
