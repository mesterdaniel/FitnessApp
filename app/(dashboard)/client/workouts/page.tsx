import { createClient } from '@/utils/supabase/server'
import { ClientWorkoutsView } from '@/components/client/workouts-view'

export const dynamic = 'force-dynamic'

export default async function ClientWorkoutsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date().toISOString()

  const { data: myParticipations } = await supabase
    .from('workout_participants')
    .select('id, workout_id, status, client_id, modification_status, requested_time')
    .eq('client_id', user.id)
    .in('status', ['pending', 'accepted'])

  const myWorkoutIds = new Set((myParticipations || []).map((participation) => participation.workout_id))
  const participationByWorkoutId = new Map(
    (myParticipations || []).map((participation) => [participation.workout_id, participation])
  )

  const { data: bookedWorkoutsData } = myWorkoutIds.size > 0
    ? await supabase
        .from('workouts')
        .select(`
          *,
          profiles!workouts_trainer_id_fkey(id, full_name, avatar_url),
          workout_exercises(
            id, exercise_name, sets, reps, weight_target, order_index
          )
        `)
        .in('id', Array.from(myWorkoutIds))
        .gte('starts_at', now)
    : { data: [] }

  const myWorkouts = (bookedWorkoutsData || [])
    .map((workout: any) => {
      const participation = participationByWorkoutId.get(workout.id)

      return {
        ...workout,
        workout_participants: participation ? [{
          id: participation.id,
          client_id: participation.client_id,
          status: participation.status,
          modification_status: participation.modification_status,
          requested_time: participation.requested_time,
        }] : [],
      }
    })
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const { data: availableWorkoutsData } = await supabase
    .from('workouts')
    .select(`
      *,
      profiles!workouts_trainer_id_fkey(id, full_name, avatar_url),
      workout_participants(id, status, client_id, modification_status, requested_time),
      workout_exercises(id, exercise_name, sets, reps, weight_target, order_index)
    `)
    .eq('status', 'available')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })

  const ownAvailableWorkouts = (availableWorkoutsData || [])
    .filter((workout) => workout.workout_participants?.some((participant: any) =>
      participant.client_id === user.id && ['pending', 'accepted'].includes(participant.status)
    ))
    .map((workout: any) => {
      const participation = workout.workout_participants.find((participant: any) => participant.client_id === user.id)

      return {
        ...workout,
      workout_participants: [{
        id: participation.id,
        client_id: participation.client_id,
        status: participation.status,
        modification_status: participation.modification_status,
        requested_time: participation.requested_time,
      }],
      }
    })
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const combinedMyWorkouts = Array.from(
    new Map([...myWorkouts, ...ownAvailableWorkouts].map((workout) => [workout.id, workout])).values()
  ).sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const combinedMyWorkoutIds = new Set(combinedMyWorkouts.map((workout: any) => workout.id))
  const availableWorkouts = (availableWorkoutsData || []).filter((workout) => {
    if (combinedMyWorkoutIds.has(workout.id)) return false
    return true
  })

  // Fetch active pass
  const { data: activePasses, error: passError } = await supabase
    .from('client_passes')
    .select('*')
    .eq('client_id', user.id)
    .order('purchase_date', { ascending: true })

  if (passError) {
    console.error("CLIENT_PASSES_ERROR:", passError)
  }

  const hasActivePass = activePasses?.some(p => p.used_occasions < p.total_occasions) || false

  return (
    <ClientWorkoutsView
      myWorkouts={combinedMyWorkouts}
      availableWorkouts={availableWorkouts}
      hasActivePass={hasActivePass}
    />
  )
}
