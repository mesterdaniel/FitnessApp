'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookWorkout(workoutId: string, _formData: FormData): Promise<any> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if workout is still available (status = available, and capacity is not full)
  const { data: workout } = await supabase
    .from('workouts')
    .select('status, capacity, title, trainer_id')
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



  // Find an active pass
  const { data: passes, error: passesError } = await supabase
    .from('client_passes')
    .select('id, total_occasions, used_occasions')
    .eq('client_id', user.id)
    .order('purchase_date', { ascending: true })

  console.log('BOOKING DEBUG passes:', passes, 'error:', passesError, 'user_id:', user.id);

  const activePass = passes?.find(p => p.used_occasions < p.total_occasions)
  const passId = activePass?.id || null

  if (!passId) {
    return { error: 'Nincs aktív bérleted' }
  }

  // Create a pending participation
  await supabase
    .from('workout_participants')
    .upsert({ 
      workout_id: workoutId,
      client_id: user.id,
      status: 'pending',
      pass_id: passId
    }, { onConflict: 'workout_id,client_id' })

  // Notify the coach
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  
  await supabase.from('notifications').insert({
    user_id: workout.trainer_id,
    title: 'Új jelentkező',
    message: `${profile?.full_name || 'Egy kliens'} jelentkezett a(z) "${workout.title}" edzésedre.`,
    type: 'new_booking'
  })

  revalidatePath('/client/workouts')
  revalidatePath('/client')
  revalidatePath('/coach/workouts')
}

export async function cancelWorkoutBooking(workoutId: string): Promise<any> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check 24h rule
  const { data: workout } = await supabase
    .from('workouts')
    .select('starts_at')
    .eq('id', workoutId)
    .single()

  if (workout) {
    const startsAt = new Date(workout.starts_at).getTime()
    const now = new Date().getTime()
    if (startsAt - now < 24 * 60 * 60 * 1000) {
      return { error: '24 órán belüli edzést nem lehet lemondani.' }
    }
  }

  const { error } = await supabase
    .from('workout_participants')
    .delete()
    .eq('workout_id', workoutId)
    .eq('client_id', user.id)

  if (error) {
    console.error(error.message)
    return { error: error.message }
  }

  revalidatePath('/client/workouts')
  revalidatePath('/client')
  revalidatePath('/coach/workouts')
  return { success: true }
}

export async function requestWorkoutModification(workoutId: string, newTimeIso: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.rpc('request_workout_modification', {
    p_workout_id: workoutId,
    p_requested_time: newTimeIso
  })

  if (error) {
    return { error: error.message }
  }

  // Notify coach
  const { data: workout } = await supabase.from('workouts').select('trainer_id, title').eq('id', workoutId).single()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  if (workout) {
    await supabase.from('notifications').insert({
      user_id: workout.trainer_id,
      title: 'Időpont módosítási kérelem',
      message: `${profile?.full_name || 'Egy kliens'} módosítást kért a(z) "${workout.title}" edzésedre.`,
      type: 'workout_modification'
    })
  }

  revalidatePath('/client/workouts')
  revalidatePath('/client')
  revalidatePath('/coach/workouts')
  return { success: true }
}
