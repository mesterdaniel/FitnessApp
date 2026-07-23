'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CalendarDays, Scale, Dumbbell, Trophy, TrendingUp, TrendingDown, User, Ticket, Medal, Target, Edit2, History, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProgressChart } from '@/components/client/progress-chart'
import { SingleMetricChart } from '@/components/client/metrics-chart'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientMetrics, deleteMetricLog } from '@/app/(dashboard)/coach/clients/actions'

const getBadges = (count: number) => {
  const badges = []
  if (count >= 1) badges.push({ name: 'Első Lépés', color: 'bg-blue-500/20 text-blue-400', icon: Medal })
  if (count >= 10) badges.push({ name: 'Kitartó (10)', color: 'bg-purple-500/20 text-purple-400', icon: Trophy })
  if (count >= 50) badges.push({ name: 'Mester (50)', color: 'bg-yellow-500/20 text-yellow-500', icon: Trophy })
  return badges.reverse()
}

export function ClientDetailView({ client, workouts, exerciseLogs, weightLogs, metricsLogs = [], activePass }: {
  client: any
  workouts: any[]
  exerciseLogs: any[]
  weightLogs: any[]
  metricsLogs?: any[]
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
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [metricsError, setMetricsError] = useState("")

  const handleMetricsSubmit = async (formData: FormData) => {
    setMetricsError("")
    const result = await updateClientMetrics(client.id, formData)
    if (result?.error) {
      setMetricsError(result.error)
      return
    }
    setMetricsDialogOpen(false)
    router.refresh()
  }

  const handleDeleteLog = async (logId: string) => {
    setDeletingId(logId)
    await deleteMetricLog(logId, client.id)
    setDeletingId(null)
    router.refresh()
  }

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

  // Metrics logs chart data
  const metricsChartData = [...metricsLogs].reverse().map(log => ({
    date: new Date(log.logged_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
    bodyFat: log.body_fat_pct ? parseFloat(log.body_fat_pct) : null,
    muscleMass: log.muscle_mass_kg ? parseFloat(log.muscle_mass_kg) : null,
    visceralFat: log.visceral_fat_level ? parseFloat(log.visceral_fat_level) : null,
  }))

  const hasBodyFatData = metricsChartData.some(d => d.bodyFat !== null)
  const hasMuscleMassData = metricsChartData.some(d => d.muscleMass !== null)
  const hasVisceralFatData = metricsChartData.some(d => d.visceralFat !== null)

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

      {/* Metrics & Goals */}
      <Card className="bg-card border-none rounded-lg shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="font-bold flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" /> Testösszetétel és Célok
          </CardTitle>
          <div className="flex items-center gap-1">
            {metricsLogs.length > 0 && (
              <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground hover:bg-background rounded-full px-3">
                    <History className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Előzmények ({metricsLogs.length})</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-lg max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> Mérési előzmények
                    </DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto space-y-3 pr-1 py-2 flex-1">
                    {metricsLogs.map((log: any) => (
                      <div key={log.id} className="bg-background/60 p-3.5 rounded-2xl flex items-center justify-between border border-border/50">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">
                            {new Date(log.logged_at).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-foreground">
                            {log.body_fat_pct !== null && <span>Zsír: <strong className="text-emerald-400">{log.body_fat_pct}%</strong></span>}
                            {log.muscle_mass_kg !== null && <span>Izom: <strong className="text-blue-400">{log.muscle_mass_kg}%</strong></span>}
                            {log.visceral_fat_level !== null && <span>Zsigeri zsír: <strong className="text-rose-400">{log.visceral_fat_level}</strong></span>}
                            {log.calorie_limit !== null && <span>Kalória: <strong className="text-primary">{log.calorie_limit} kcal</strong></span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === log.id}
                          onClick={() => handleDeleteLog(log.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="pt-2">
                    <Button variant="ghost" onClick={() => setHistoryDialogOpen(false)} className="rounded-full w-full">Bezárás</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={metricsDialogOpen} onOpenChange={(open) => {
              setMetricsDialogOpen(open)
              if (!open) setMetricsError("")
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Módosítás</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Mutatók és Célok beállítása</DialogTitle>
              </DialogHeader>
              <form action={handleMetricsSubmit} className="space-y-4 pt-4">
                {metricsError && (
                  <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-red-300">{metricsError}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground ml-2">Zsír (%)</Label>
                    <Input name="body_fat_pct" type="number" step="0.1" defaultValue={client.body_fat_pct || ''} placeholder="pl. 15.5" className="bg-background border-none rounded-full h-11 px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground ml-2">Izomtömeg (%)</Label>
                    <Input name="muscle_mass_kg" type="number" step="0.1" defaultValue={client.muscle_mass_kg || ''} placeholder="pl. 42.5" className="bg-background border-none rounded-full h-11 px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground ml-2">Zsigeri zsír</Label>
                    <Input name="visceral_fat_level" type="number" step="0.1" defaultValue={client.visceral_fat_level || ''} placeholder="pl. 4.0" className="bg-background border-none rounded-full h-11 px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground ml-2">Kalória limit</Label>
                    <Input name="calorie_limit" type="number" defaultValue={client.calorie_limit || ''} placeholder="pl. 2500" className="bg-background border-none rounded-full h-11 px-4" />
                  </div>
                </div>
                <DialogFooter className="mt-6 gap-2">
                  <Button type="button" variant="ghost" onClick={() => setMetricsDialogOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Mentés</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div className="bg-background/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground mb-1">Testzsír</span>
              <span className="font-bold text-lg">{client.body_fat_pct ? `${client.body_fat_pct}%` : '-'}</span>
            </div>
            <div className="bg-background/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground mb-1">Izomtömeg</span>
              <span className="font-bold text-lg">{client.muscle_mass_kg ? `${client.muscle_mass_kg}%` : '-'}</span>
            </div>
            <div className="bg-background/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground mb-1">Zsigeri zsír</span>
              <span className="font-bold text-lg">{client.visceral_fat_level || '-'}</span>
            </div>
            <div className="bg-background/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground mb-1">Kalória limit</span>
              <span className="font-bold text-lg text-primary">{client.calorie_limit ? `${client.calorie_limit} kcal` : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {hasBodyFatData && (
        <SingleMetricChart 
          data={metricsChartData.filter(d => d.bodyFat !== null)} 
          title="Testzsír alakulása" 
          description="A testzsír százalék változása" 
          dataKey="bodyFat" 
          name="Testzsír (%)" 
          color="#10b981" 
        />
      )}
      {hasMuscleMassData && (
        <SingleMetricChart 
          data={metricsChartData.filter(d => d.muscleMass !== null)} 
          title="Izomtömeg alakulása" 
          description="Az izomtömeg százalék változása" 
          dataKey="muscleMass" 
          name="Izomtömeg (%)" 
          color="#60a5fa" 
        />
      )}
      {hasVisceralFatData && (
        <SingleMetricChart 
          data={metricsChartData.filter(d => d.visceralFat !== null)} 
          title="Zsigeri zsír alakulása" 
          description="A zsigeri zsír szintjének változása" 
          dataKey="visceralFat" 
          name="Zsigeri zsír" 
          color="#f43f5e" 
        />
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
