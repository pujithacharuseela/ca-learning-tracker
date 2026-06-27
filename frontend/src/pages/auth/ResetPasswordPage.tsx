import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { resetPasswordSchema } from "@/lib/validators"
import { resetPassword } from "@/api/auth"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ShieldCheck, Lock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ""

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: email,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await resetPassword(values)
      toast.success("Password has been reset successfully! Please sign in.")
      navigate("/login")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Password reset failed. Verify your code.")
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">New Password</CardTitle>
        <CardDescription className="text-center">
          Enter the code sent to your email to configure a new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input placeholder="123456" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="••••••••"
                        type="password"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="••••••••"
                        type="password"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/20"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Updating password..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
