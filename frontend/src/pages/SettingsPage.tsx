import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateProfileSchema, changePasswordSchema, updateSettingsSchema } from "@/lib/validators"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, changePassword, getSettings, updateSettings } from "@/api/auth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

type ProfileFormValues = z.infer<typeof updateProfileSchema>
type PasswordFormValues = z.infer<typeof changePasswordSchema>
type SettingsFormValues = z.infer<typeof updateSettingsSchema>

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  // 1. Profile Update Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success("Profile updated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile.")
    },
  })

  // 2. Change Password Form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      passwordForm.reset()
      toast.success("Password changed successfully!")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password.")
    },
  })

  // 3. User Settings Preferences
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SettingsFormValues>) => updateSettings(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] })
      toast.success("Preferences updated!")
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal info</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit((val) => updateProfileMutation.mutate(val))} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  Save Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit((val) => changePasswordMutation.mutate(val))} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  Change Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Preferences & Notifications */}
      {!isLoading && userSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications & Preferences</CardTitle>
            <CardDescription>Manage reminder configurations and theme preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Email Notifications</h4>
                <p className="text-xs text-slate-500">Allow system to dispatch summary updates</p>
              </div>
              <Switch
                checked={userSettings.emailNotifications}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Daily Study Reminders</h4>
                <p className="text-xs text-slate-500">Get notified about scheduled task lists</p>
              </div>
              <Switch
                checked={userSettings.dailyReminder}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ dailyReminder: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
