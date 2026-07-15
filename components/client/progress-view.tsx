"use client"

import { useState } from "react"
import { ProgressChart } from "./progress-chart"
import { SingleMetricChart } from "./metrics-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trophy, Flame, Scale, TrendingDown, TrendingUp, Trash2, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addExerciseLog, addWeightLog, deleteExerciseLog, deleteWeightLog } from "@/app/(dashboard)/client/progress/actions"
import { useRouter } from "next/navigation"

const getBadges = (count: number) => {
  const badges = []
  if (count >= 1) badges.push({ name: 'Első Lépés', color: 'bg-blue-500/20 text-blue-400', icon: Trophy })
  if (count >= 10) badges.push({ name: 'Kitartó (10)', color: 'bg-purple-500/20 text-purple-400', icon: Trophy })
  if (count >= 50) badges.push({ name: 'Mester (50)', color: 'bg-yellow-500/20 text-yellow-500', icon: Trophy })
  return badges.reverse()
}

export function ProgressView({ logs, weightLogs, metricsLogs = [], completedWorkoutsCount = 0, clientProfile }: { logs: any[], weightLogs: any[], metricsLogs?: any[], completedWorkoutsCount?: number, clientProfile?: any }) {
  const router = useRouter()
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' })
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false)
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [exerciseError, setExerciseError] = useState("")
  const [weightError, setWeightError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Extract unique exercises
  const exercises = Array.from(new Set(logs.map(log => log.exercise_name)))
  
  const [selectedExercise, setSelectedExercise] = useState<string>(
    exercises.includes("Fekvenyomás") ? "Fekvenyomás" : exercises[0] || ""
  )

  // Filter logs for the selected exercise
  const rawFilteredLogs = logs
    .filter(log => log.exercise_name === selectedExercise)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

  const chartData = [...rawFilteredLogs].reverse().map(log => ({
    date: new Date(log.logged_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
    weight: log.weight,
    reps: log.reps,
  }))

  // Weight logs chart data
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

  // Stats
  const maxWeight = rawFilteredLogs.length > 0 ? Math.max(...rawFilteredLogs.map(l => l.weight)) : 0
  const totalLogs = rawFilteredLogs.length
  const currentWeight = weightLogs.length > 0 ? parseFloat(weightLogs[0].weight_kg) : null
  const previousWeight = weightLogs.length > 1 ? parseFloat(weightLogs[1].weight_kg) : null
  const weightDiff = currentWeight && previousWeight ? currentWeight - previousWeight : null

  const handleExerciseSubmit = async (formData: FormData) => {
    setExerciseError("")
    const result = await addExerciseLog(formData)
    if (result?.error) {
      setExerciseError(result.error)
      return
    }
    setExerciseDialogOpen(false)
    router.refresh()
  }

  const handleWeightSubmit = async (formData: FormData) => {
    setWeightError("")
    const result = await addWeightLog(formData)
    if (result?.error) {
      setWeightError(result.error)
      return
    }
    setWeightDialogOpen(false)
    router.refresh()
  }

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt az eredményt?")) return
    setIsDeleting(true)
    const result = await deleteExerciseLog(id)
    if (result?.error) alert(result.error)
    else router.refresh()
    setIsDeleting(false)
  }

  const handleDeleteWeight = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt a mérést?")) return
    setIsDeleting(true)
    const result = await deleteWeightLog(id)
    if (result?.error) alert(result.error)
    else router.refresh()
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-card border-none rounded-2xl p-1.5 mb-6 !h-auto gap-1 sm:flex sm:flex-wrap sm:justify-center sm:w-fit sm:rounded-full">
          <TabsTrigger value="exercises" className="rounded-xl px-4 py-2 !h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:rounded-full sm:px-6">
            Gyakorlatok
          </TabsTrigger>
          <TabsTrigger value="weight" className="rounded-xl px-4 py-2 !h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:rounded-full sm:px-6">
            Testsúly
          </TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-xl px-4 py-2 !h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:rounded-full sm:px-6">
            Mutatók
          </TabsTrigger>
          <TabsTrigger value="badges" className="rounded-xl px-4 py-2 !h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:rounded-full sm:px-6">
            Kitüntetések
          </TabsTrigger>
        </TabsList>

        {/* GYAKORLATOK TAB */}
        <TabsContent value="exercises" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Személyes rekord</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{maxWeight > 0 ? `${maxWeight} kg` : '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">Az eddigi legnagyobb emelésed</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rögzített eredmények</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalLogs} db</div>
                <p className="text-xs text-muted-foreground mt-1">Összesen ennyi bejegyzésed van</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gyakorlatok száma</CardTitle>
                <Flame className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{exercises.length} db</div>
                <p className="text-xs text-muted-foreground mt-1">Különböző gyakorlat rögzítve</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full bg-card border-none shadow-sm rounded-full h-12 sm:w-[220px]">
                <SelectValue placeholder="Válassz gyakorlatot" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                <div className="p-1">
                  {exercises.length === 0 && <SelectItem value="empty" disabled>Nincs rögzített gyakorlat</SelectItem>}
                  {exercises.map(ex => (
                    <SelectItem key={ex} value={ex} className="rounded-xl cursor-pointer">{ex}</SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>

            <Dialog open={exerciseDialogOpen} onOpenChange={(open) => {
              setExerciseDialogOpen(open)
              if (!open) setExerciseError("")
            }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold px-6 shadow-lg shadow-primary/20 sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
                  Eredmény rögzítése
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Új eredmény hozzáadása</DialogTitle>
                </DialogHeader>
                <form action={handleExerciseSubmit} className="space-y-5 pt-4">
                  {exerciseError && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-red-300">{exerciseError}</p>
                  )}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground ml-2">Gyakorlat neve</Label>
                    <Input name="exercise_name" placeholder="pl. Fekvenyomás" required className="bg-background border-none rounded-full h-12 px-4" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground ml-2">Súly (kg)</Label>
                      <Input name="weight" type="number" step="0.5" placeholder="80" required className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground ml-2">Ismétlés</Label>
                      <Input name="reps" type="number" placeholder="8" required className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6 gap-2">
                    <Button type="button" variant="ghost" onClick={() => setExerciseDialogOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Mentés</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ProgressChart data={chartData} exerciseName={selectedExercise} />

          {rawFilteredLogs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold ml-2">Előzmények</h3>
              <div className="space-y-3">
                {rawFilteredLogs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-3 p-4 bg-card rounded-lg shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold">{new Date(log.logged_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div className="text-sm text-muted-foreground mt-1">{log.exercise_name}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-background px-4 py-2 rounded-full text-sm">
                        <span className="text-muted-foreground mr-1">Ism:</span> 
                        <span className="font-bold">{log.reps}</span>
                      </div>
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                        {log.weight} kg
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleDeleteExercise(log.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TESTSÚLY TAB */}
        <TabsContent value="weight" className="space-y-6 mt-6">

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border border-primary/20 text-foreground shadow-lg shadow-primary/20 rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Jelenlegi testsúly</CardTitle>
                <Scale className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWeight ? `${currentWeight} kg` : '-'}</div>
                <p className="text-xs opacity-80 mt-1">Utolsó mérés</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Változás</CardTitle>
                {weightDiff !== null && (weightDiff > 0 ? <TrendingUp className="h-4 w-4 text-red-400" /> : <TrendingDown className="h-4 w-4 text-green-400" />)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${weightDiff !== null ? (weightDiff > 0 ? 'text-red-400' : 'text-green-400') : 'text-foreground'}`}>
                  {weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg` : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Előző méréshez képest</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mérések száma</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{weightLogs.length} db</div>
                <p className="text-xs text-muted-foreground mt-1">Rögzített testsúly</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Dialog open={weightDialogOpen} onOpenChange={(open) => {
              setWeightDialogOpen(open)
              if (!open) setWeightError("")
            }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold px-6 shadow-lg shadow-primary/20 sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
                  Testsúly rögzítése
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Testsúly rögzítése</DialogTitle>
                </DialogHeader>
                <form action={handleWeightSubmit} className="space-y-5 pt-4">
                  {weightError && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-red-300">{weightError}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground ml-2">Súly (kg)</Label>
                      <Input name="weight_kg" type="number" step="0.1" placeholder="75.5" required defaultValue={currentWeight || ''} className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground ml-2">Dátum</Label>
                      <Input name="logged_at" type="date" defaultValue={todayStr} max={todayStr} className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6 gap-2">
                    <Button type="button" variant="ghost" onClick={() => setWeightDialogOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Mentés</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ProgressChart data={weightChartData} exerciseName="Testsúly" />

          {weightLogs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold ml-2">Testsúly előzmények</h3>
              <div className="space-y-3">
                {weightLogs.map((log: any) => (
                  <div key={log.id} className="flex flex-col gap-3 p-4 bg-card rounded-lg shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-semibold">
                      {new Date(log.logged_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                        {parseFloat(log.weight_kg)} kg
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleDeleteWeight(log.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* MUTATÓK TAB */}
        <TabsContent value="metrics" className="space-y-6 mt-6">
          {clientProfile && (clientProfile.body_fat_pct || clientProfile.muscle_mass_kg || clientProfile.visceral_fat_level || clientProfile.calorie_limit) ? (
            <>
            <Card className="bg-card border-none rounded-lg shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" /> Testösszetétel és Célok
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner border border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Testzsír</span>
                    <span className="font-black text-3xl">{clientProfile.body_fat_pct ? `${clientProfile.body_fat_pct}%` : '-'}</span>
                  </div>
                  <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner border border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Izomtömeg</span>
                    <span className="font-black text-3xl">{clientProfile.muscle_mass_kg ? `${clientProfile.muscle_mass_kg} kg` : '-'}</span>
                  </div>
                  <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner border border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Zsigeri zsír</span>
                    <span className="font-black text-3xl">{clientProfile.visceral_fat_level || '-'}</span>
                  </div>
                  <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner border border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Kalória limit</span>
                    <span className="font-black text-3xl text-primary">{clientProfile.calorie_limit ? `${clientProfile.calorie_limit} kcal` : '-'}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Ezeket az értékeket és célokat az edződ állítja be számodra.
                </p>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
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
                  description="Az izomtömeg (kg) változása" 
                  dataKey="muscleMass" 
                  name="Izomtömeg (kg)" 
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
              
              {!hasBodyFatData && !hasMuscleMassData && !hasVisceralFatData && metricsLogs.length > 0 && (
                <Card className="bg-card border-none shadow-xl mt-6">
                  <CardContent className="flex h-[150px] items-center justify-center text-muted-foreground text-sm">
                    Még nincsenek felrögzítve korábbi mutató értékek a grafikonokhoz.
                  </CardContent>
                </Card>
              )}
            </div>
          </>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-bold">Nincsenek beállítva mutatók</h3>
              <p className="text-muted-foreground mt-2">Az edződ még nem adott meg testösszetétel célokat vagy kalória limitet.</p>
            </div>
          )}
        </TabsContent>

        {/* KITÜNTETÉSEK TAB */}
        <TabsContent value="badges" className="space-y-6 mt-6">
          <Card className="bg-card border-none shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Szerzett Kitüntetéseid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-zinc-800 w-28 text-center">
                  <span className="text-2xl font-bold text-foreground">{completedWorkoutsCount}</span>
                  <span className="text-xs text-muted-foreground mt-1">Elvégzett edzés</span>
                </div>
                {getBadges(completedWorkoutsCount).map((badge, idx) => {
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
                {completedWorkoutsCount === 0 && (
                  <div className="flex flex-col justify-center text-sm text-muted-foreground italic p-4">
                    Végezz el egy edzést az első kitüntetéshez!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
