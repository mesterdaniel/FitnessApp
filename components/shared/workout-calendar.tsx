'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS_HU = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
const MONTHS_HU = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
]

interface CalendarWorkout {
  id: string
  title: string
  starts_at: string
  duration_min: number
  status?: string
  capacity?: number
  participantStatus?: string
  participantCount?: number
}

export function WorkoutCalendar({ workouts, onDayClick }: {
  workouts: CalendarWorkout[]
  onDayClick?: (date: string, dayWorkouts: CalendarWorkout[]) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  // Monday = 0
  const startDay = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const getWorkoutDotClass = (workout: CalendarWorkout) => {
    if (new Date(workout.starts_at) < today) return 'bg-zinc-500'
    if (workout.participantStatus === 'accepted') return 'bg-green-400'
    if (workout.participantStatus === 'pending') return 'bg-yellow-400'
    if (workout.status === 'available') return 'bg-yellow-400'
    if (workout.status === 'scheduled') return 'bg-green-400'
    return 'bg-zinc-500'
  }

  // Group workouts by day
  const workoutsByDay: Record<string, CalendarWorkout[]> = {}
  workouts.forEach(w => {
    const date = new Date(w.starts_at)
    if (date.getMonth() === month && date.getFullYear() === year) {
      const dayKey = String(date.getDate())
      if (!workoutsByDay[dayKey]) workoutsByDay[dayKey] = []
      workoutsByDay[dayKey].push(w)
    }
  })

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Card className="bg-card border-none shadow-md rounded-3xl overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={prevMonth} className="rounded-full p-2 h-auto hover:bg-background">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h3 className="text-base font-bold leading-tight sm:text-xl">{MONTHS_HU[month]} {year}</h3>
            <Button variant="ghost" onClick={goToToday} className="text-xs text-primary hover:text-primary/80 h-auto p-0 mt-1">
              Mai nap
            </Button>
          </div>
          <Button variant="ghost" onClick={nextMonth} className="rounded-full p-2 h-auto hover:bg-background">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_HU.map(day => (
            <div key={day} className="text-center text-xs font-bold text-zinc-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === todayStr
            const dayWorkouts = workoutsByDay[String(day)] || []
            const hasWorkouts = dayWorkouts.length > 0

            return (
              <button
                key={day}
                onClick={() => onDayClick?.(dateStr, dayWorkouts)}
                className={`
                  aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs sm:text-sm
                  ${isToday ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30' : ''}
                  ${!isToday && hasWorkouts ? 'bg-primary/10 text-zinc-100 font-semibold' : ''}
                  ${!isToday && !hasWorkouts ? 'text-zinc-400 hover:bg-background/50' : ''}
                  ${hasWorkouts ? 'cursor-pointer hover:scale-105' : ''}
                `}
              >
                <span>{day}</span>
                {hasWorkouts && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayWorkouts.slice(0, 3).map((w, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-primary-foreground' : getWorkoutDotClass(w)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
