import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { Theme } from "@/types"
import { Sun, Moon, Bell, LogOut, User as UserIcon, Settings as SettingsIcon, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "./Sidebar"

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const getInitials = () => {
    if (!user) return "U"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#020617]/75 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-300" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-slate-850">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <h2 className="text-lg font-semibold text-slate-100 hidden md:block">
          Welcome back, {user?.firstName || "Learner"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === Theme.DARK ? (
            <Sun className="h-5 w-5 text-amber-400 transition-all" />
          ) : (
            <Moon className="h-5 w-5 text-violet-400 transition-all" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-violet-500/20">
                <AvatarFallback className="bg-violet-600/20 text-violet-400 font-bold border border-violet-500/20">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
