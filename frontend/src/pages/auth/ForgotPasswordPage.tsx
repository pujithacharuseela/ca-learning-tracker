import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { forgotPasswordSchema } from "@/lib/validators"
import { forgotPassword } from "@/api/auth"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Mail, ArrowLeft } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSent, setIsSent] = useState(false)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await forgotPassword(values)
      toast.success("Verification code sent! Check your inbox.")
      setIsSent(true)
      setTimeout(() => {
        navigate("/reset-password", { state: { email: values.email } })
      }, 2000)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to trigger OTP. Try again.")
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <Link
            to="/login"
            className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email to receive a password reset verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <div className="text-center py-4 text-emerald-600 dark:text-emerald-400 font-medium">
            Verification code triggered. Redirecting to reset page...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="name@example.com"
                          type="email"
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
                {form.formState.isSubmitting ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
