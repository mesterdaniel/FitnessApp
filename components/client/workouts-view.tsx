'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Dumbbell, UserPlus, List, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutCalendar } from '@/components/shared/workout-calendar'
import { bookWorkout } from '@/app/(dashboard)/client/workouts/actions'

export function ClientWorkoutsView({
  myWorkouts,
  availableWorkouts,
}: {
  myWorkouts: any[]
  availableWorkouts: any[]
}) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([])

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

  const renderWorkoutPlan = (workout: any) => {
    if (!workout.workout_exercises || workout.workout_exercises.length === 0) return null

    return (
      <div className="mt-3 pt-3 border-t border-zinc-800/50">
        <p className="text-xs font-bold text-zinc-500 mb-2">Edzésterv:</p>
        <div className="flex flex-wrap gap-2">
          {workout.workout_exercises
            .slice()
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((exercise: any) => (
              <span key={exercise.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Dumbbell className="w-3 h-3" />
                {exercise.exercise_name} - {exercise.sets}x{exercise.reps} {exercise.weight_target ? `(${exercise.weight_target}kg)` : ''}
              </span>
            ))}
        </div>
      </div>
    )
  }

  const renderMyWorkoutCard = (workout: any, compact = false) => {
    const myStatus = workout.workout_participants?.[0]?.status || 'pending'

    return (
      <Card key={workout.id} className="bg-card border-none shadow-md rounded-3xl overflow-hidden opacity-90">
        <CardContent className={compact ? 'p-4' : 'p-4 sm:p-6'}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={compact ? 'min-w-0 break-words font-bold leading-tight text-zinc-100' : 'min-w-0 break-words text-xl font-bold leading-tight text-zinc-100'}>{workout.title}</h3>
                <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  myStatus === 'accepted' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {myStatus === 'accepted' ? 'Jóváhagyva' : 'Függőben'}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
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
                <p className="text-sm text-zinc-500 mt-2 italic border-l-2 border-primary/50 pl-3">{workout.notes}</p>
              )}
              <p className="text-sm mt-2 text-zinc-500">Edző: {workout.profiles?.full_name || 'Ismeretlen'}</p>
              {renderWorkoutPlan(workout)}
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
          <p className="text-zinc-400">Jelentkezz az edződ által kiírt szabad edzésekre.</p>
        </div>

        <div className="space-y-4">
          {availableWorkouts.length > 0 ? (
            availableWorkouts.map((workout) => (
              <Card key={workout.id} className="bg-card border-none shadow-md rounded-3xl overflow-hidden border-2 border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-xl font-bold leading-tight text-zinc-100">{workout.title}</h3>
                        <div className="shrink-0 px-3 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">Nyitott</div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
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
                        <p className="text-sm text-zinc-500 mt-2 italic border-l-2 border-primary/50 pl-3">{workout.notes}</p>
                      )}
                      <p className="text-sm mt-2 text-zinc-500">Edző: {workout.profiles?.full_name || 'Ismeretlen'}</p>
                    </div>

                    <form action={bookWorkout.bind(null, workout.id)}>
                      <Button type="submit" className="rounded-full bg-primary text-primary-foreground font-bold px-6 shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <UserPlus className="w-4 h-4 mr-2" /> Jelentkezem
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-none border-dashed rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Dumbbell className="h-12 w-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500">Jelenleg nincsenek meghirdetve szabad időpontok.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Saját Edzéseim</h2>
          <p className="text-zinc-400">A már lefoglalt, közelgő edzéseid.</p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border-none rounded-full p-1 h-auto mb-6 sm:w-fit">
            <TabsTrigger value="list" className="rounded-full px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
              <List className="w-4 h-4 mr-2" /> Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-full px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-6">
              <CalendarDays className="w-4 h-4 mr-2" /> Naptár
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="space-y-4">
              {myWorkouts.length > 0 ? (
                myWorkouts.map((workout) => renderMyWorkoutCard(workout))
              ) : (
                <p className="text-zinc-500 italic ml-2">Nincs még lefoglalt edzésed.</p>
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
    </div>
  )
}
