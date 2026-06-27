import React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
