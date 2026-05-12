"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CalendarDays, Clock, MapPin, User, Trash2, Users, Check, X, List, Settings2, Link as LinkIcon } from "lucide-react"
import { addWorkout, updateWorkout, deleteWorkout, updateParticipantStatus } from "@/app/(dashboard)/coach/workouts/actions"
import { WorkoutCalendar } from "@/components/shared/workout-calendar"

type PlanExercise = {
  key: string
  id?: string
  exercise_name: string
  sets: number
  reps: number
  weight_target: string
  rpe: string
  rir: string
  rest_seconds: string
  is_superset: boolean
}

export function CoachWorkoutsView({ workouts, clients, exercises: coachExercises }: { workouts: any[], clients: any[], exercises?: any[] }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<any>(null)
  const [newPlanExercises, setNewPlanExercises] = useState<PlanExercise[]>([])
  const [editPlanExercises, setEditPlanExercises] = useState<PlanExercise[]>([])
  const [expandedAdvanced, setExpandedAdvanced] = useState<Record<string, boolean>>({})

  const createPlanRow = (exerciseName = ""): PlanExercise => ({
    key: crypto.randomUUID(),
    exercise_name: exerciseName,
    sets: 3,
    reps: 10,
    weight_target: "",
    rpe: "",
    rir: "",
    rest_seconds: "",
    is_superset: false,
  })

  const getAssignedClientId = (workout: any) => {
    const acceptedParticipant = workout.workout_participants?.find((p: any) => p.status === 'accepted')
    return workout.client_id || acceptedParticipant?.client_id || "open"
  }

  const addPlanExercise = (mode: 'new' | 'edit') => {
    const firstExerciseName = coachExercises?.[0]?.name || ""
    const updater = mode === 'new' ? setNewPlanExercises : setEditPlanExercises
    updater((items) => [...items, createPlanRow(firstExerciseName)])
  }

  const updatePlanExercise = (
    mode: 'new' | 'edit',
    key: string,
    field: keyof Omit<PlanExercise, 'key' | 'id'>,
    value: string | number | boolean
  ) => {
    const updater = mode === 'new' ? setNewPlanExercises : setEditPlanExercises
    updater((items) =>
      items.map((item) => item.key === key ? { ...item, [field]: value } : item)
    )
  }

  const removePlanExercise = (mode: 'new' | 'edit', key: string) => {
    const updater = mode === 'new' ? setNewPlanExercises : setEditPlanExercises
    updater((items) => items.filter((item) => item.key !== key))
  }

  const toggleAdvanced = (key: string) => {
    setExpandedAdvanced(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddSubmit = async (formData: FormData) => {
    const res = await addWorkout(formData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setOpen(false)
      setNewPlanExercises([])
    }
  }

  const handleEditSubmit = async (formData: FormData) => {
    const res = await updateWorkout(formData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setEditOpen(false)
      setEditingWorkout(null)
      setEditPlanExercises([])
    }
  }

  const handleStatusChange = async (participantId: string, status: 'accepted' | 'rejected') => {
    const res = await updateParticipantStatus(participantId, status)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Biztosan törölni szeretnéd ezt az edzést?")) {
      const res = await deleteWorkout(id)
      if (res && res.error) {
        alert("Hiba: " + res.error)
      } else {
        setEditOpen(false)
        setEditingWorkout(null)
        setEditPlanExercises([])
      }
    }
  }

  const openEditModal = (workout: any) => {
    setEditingWorkout(workout)
    setEditPlanExercises((workout.workout_exercises || [])
      .slice()
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((exercise: any) => ({
        key: exercise.id || crypto.randomUUID(),
        id: exercise.id,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_target: exercise.weight_target ? String(exercise.weight_target) : "",
        rpe: exercise.rpe ? String(exercise.rpe) : "",
        rir: exercise.rir ? String(exercise.rir) : "",
        rest_seconds: exercise.rest_seconds ? String(exercise.rest_seconds) : "",
        is_superset: exercise.is_superset || false,
      })))
    setEditOpen(true)
  }

  // Calendar data
  const calendarWorkouts = workouts.map(w => ({
    id: w.id,
    title: w.title,
    starts_at: w.starts_at,
    duration_min: w.duration_min,
    status: w.status,
    capacity: w.capacity,
    participantCount: w.workout_participants?.filter((p: any) => p.status === 'accepted').length || 0,
  }))

  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')

  const handleDayClick = (date: string, dayWorkouts: any[]) => {
    setSelectedDate(date)
    const fullWorkouts = dayWorkouts.map(dw => workouts.find(w => w.id === dw.id)).filter(Boolean)
    setSelectedDayWorkouts(fullWorkouts)
  }

  const renderPlanBuilder = (mode: 'new' | 'edit') => {
    const planExercises = mode === 'new' ? newPlanExercises : editPlanExercises

    return (
      <div className="space-y-3 rounded-2xl bg-background/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-zinc-300 ml-1">Gyakorlatok hozzáadása</Label>
            <p className="text-xs text-zinc-500 ml-1 mt-1">A kliens ezt edzéstervként fogja látni.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => addPlanExercise(mode)}
            className="rounded-full border-zinc-700 bg-card hover:bg-card/80 shrink-0"
            disabled={!coachExercises || coachExercises.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" /> Gyakorlat
          </Button>
        </div>

        {(!coachExercises || coachExercises.length === 0) && (
          <p className="text-sm text-zinc-500">Előbb adj hozzá gyakorlatokat a gyakorlat-könyvtárban.</p>
        )}

        <div className="space-y-3">
          {planExercises.map((exercise, index) => {
            const isAdvanced = expandedAdvanced[exercise.key]
            return (
              <div key={exercise.key} className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-sm border border-zinc-800">
                <input type="hidden" name="workout_exercise_id" value={exercise.id || ""} />
                <input type="hidden" name="workout_exercise_name" value={exercise.exercise_name} />
                <input type="hidden" name="workout_exercise_sets" value={exercise.sets} />
                <input type="hidden" name="workout_exercise_reps" value={exercise.reps} />
                <input type="hidden" name="workout_exercise_weight_target" value={exercise.weight_target} />
                <input type="hidden" name="workout_exercise_rpe" value={exercise.rpe} />
                <input type="hidden" name="workout_exercise_rir" value={exercise.rir} />
                <input type="hidden" name="workout_exercise_rest_seconds" value={exercise.rest_seconds} />
                <input type="hidden" name="workout_exercise_is_superset" value={exercise.is_superset ? "true" : "false"} />

                <div className="grid gap-3 md:grid-cols-[1fr_72px_88px_104px_auto_40px] items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Gyakorlat {exercise.is_superset && <span className="text-primary ml-1">(Szuperszett)</span>}</Label>
                    <Select
                      value={exercise.exercise_name}
                      onValueChange={(value) => updatePlanExercise(mode, exercise.key, 'exercise_name', value)}
                    >
                      <SelectTrigger className="w-full bg-background border-none rounded-full h-10 px-3">
                        <SelectValue placeholder="Válassz" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                        {(coachExercises || []).map((coachExercise) => (
                          <SelectItem key={coachExercise.id} value={coachExercise.name} className="rounded-xl py-2.5">
                            {coachExercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Sor.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(event) => updatePlanExercise(mode, exercise.key, 'sets', parseInt(event.target.value || '0', 10))}
                      className="bg-background border-none rounded-full h-10 px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Ism.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(event) => updatePlanExercise(mode, exercise.key, 'reps', parseInt(event.target.value || '0', 10))}
                      className="bg-background border-none rounded-full h-10 px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Cél kg</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={exercise.weight_target}
                      onChange={(event) => updatePlanExercise(mode, exercise.key, 'weight_target', event.target.value)}
                      placeholder="-"
                      className="bg-background border-none rounded-full h-10 px-3"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleAdvanced(exercise.key)}
                    className={`h-10 rounded-full px-3 text-xs ${isAdvanced ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-200 hover:bg-background'}`}
                  >
                    <Settings2 className="w-4 h-4 mr-1" />
                    Haladó
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removePlanExercise(mode, exercise.key)}
                    className="self-end rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive h-10 w-10 p-0"
                    aria-label="Gyakorlat törlése"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Haladó mezők */}
                {isAdvanced && (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mt-2 p-3 bg-background/50 rounded-2xl border border-zinc-800/50">
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">RPE (1-10)</Label>
                      <Input
                        type="number"
                        min="1" max="10"
                        value={exercise.rpe}
                        onChange={(event) => updatePlanExercise(mode, exercise.key, 'rpe', event.target.value)}
                        placeholder="Erőkifejtés"
                        className="bg-background border-none rounded-full h-9 px-3 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">RIR (0-10)</Label>
                      <Input
                        type="number"
                        min="0" max="10"
                        value={exercise.rir}
                        onChange={(event) => updatePlanExercise(mode, exercise.key, 'rir', event.target.value)}
                        placeholder="Tartalék"
                        className="bg-background border-none rounded-full h-9 px-3 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">Pihenő (mp)</Label>
                      <Input
                        type="number"
                        min="0" step="15"
                        value={exercise.rest_seconds}
                        onChange={(event) => updatePlanExercise(mode, exercise.key, 'rest_seconds', event.target.value)}
                        placeholder="Pl. 90"
                        className="bg-background border-none rounded-full h-9 px-3 text-sm"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <Button
                        type="button"
                        variant={exercise.is_superset ? "default" : "outline"}
                        onClick={() => updatePlanExercise(mode, exercise.key, 'is_superset', !exercise.is_superset)}
                        className={`h-9 w-full rounded-full text-xs font-semibold ${exercise.is_superset ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'border-zinc-700 bg-transparent text-zinc-400'}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                        Szuperszett
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Kiadott edzések</h2>
        
        <Dialog open={open} onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setNewPlanExercises([])
            setExpandedAdvanced({})
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold px-6 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
              Új edzés
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Új edzés kiírása</DialogTitle>
            </DialogHeader>
            <form action={handleAddSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-zinc-400 ml-2">Kliens / Foglalhatóság</Label>
                <Select name="client_id" required defaultValue="open">
                  <SelectTrigger className="w-full bg-background border-none rounded-full h-12 px-4">
                    <SelectValue placeholder="Válassz klienst" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-none rounded-2xl shadow-xl p-2">
                    <SelectItem value="open" className="rounded-xl py-2.5 font-bold text-primary">Bárki (Szabad időpont)</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="rounded-xl py-2.5">{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-400 ml-2">Edzés megnevezése</Label>
                <Input id="title" name="title" placeholder="pl. Teljes test átmozgatás" required className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-zinc-400 ml-2">Dátum</Label>
                  <Input id="date" name="date" type="date" required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-zinc-400 ml-2">Időpont</Label>
                  <Input id="time" name="time" type="time" required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration_min" className="text-zinc-400 ml-2">Időtartam (perc)</Label>
                  <Input id="duration_min" name="duration_min" type="number" defaultValue="60" required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-zinc-400 ml-2">Létszám (fő)</Label>
                  <Input id="capacity" name="capacity" type="number" defaultValue="1" required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-zinc-400 ml-2">Helyszín (opcionális)</Label>
                <Input id="location" name="location" placeholder="pl. Cutler Gym" className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-zinc-400 ml-2">Megjegyzés (opcionális)</Label>
                <Textarea id="notes" name="notes" placeholder="Ide írhatsz plusz információkat, utasításokat az edzéshez..." className="bg-background border-none rounded-2xl p-4 min-h-[100px]" />
              </div>
              {renderPlanBuilder('new')}
              <DialogFooter className="mt-8 gap-2 sm:gap-0 sticky bottom-0 bg-card/80 backdrop-blur-md p-4 -mx-6 -mb-6 rounded-b-[2rem] border-t border-zinc-800">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Létrehozás</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(nextOpen) => {
        setEditOpen(nextOpen)
        if (!nextOpen) {
          setEditingWorkout(null)
          setEditPlanExercises([])
          setExpandedAdvanced({})
        }
      }}>
        <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edzés szerkesztése</DialogTitle>
          </DialogHeader>
          {editingWorkout && (
            <form action={handleEditSubmit} className="space-y-5 pt-4">
              <input type="hidden" name="id" value={editingWorkout.id} />
              <div className="space-y-2">
                <Label htmlFor="edit_client_id" className="text-zinc-400 ml-2">Kliens / Foglalhatóság</Label>
                <Select name="client_id" required defaultValue={getAssignedClientId(editingWorkout)}>
                  <SelectTrigger className="w-full bg-background border-none rounded-full h-12 px-4">
                    <SelectValue placeholder="Válassz klienst" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-none rounded-2xl shadow-xl p-2">
                    <SelectItem value="open" className="rounded-xl py-2.5 font-bold text-primary">Bárki (Szabad időpont)</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="rounded-xl py-2.5">{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_title" className="text-zinc-400 ml-2">Edzés megnevezése</Label>
                <Input id="edit_title" name="title" defaultValue={editingWorkout.title} required className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_date" className="text-zinc-400 ml-2">Dátum</Label>
                  <Input id="edit_date" name="date" type="date" defaultValue={new Date(editingWorkout.starts_at).toISOString().split('T')[0]} required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_time" className="text-zinc-400 ml-2">Időpont</Label>
                  <Input id="edit_time" name="time" type="time" defaultValue={new Date(editingWorkout.starts_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_duration_min" className="text-zinc-400 ml-2">Időtartam (perc)</Label>
                  <Input id="edit_duration_min" name="duration_min" type="number" defaultValue={editingWorkout.duration_min} required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_capacity" className="text-zinc-400 ml-2">Létszám (fő)</Label>
                  <Input id="edit_capacity" name="capacity" type="number" defaultValue={editingWorkout.capacity || 1} required className="bg-background border-none rounded-full h-12 px-4" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_location" className="text-zinc-400 ml-2">Helyszín (opcionális)</Label>
                <Input id="edit_location" name="location" defaultValue={editingWorkout.location || ''} className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes" className="text-zinc-400 ml-2">Megjegyzés (opcionális)</Label>
                <Textarea id="edit_notes" name="notes" defaultValue={editingWorkout.notes || ''} className="bg-background border-none rounded-2xl p-4 min-h-[100px]" />
              </div>
              {renderPlanBuilder('edit')}
              <DialogFooter className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 w-full sticky bottom-0 bg-card/80 backdrop-blur-md p-4 -mx-6 -mb-6 rounded-b-[2rem] border-t border-zinc-800">
                <Button type="button" variant="ghost" onClick={() => handleDelete(editingWorkout.id)} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Törlés
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Mentés</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border-none rounded-full p-1 mb-6 sm:w-fit">
          <TabsTrigger value="list" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
            <List className="w-4 h-4 mr-2" /> Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
            <CalendarDays className="w-4 h-4 mr-2" /> Naptár
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="space-y-4">
            {workouts && workouts.length > 0 ? (
              workouts.map((workout) => (
                <Card key={workout.id} className="bg-card border-none shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-xl font-bold leading-tight text-zinc-100">{workout.title}</h3>
                        <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                          workout.status === 'scheduled' ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {workout.status}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(workout.starts_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(workout.starts_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} ({workout.duration_min} perc)
                        </div>
                        {workout.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {workout.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {workout.workout_participants?.filter((p: any) => p.status === 'accepted').length || 0}/{workout.capacity || 1} fő
                        </div>
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-zinc-500 mt-1 italic border-l-2 border-primary/50 pl-3">"{workout.notes}"</p>
                      )}

                      {/* Workout exercises */}
                      {workout.workout_exercises && workout.workout_exercises.length > 0 && (
                        <div className="mt-3 bg-background/30 rounded-2xl p-4 border border-zinc-800/50">
                          <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Edzésterv</h4>
                          <div className="flex flex-col gap-2 relative">
                            {workout.workout_exercises
                              .slice()
                              .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                              .map((we: any, index: number, arr: any[]) => {
                                const isSupersetWithNext = we.is_superset
                                const isSupersetWithPrev = index > 0 && arr[index - 1].is_superset

                                return (
                                  <div key={we.id} className="flex flex-wrap items-center gap-2 group relative">
                                    {(isSupersetWithNext || isSupersetWithPrev) && (
                                      <div className={`absolute -left-3 w-1 bg-primary/50 rounded-full ${isSupersetWithNext && !isSupersetWithPrev ? 'top-2 bottom-[-1rem]' : isSupersetWithPrev && !isSupersetWithNext ? 'top-[-1rem] bottom-2' : 'top-[-1rem] bottom-[-1rem]'}`} />
                                    )}
                                    <span className="font-semibold text-zinc-200">
                                      {we.exercise_name}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5 ml-2">
                                      <span className="px-2 py-0.5 bg-background border border-zinc-800 rounded-md text-xs font-medium text-zinc-400">
                                        {we.sets} × {we.reps} {we.weight_target ? `@ ${we.weight_target}kg` : ''}
                                      </span>
                                      {(we.rpe || we.rir || we.rest_seconds) && (
                                        <div className="flex items-center gap-1 ml-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                          {we.rpe && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold">RPE {we.rpe}</span>}
                                          {we.rir !== null && <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px] font-bold">RIR {we.rir}</span>}
                                          {we.rest_seconds && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">{we.rest_seconds}mp pihenő</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Participants */}
                      {workout.workout_participants && workout.workout_participants.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-zinc-500 font-semibold">Jelentkezők:</p>
                          {workout.workout_participants.map((p: any) => (
                            <div key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                              <User className="w-3 h-3 text-zinc-500" />
                              <span className={p.status === 'accepted' ? 'text-green-400' : p.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>
                                {p.profiles?.full_name || 'Ismeretlen'}
                              </span>
                              <span className="text-xs text-zinc-600">({p.status === 'accepted' ? 'Elfogadva' : p.status === 'rejected' ? 'Elutasítva' : 'Függőben'})</span>
                              {p.status === 'pending' && (
                                <div className="flex gap-2 mt-1 sm:mt-0 sm:ml-4">
                                  <Button onClick={() => handleStatusChange(p.id, 'accepted')} size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 rounded-full font-bold h-8 px-3">
                                    <Check className="w-4 h-4 mr-1.5" /> Elfogadom
                                  </Button>
                                  <Button onClick={() => handleStatusChange(p.id, 'rejected')} size="sm" variant="ghost" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full font-bold h-8 px-3">
                                    <X className="w-4 h-4 mr-1.5" /> Elutasítom
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button onClick={() => openEditModal(workout)} variant="outline" className="rounded-full border-zinc-700 bg-transparent hover:bg-background">
                        Szerkesztés
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card border-none border-dashed rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                  <CalendarDays className="h-16 w-16 text-zinc-700 mb-4" />
                  <h2 className="text-xl font-bold text-zinc-300 mb-2">Nincs edzés betervezve</h2>
                  <p className="text-zinc-500 max-w-md">
                    Jelenleg nincsenek kiírt edzéseid az ügyfeleid számára.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <WorkoutCalendar workouts={calendarWorkouts} onDayClick={handleDayClick} />
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">
                {selectedDate 
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Válassz egy napot'}
              </h3>
              {selectedDayWorkouts.length > 0 ? (
                selectedDayWorkouts.map((w: any) => (
                  <Card key={w.id} className="bg-card border-none shadow-md rounded-3xl cursor-pointer hover:shadow-lg transition-all" onClick={() => openEditModal(w)}>
                    <CardContent className="p-4">
                      <h4 className="font-bold text-zinc-100">{w.title}</h4>
                      <p className="text-sm text-zinc-400">
                        {new Date(w.starts_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} • {w.duration_min} perc
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Users className="w-3 h-3 text-zinc-500" />
                        <span className="text-zinc-500">{w.workout_participants?.filter((p: any) => p.status === 'accepted').length || 0}/{w.capacity || 1} fő</span>
                        {w.workout_participants?.some((p: any) => p.status === 'pending') && (
                          <span className="text-yellow-500 font-bold">• Várakozó jelentkezők</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card/50 border-none rounded-3xl">
                  <CardContent className="p-8 text-center text-zinc-500">
                    {selectedDate ? 'Nincs edzés ezen a napon.' : 'Kattints egy napra a naptárban.'}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
