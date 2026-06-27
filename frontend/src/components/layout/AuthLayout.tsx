import React from "react"
import { Outlet } from "react-router-dom"

export const AuthLayout: React.FC = () => {

  // If already authenticated, navigation is handled in routes or page redirection
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 py-12 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[30%] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/20" />
        <div className="absolute bottom-[20%] right-[30%] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[100px] dark:bg-violet-500/20" />
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <span className="text-2xl font-bold">L</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Learning Tracker
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your personal hub for smart study planning
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  )
}
