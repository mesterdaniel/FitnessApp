'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Dumbbell, UserPlus, List, CalendarDays, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutCalendar } from '@/components/shared/workout-calendar'
import { bookWorkout, cancelWorkoutBooking } from '@/app/(dashboard)/client/workouts/actions'

export function ClientWorkoutsView({
  myWorkouts,
  availableWorkouts,
  hasActivePass,
}: {
  myWorkouts: any[]
  availableWorkouts: any[]
  hasActivePass?: boolean
}) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week'>('all')

  const calendarWorkouts = myWorkouts.map((workout) => ({
    id: workout.id,
    title: workout.title,
    starts_at: workout.starts_at,
    duration_min: workout.duration_min,
    status: workout.status,
    participantStatus: workout.workout_participants?.[0]?.status || 'pending',
  }))

  const handleDayClick = (date: string, dayWorkouts: any[]) => {
    setSelectedDate(date)
    setSelectedDayWorkouts(
      dayWorkouts.map((dayWorkout) => myWorkouts.find((workout) => workout.id === dayWorkout.id)).filter(Boolean)
    )
  }

  // Date filtering logic for available workouts
  const filteredAvailableWorkouts = useMemo(() => {
    let filtered = availableWorkouts

    if (quickFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(w => w.starts_at.split('T')[0] === today)
    } else if (quickFilter === 'week') {
      const now = new Date()
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() + 7)
      filtered = filtered.filter(w => {
        const d = new Date(w.starts_at)
        return d >= now && d <= weekEnd
      })
    }

    if (dateFilter) {
      filtered = filtered.filter(w => w.starts_at.split('T')[0] === dateFilter)
    }

    return filtered
  }, [availableWorkouts, quickFilter, dateFilter])

  const renderWorkoutPlan = (workout: any) => {
    if (!workout.workout_exercises || workout.workout_exercises.length === 0) return null

    return (
      <div className="mt-4 pt-4 border-t border-zinc-800/50">
        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Edzésterv</p>
        <div className="flex flex-col gap-2 relative pl-2">
          {workout.workout_exercises
            .slice()
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((exercise: any, index: number, arr: any[]) => {
              const isSupersetWithNext = exercise.is_superset
              const isSupersetWithPrev = index > 0 && arr[index - 1].is_superset

              return (
                <div key={exercise.id} className="flex flex-wrap items-center gap-2 group relative py-1">
                  {(isSupersetWithNext || isSupersetWithPrev) && (
                    <div className={`absolute -left-3 w-1 bg-primary/50 rounded-full ${isSupersetWithNext && !isSupersetWithPrev ? 'top-3 bottom-[-1rem]' : isSupersetWithPrev && !isSupersetWithNext ? 'top-[-1rem] bottom-3' : 'top-[-1rem] bottom-[-1rem]'}`} />
                  )}
                  <span className="font-semibold text-foreground">
                    {exercise.exercise_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 ml-2">
                    <span className="px-2 py-0.5 bg-background border border-zinc-800 rounded-md text-xs font-medium text-muted-foreground">
                      {exercise.sets} × {exercise.reps} {exercise.weight_target ? `@ ${exercise.weight_target}kg` : ''}
                    </span>
                    {(exercise.rpe || exercise.rir || exercise.rest_seconds) && (
                      <div className="flex items-center gap-1 ml-1 opacity-90">
                        {exercise.rpe && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold">RPE {exercise.rpe}</span>}
                        {exercise.rir !== null && <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px] font-bold">RIR {exercise.rir}</span>}
                        {exercise.rest_seconds && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">{exercise.rest_seconds}mp pihenő</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  const renderMyWorkoutCard = (workout: any, compact = false) => {
    const myStatus = workout.workout_participants?.[0]?.status || 'pending'

    return (
      <Card key={workout.id} className="bg-card border-none shadow-md rounded-lg overflow-hidden opacity-90">
        <CardContent className={compact ? 'p-4' : 'p-4 sm:p-6'}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={compact ? 'min-w-0 break-words font-bold leading-tight text-foreground' : 'min-w-0 break-words text-xl font-bold leading-tight text-foreground'}>{workout.title}</h3>
                <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  myStatus === 'accepted' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {myStatus === 'accepted' ? 'Jóváhagyva' : 'Függőben'}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(workout.starts_at).toLocaleDateString('hu-HU', { weekday: 'long', month: 'short', day: 'numeric' })}
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
              </div>

              {workout.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-primary/50 pl-3">{workout.notes}</p>
              )}
              <p className="text-sm mt-2 text-muted-foreground">Edző: {workout.profiles?.full_name || 'Ismeretlen'}</p>
              {renderWorkoutPlan(workout)}
            </div>
            <div className="shrink-0 flex sm:flex-col justify-end">
              <form action={cancelWorkoutBooking.bind(null, workout.id)}>
                <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full font-semibold">
                  Lemondás
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-24">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Szabad Időpontok</h1>
          <p className="text-muted-foreground">Jelentkezz az edződ által kiírt szabad edzésekre.</p>
        </div>

        {/* Date filter controls */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
              <Filter className="w-4 h-4" />
              <span>Szűrés:</span>
            </div>
            {(['all', 'today', 'week'] as const).map(filter => (
              <Button
                key={filter}
                type="button"
                variant="ghost"
                onClick={() => { setQuickFilter(filter); setDateFilter('') }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium h-auto transition-all ${
                  quickFilter === filter && !dateFilter
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {filter === 'all' ? 'Összes' : filter === 'today' ? 'Ma' : 'Ezen a héten'}
              </Button>
            ))}
            <div className="relative">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setQuickFilter('all') }}
                className="bg-card border-none rounded-full h-9 px-4 text-sm w-44"
              />
            </div>
            {(dateFilter || quickFilter !== 'all') && (
              <span className="text-xs text-muted-foreground ml-1">
                ({filteredAvailableWorkouts.length} találat)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAvailableWorkouts.length > 0 ? (
            filteredAvailableWorkouts.map((workout) => (
              <Card key={workout.id} className="bg-card border-none shadow-md rounded-lg overflow-hidden border-2 border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-xl font-bold leading-tight text-foreground">{workout.title}</h3>
                        <div className="shrink-0 px-3 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">Nyitott</div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(workout.starts_at).toLocaleDateString('hu-HU', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-primary/50 pl-3">{workout.notes}</p>
                      )}
                      <p className="text-sm mt-2 text-muted-foreground">Edző: {workout.profiles?.full_name || 'Ismeretlen'}</p>
                      {renderWorkoutPlan(workout)}
                    </div>

                    <form action={bookWorkout.bind(null, workout.id)}>
                      {hasActivePass ? (
                        <Button type="submit" className="rounded-full bg-primary text-primary-foreground font-bold px-6 shadow-lg shadow-primary/20 w-full sm:w-auto">
                          <UserPlus className="w-4 h-4 mr-2" /> Jelentkezem
                        </Button>
                      ) : (
                        <Button type="button" disabled className="rounded-full font-bold px-6 w-full sm:w-auto">
                          Nincs aktív bérlet
                        </Button>
                      )}
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-none border-dashed rounded-lg">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Dumbbell className="h-12 w-12 text-zinc-700 mb-4" />
                <p className="text-muted-foreground">
                  {dateFilter || quickFilter !== 'all'
                    ? 'Nincs elérhető edzés a kiválasztott időszakban.'
                    : 'Jelenleg nincsenek meghirdetve szabad időpontok.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Saját Edzéseim</h2>
          <p className="text-muted-foreground">A már lefoglalt, közelgő edzéseid.</p>
        </div>

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
              {myWorkouts.length > 0 ? (
                myWorkouts.map((workout) => renderMyWorkoutCard(workout))
              ) : (
                <p className="text-muted-foreground italic ml-2">Nincs még lefoglalt edzésed.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid min-w-0 gap-6 md:grid-cols-2">
              <WorkoutCalendar workouts={calendarWorkouts} onDayClick={handleDayClick} />

              <div className="space-y-4">
                <h3 className="text-lg font-bold">
                  {selectedDate
                    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Válassz egy napot'}
                </h3>
                {selectedDayWorkouts.length > 0 ? (
                  selectedDayWorkouts.map((workout) => renderMyWorkoutCard(workout, true))
                ) : (
                  <Card className="bg-card/50 border-none rounded-lg">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {selectedDate ? 'Nincs edzés ezen a napon.' : 'Kattints egy napra a naptárban.'}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
