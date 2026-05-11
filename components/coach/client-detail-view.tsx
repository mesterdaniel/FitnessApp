'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, Scale, Dumbbell, Trophy, TrendingUp, TrendingDown, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProgressChart } from '@/components/client/progress-chart'

export function ClientDetailView({ client, workouts, exerciseLogs, weightLogs }: {
  client: any
  workouts: any[]
  exerciseLogs: any[]
  weightLogs: any[]
}) {
  const router = useRouter()

  // Stats
  const totalWorkouts = workouts.length
  const completedWorkouts = workouts.filter(w => new Date(w.starts_at) < new Date()).length
  const currentWeight = weightLogs.length > 0 ? parseFloat(weightLogs[0].weight_kg) : null
  const maxWeight = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.weight)) : 0
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

  // Exercise logs chart — pick most common exercise
  const exerciseNames = exerciseLogs.map(l => l.exercise_name)
  const topExercise = exerciseNames.sort((a, b) =>
    exerciseNames.filter(v => v === b).length - exerciseNames.filter(v => v === a).length
  )[0] || ''

  const exerciseChartData = [...exerciseLogs]
    .filter(l => l.exercise_name === topExercise)
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
          <p className="break-words text-sm text-zinc-500">
            {client.fitness_level && `${client.fitness_level} szint`}
            {age && ` • ${age} éves`}
            {client.height_cm && ` • ${client.height_cm} cm`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary border-none text-primary-foreground shadow-lg shadow-primary/20 rounded-3xl">
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-5 w-5 mx-auto opacity-80 mb-1" />
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs opacity-80">Összes edzés</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardContent className="p-4 text-center">
            <Dumbbell className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
            <div className="text-2xl font-bold text-zinc-100">{completedWorkouts}</div>
            <p className="text-xs text-zinc-500">Elvégzett</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardContent className="p-4 text-center">
            <Scale className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
            <div className="text-2xl font-bold text-zinc-100">{currentWeight ? `${currentWeight} kg` : '-'}</div>
            <p className="text-xs text-zinc-500">Testsúly</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <div className="text-2xl font-bold text-zinc-100">{maxWeight > 0 ? `${maxWeight} kg` : '-'}</div>
            <p className="text-xs text-zinc-500">PR (max súly)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {weightChartData.length > 1 && (
        <ProgressChart data={weightChartData} exerciseName="Testsúly változása" />
      )}
      
      {exerciseChartData.length > 1 && (
        <ProgressChart data={exerciseChartData} exerciseName={`Fejlődés: ${topExercise}`} />
      )}

      {/* Workout History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Edzés előzmények</h2>
        <div className="space-y-3">
          {workouts.length > 0 ? (
            workouts.map((workout: any) => {
              const status = workout.workout_participants?.[0]?.status
              const isPast = new Date(workout.starts_at) < new Date()
              return (
                <Card key={workout.id} className="bg-card border-none shadow-sm rounded-3xl">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPast ? 'bg-zinc-800' : 'bg-primary/10'}`}>
                        <CalendarDays className={`h-5 w-5 ${isPast ? 'text-zinc-500' : 'text-primary'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="break-words font-semibold leading-tight text-zinc-100">{workout.title}</h4>
                        <p className="text-xs text-zinc-500">
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
            <p className="text-zinc-500 text-sm text-center py-8">Még nem volt közös edzés.</p>
          )}
        </div>
      </div>
    </div>
  )
}
