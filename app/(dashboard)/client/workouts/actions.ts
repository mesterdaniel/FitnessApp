'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookWorkout(workoutId: string, _formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if workout is still available (status = available, and capacity is not full)
  const { data: workout } = await supabase
    .from('workouts')
    .select('status, capacity')
    .eq('id', workoutId)
    .single()

  if (!workout || workout.status !== 'available') return

  const { data: existingParticipation } = await supabase
    .from('workout_participants')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('client_id', user.id)
    .maybeSingle()

  if (existingParticipation) return

  // Check current participants count
  const { count } = await supabase
    .from('workout_participants')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId)
    .in('status', ['accepted', 'pending'])

  if (count !== null && count >= workout.capacity) return

  // Create a pending participation
  await supabase
    .from('workout_participants')
    .upsert({ 
      workout_id: workoutId,
      client_id: user.id,
      status: 'pending'
    }, { onConflict: 'workout_id,client_id' })

  revalidatePath('/client/workouts')
  revalidatePath('/client')
  revalidatePath('/coach/workouts')
}
