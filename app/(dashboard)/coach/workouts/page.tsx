import { createClient } from '@/utils/supabase/server'
import { CoachWorkoutsView } from '@/components/coach/workouts-view'

export default async function CoachWorkoutsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch workouts with participants and exercises
  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_participants(
        id,
        client_id,
        status,
        profiles!workout_participants_client_id_fkey(id, full_name)
      ),
      workout_exercises(
        id,
        exercise_name,
        sets,
        reps,
        weight_target,
        order_index
      )
    `)
    .eq('trainer_id', user.id)
    .order('starts_at', { ascending: false })

  // Fetch clients for the dropdown
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  // Fetch coach's exercise library
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_groups')
    .eq('trainer_id', user.id)
    .order('name', { ascending: true })

  // Fetch external calendar events
  const { data: externalEvents } = await supabase
    .from('external_calendar_events')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <CoachWorkoutsView 
        workouts={workouts || []} 
        clients={clients || []} 
        exercises={exercises || []} 
        externalEvents={externalEvents || []}
      />
    </div>
  )
}
