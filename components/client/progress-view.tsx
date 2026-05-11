"use client"

import { useState } from "react"
import { ProgressChart } from "./progress-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trophy, Flame, Scale, TrendingDown, TrendingUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addExerciseLog, addWeightLog } from "@/app/(dashboard)/client/progress/actions"
import { useRouter } from "next/navigation"

export function ProgressView({ logs, weightLogs }: { logs: any[], weightLogs: any[] }) {
  const router = useRouter()
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false)
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [exerciseError, setExerciseError] = useState("")
  const [weightError, setWeightError] = useState("")
  
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

  // Stats
  const maxWeight = logs.length > 0 ? Math.max(...logs.map(l => l.weight)) : 0
  const totalLogs = logs.length
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border-none rounded-full p-1 h-auto sm:w-fit">
          <TabsTrigger value="exercises" className="rounded-full px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
            Gyakorlatok
          </TabsTrigger>
          <TabsTrigger value="weight" className="rounded-full px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
            Testsúly
          </TabsTrigger>
        </TabsList>

        {/* GYAKORLATOK TAB */}
        <TabsContent value="exercises" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border-none rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Személyes rekord</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-100">{maxWeight > 0 ? `${maxWeight} kg` : '-'}</div>
                <p className="text-xs text-zinc-500 mt-1">Az eddigi legnagyobb emelésed</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Rögzített eredmények</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-100">{totalLogs} db</div>
                <p className="text-xs text-zinc-500 mt-1">Összesen ennyi bejegyzésed van</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Gyakorlatok száma</CardTitle>
                <Flame className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-100">{exercises.length} db</div>
                <p className="text-xs text-zinc-500 mt-1">Különböző gyakorlat rögzítve</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full bg-card border-none shadow-sm rounded-full h-12 sm:w-[220px]">
                <SelectValue placeholder="Válassz gyakorlatot" />
              </SelectTrigger>
              <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                {exercises.length === 0 && <SelectItem value="empty" disabled>Nincs rögzített gyakorlat</SelectItem>}
                {exercises.map(ex => (
                  <SelectItem key={ex} value={ex} className="rounded-xl">{ex}</SelectItem>
                ))}
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
                    <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-red-300">{exerciseError}</p>
                  )}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-2">Gyakorlat neve</Label>
                    <Input name="exercise_name" placeholder="pl. Fekvenyomás" required className="bg-background border-none rounded-full h-12 px-4" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-2">Súly (kg)</Label>
                      <Input name="weight" type="number" step="0.5" placeholder="80" required className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-2">Ismétlés</Label>
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
                  <div key={log.id} className="flex flex-col gap-3 p-4 bg-card rounded-3xl shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold">{new Date(log.logged_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div className="text-sm text-zinc-400 mt-1">{log.exercise_name}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-background px-4 py-2 rounded-full text-sm">
                        <span className="text-zinc-500 mr-1">Ism:</span> 
                        <span className="font-bold">{log.reps}</span>
                      </div>
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                        {log.weight} kg
                      </div>
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
            <Card className="bg-primary border-none text-primary-foreground shadow-lg shadow-primary/20 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Jelenlegi testsúly</CardTitle>
                <Scale className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWeight ? `${currentWeight} kg` : '-'}</div>
                <p className="text-xs opacity-80 mt-1">Utolsó mérés</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Változás</CardTitle>
                {weightDiff !== null && (weightDiff > 0 ? <TrendingUp className="h-4 w-4 text-red-400" /> : <TrendingDown className="h-4 w-4 text-green-400" />)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${weightDiff !== null ? (weightDiff > 0 ? 'text-red-400' : 'text-green-400') : 'text-zinc-100'}`}>
                  {weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg` : '-'}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Előző méréshez képest</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-none rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Mérések száma</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-100">{weightLogs.length} db</div>
                <p className="text-xs text-zinc-500 mt-1">Rögzített testsúly</p>
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
                    <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-red-300">{weightError}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-2">Súly (kg)</Label>
                      <Input name="weight_kg" type="number" step="0.1" placeholder="75.5" required defaultValue={currentWeight || ''} className="bg-background border-none rounded-full h-12 px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-2">Dátum</Label>
                      <Input name="logged_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-background border-none rounded-full h-12 px-4" />
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
                  <div key={log.id} className="flex flex-col gap-3 p-4 bg-card rounded-3xl shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-semibold">
                      {new Date(log.logged_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                      {parseFloat(log.weight_kg)} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
