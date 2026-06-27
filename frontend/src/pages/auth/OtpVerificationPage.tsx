import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { otpSchema } from "@/lib/validators"
import { verifyOtp } from "@/api/auth"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ShieldCheck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

type OtpFormValues = z.infer<typeof otpSchema>

export const OtpVerificationPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ""

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: email,
      otp: "",
    },
  })

  const onSubmit = async (values: OtpFormValues) => {
    try {
      await verifyOtp(values)
      toast.success("Account verified successfully! Please log in.")
      navigate("/login")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP.")
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verify Email</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit OTP code sent to **{email || "your email"}**
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
                  <FormLabel className="text-center block">OTP Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        className="pl-10 text-center tracking-[0.25em] font-mono text-lg"
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
              {form.formState.isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
