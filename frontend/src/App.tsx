import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

import { ProtectedRoute } from "@/components/shared/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"

import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { OtpVerificationPage } from "@/pages/auth/OtpVerificationPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

import { DashboardPage } from "@/pages/DashboardPage"
import { SubjectsPage } from "@/pages/SubjectsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { UploadPage } from "@/pages/UploadPage"
import { PlannerPage } from "@/pages/PlannerPage"
import { CalendarPage } from "@/pages/CalendarPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { BadgesPage } from "@/pages/BadgesPage"
import { Toaster } from "@/components/ui/toaster"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-otp" element={<OtpVerificationPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Secure App Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/badges" element={<BadgesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<DashboardPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
export default App
