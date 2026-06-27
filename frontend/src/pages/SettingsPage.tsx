import React, { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, getSettings, updateSettings, updateProfilePicture } from "@/api/auth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User, Bell, Camera } from "lucide-react"

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [email, setEmail] = useState(user?.email || "")
  
  // Initialize profile picture from user details or local storage fallback
  const [profilePic, setProfilePic] = useState<string>(() => {
    return user?.profilePicture || localStorage.getItem(`profile_pic_${user?.email}`) || ""
  })

  const updateProfileMutation = useMutation({
    mutationFn: () => updateProfile({ firstName, lastName, email }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success("Profile updated successfully!")
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update profile."),
  })

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] })
      toast.success("Preferences updated!")
    },
  })

  const updatePictureMutation = useMutation({
    mutationFn: (base64: string) => updateProfilePicture(base64),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      localStorage.setItem(`profile_pic_${user?.email}`, updatedUser.profilePicture || "")
      window.dispatchEvent(new Event("profile-picture-updated"))
      toast.success("Profile photo updated successfully!")
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to upload photo."),
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setProfilePic(base64String)
        updatePictureMutation.mutate(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const getInitials = () => {
    if (!user) return "U"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 dark:text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Pic Upload Card */}
        <Card className="border-slate-800/60 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-violet-500/30 flex items-center justify-center bg-violet-600/10 text-violet-400 text-3xl font-bold">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-violet-600 rounded-full cursor-pointer hover:bg-violet-500 transition-colors shadow">
              <Camera className="h-4 w-4 text-white" />
              <input type="file" onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-200">{user?.firstName} {user?.lastName}</h3>
            <p className="text-xs text-slate-500 mt-1">Upload a PNG or JPG photo</p>
          </div>
        </Card>

        {/* Profile Card */}
        <Card className="border-slate-800/60 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-400" />
              <CardTitle className="text-slate-100">Profile Details</CardTitle>
            </div>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#020617] border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#020617] border-slate-700 text-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#020617] border-slate-700 text-slate-200"
              />
            </div>
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      {!isLoading && userSettings && (
        <Card className="border-slate-800/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-violet-400" />
              <CardTitle className="text-slate-100">Notifications & Preferences</CardTitle>
            </div>
            <CardDescription>Manage your reminder and notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
              <div>
                <h4 className="font-semibold text-slate-200">Email Notifications</h4>
                <p className="text-xs text-slate-500 mt-0.5">Receive summary emails about your progress</p>
              </div>
              <Switch
                checked={userSettings.emailNotifications}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="font-semibold text-slate-200">Daily Study Reminders</h4>
                <p className="text-xs text-slate-500 mt-0.5">Get notified about your scheduled study sessions</p>
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
