'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addExerciseLog(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const exercise_name = String(formData.get('exercise_name') || '').trim()
  const weight = parseFloat(String(formData.get('weight') || '').replace(',', '.'))
  const reps = parseInt(String(formData.get('reps') || ''), 10)

  if (!exercise_name || isNaN(weight) || isNaN(reps)) {
    return { error: 'Ervenytelen adatok' }
  }

  const { error } = await supabase
    .from('exercise_logs')
    .insert({
      client_id: user.id,
      exercise_name,
      weight,
      reps,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/client/progress')
  revalidatePath('/coach', 'layout')
  return { success: true }
}

export async function addWeightLog(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const rawWeight = String(formData.get('weight_kg') || '').replace(',', '.').trim()
  const weight_kg = parseFloat(rawWeight)
  const logged_at = String(formData.get('logged_at') || new Date().toISOString().split('T')[0])

  if (isNaN(weight_kg) || weight_kg <= 0) {
    return { error: 'Ervenytelen suly' }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(logged_at)) {
    return { error: 'Ervenytelen datum' }
  }

  const { error: deleteError } = await supabase
    .from('weight_logs')
    .delete()
    .eq('client_id', user.id)
    .eq('logged_at', logged_at)

  if (deleteError) {
    return { error: deleteError.message }
  }

  const { error } = await supabase
    .from('weight_logs')
    .insert({
      client_id: user.id,
      weight_kg,
      logged_at,
    })

  if (error) {
    return { error: error.message }
  }

  const today = new Date().toISOString().split('T')[0]
  if (logged_at <= today) {
    await supabase
      .from('profiles')
      .update({ weight_kg })
      .eq('id', user.id)
  }

  revalidatePath('/client/progress')
  revalidatePath('/profile')
  revalidatePath('/coach', 'layout')
  return { success: true }
}
