import React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  text,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-indigo-600 border-t-transparent dark:border-indigo-500 dark:border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  )
}
