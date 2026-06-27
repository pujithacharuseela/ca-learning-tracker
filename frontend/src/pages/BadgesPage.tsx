import React from "react"
import { getBadges, getAchievements, getStreak } from "@/api/gamification"
import { useQuery } from "@tanstack/react-query"
import { Flame, CheckCircle, Sparkles } from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export const BadgesPage: React.FC = () => {
  // Fetch streak, achievements, and badges
  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: getStreak,
  })

  const { data: badges } = useQuery({
    queryKey: ["badges"],
    queryFn: getBadges,
  })

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
  })

  const isEarned = (badgeId: string) => {
    return achievements?.some((ach) => ach.badge.id === badgeId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Badges & Streaks</h1>
        <p className="text-slate-500 text-sm mt-1">Unlock badges, track your learning consistency, and build streaks.</p>
      </div>

      {/* Streak Dashboard Card */}
      <Card className="bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border-orange-200/50">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30">
              <Flame className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-500">Current Study Streak</span>
              <p className="text-4xl font-extrabold mt-1 text-slate-900">{streak?.currentStreak || 0} Days</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full font-semibold border border-orange-100">
            <Sparkles className="h-4 w-4" /> Keep the streak alive! Study daily.
          </div>
        </CardContent>
      </Card>

      {/* Badges Matrix */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Earned & Locked Badges</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {badges?.map((badge) => {
            const earned = isEarned(badge.id)
            return (
              <Card key={badge.id} className={`transition relative overflow-hidden ${earned ? "border-amber-200 bg-amber-50/10" : "opacity-60"}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto text-4xl mb-2 p-3 rounded-full bg-slate-50 dark:bg-slate-900 border">
                    {badge.icon || "🏆"}
                  </div>
                  <CardTitle className="text-sm font-bold">{badge.displayName}</CardTitle>
                  <CardDescription className="text-xs pt-1">{badge.description}</CardDescription>
                </CardHeader>
                {earned && (
                  <div className="absolute top-2 right-2 text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Earned
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
