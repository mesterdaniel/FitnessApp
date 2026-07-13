'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CalendarDays, Scale, Dumbbell, Trophy, TrendingUp, TrendingDown, User, Ticket, Medal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProgressChart } from '@/components/client/progress-chart'

const getBadges = (count: number) => {
  const badges = []
  if (count >= 1) badges.push({ name: 'Első Lépés', color: 'bg-blue-500/20 text-blue-400', icon: Medal })
  if (count >= 10) badges.push({ name: 'Kitartó (10)', color: 'bg-purple-500/20 text-purple-400', icon: Trophy })
  if (count >= 50) badges.push({ name: 'Mester (50)', color: 'bg-yellow-500/20 text-yellow-500', icon: Trophy })
  return badges.reverse()
}

export function ClientDetailView({ client, workouts, exerciseLogs, weightLogs, activePass }: {
  client: any
  workouts: any[]
  exerciseLogs: any[]
  weightLogs: any[]
  activePass?: any
}) {
  const router = useRouter()

  // Stats
  const totalWorkouts = workouts.length
  const completedWorkouts = workouts.filter(w => new Date(w.starts_at) < new Date()).length
  const currentWeight = weightLogs.length > 0 ? parseFloat(weightLogs[0].weight_kg) : null
  
  const exerciseNames = Array.from(new Set(exerciseLogs.map(l => l.exercise_name)))
  const defaultTopExercise = [...exerciseNames].sort((a, b) =>
    exerciseLogs.filter(v => v.exercise_name === b).length - exerciseLogs.filter(v => v.exercise_name === a).length
  )[0] || ''

  const [selectedExercise, setSelectedExercise] = useState<string>(defaultTopExercise)

  const rawFilteredLogs = exerciseLogs
    .filter(log => log.exercise_name === selectedExercise)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

  const maxWeight = rawFilteredLogs.length > 0 ? Math.max(...rawFilteredLogs.map(l => l.weight)) : 0
  const age = client.birth_date ? (() => {
    const birth = new Date(client.birth_date)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years--
    return years
  })() : null

  // Weight chart data
  const weightChartData = [...weightLogs].reverse().map(log => ({
    date: new Date(log.logged_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
    weight: parseFloat(log.weight_kg),
  }))

  const exerciseChartData = [...rawFilteredLogs]
    .reverse()
    .map(log => ({
      date: new Date(log.logged_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
      weight: log.weight,
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/coach/clients')} className="rounded-full p-2 h-auto hover:bg-background">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/20">
          <AvatarImage src={`https://avatar.vercel.sh/${client.id}`} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {client.full_name?.[0]?.toUpperCase() || 'C'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold leading-tight">{client.full_name || 'Névtelen Kliens'}</h1>
          <p className="break-words text-sm text-muted-foreground">
            {client.fitness_level && `${client.fitness_level} szint`}
            {age && ` • ${age} éves`}
            {client.height_cm && ` • ${client.height_cm} cm`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto mt-0">
          {activePass && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mr-2 shadow-sm border border-primary/20" title="Aktív bérlet">
              <Ticket className="w-4 h-4" />
              <span className="text-sm font-bold">{activePass.total_occasions - activePass.used_occasions} / {activePass.total_occasions} alkalom</span>
            </div>
          )}
          <Button variant="outline" onClick={() => router.push('/coach/passes')} className="rounded-full shadow-md bg-card border-none hover:bg-card">
            <Ticket className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Bérletek Kezelése</span>
          </Button>
        </div>
      </div>

      {/* Bio / Goals */}
      {client.bio && (
        <Card className="bg-card border-none rounded-lg shadow-md">
          <CardContent className="p-5">
            <h3 className="font-bold mb-2 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Célok & Magamról</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{client.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border border-primary/20 text-foreground shadow-lg shadow-primary/20 rounded-lg">
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-5 w-5 mx-auto opacity-80 mb-1" />
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs opacity-80">Összes edzés</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-lg shadow-md">
          <CardContent className="p-4 text-center">
            <Dumbbell className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold text-foreground">{completedWorkouts}</div>
            <p className="text-xs text-muted-foreground">Elvégzett</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-lg shadow-md">
          <CardContent className="p-4 text-center">
            <Scale className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold text-foreground">{currentWeight ? `${currentWeight} kg` : '-'}</div>
            <p className="text-xs text-muted-foreground">Testsúly</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-lg shadow-md">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <div className="text-2xl font-bold text-foreground">{maxWeight > 0 ? `${maxWeight} kg` : '-'}</div>
            <p className="text-xs text-muted-foreground truncate" title={selectedExercise || 'PR (max súly)'}>
              {selectedExercise ? `PR (${selectedExercise})` : 'PR'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Selector */}
      {exerciseNames.length > 0 && (
        <div className="flex justify-end">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-full bg-card border-none shadow-sm rounded-full h-12 sm:w-[220px]">
              <SelectValue placeholder="Válassz gyakorlatot" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
              <div className="p-1">
                {exerciseNames.map(ex => (
                  <SelectItem key={ex} value={ex} className="rounded-xl cursor-pointer">{ex}</SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Charts */}
      {weightChartData.length > 1 && (
        <ProgressChart data={weightChartData} exerciseName="Testsúly változása" />
      )}
      
      {exerciseChartData.length > 1 && (
        <ProgressChart data={exerciseChartData} exerciseName={`Fejlődés: ${selectedExercise}`} />
      )}

      {/* Gamification Badges */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Kitüntetések</h2>
        <div className="flex flex-wrap gap-4">
          {getBadges(completedWorkouts).map((badge, idx) => {
            const Icon = badge.icon
            return (
              <div key={idx} className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-zinc-800 w-28 text-center">
                <div className={`p-2 rounded-full mb-2 ${badge.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{badge.name}</span>
              </div>
            )
          })}
          {completedWorkouts === 0 && (
            <p className="text-sm text-muted-foreground italic p-4">Még nincs megszerzett kitüntetés.</p>
          )}
        </div>
      </div>

      {/* Workout History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Edzés előzmények</h2>
        <div className="space-y-3">
          {workouts.length > 0 ? (
            workouts.map((workout: any) => {
              const status = workout.workout_participants?.[0]?.status
              const isPast = new Date(workout.starts_at) < new Date()
              return (
                <Card key={workout.id} className="bg-card border-none shadow-sm rounded-lg">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPast ? 'bg-zinc-800' : 'bg-primary/10'}`}>
                        <CalendarDays className={`h-5 w-5 ${isPast ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="break-words font-semibold leading-tight text-foreground">{workout.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(workout.starts_at).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      status === 'accepted' ? 'bg-primary/20 text-primary' :
                      status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {status === 'accepted' ? (isPast ? 'Elvégezve' : 'Elfogadva') : status === 'rejected' ? 'Elutasítva' : 'Függőben'}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Még nem volt közös edzés.</p>
          )}
        </div>
      </div>
    </div>
  )
}
