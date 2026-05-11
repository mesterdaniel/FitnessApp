'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function parseWorkoutExercises(formData: FormData) {
  const ids = formData.getAll('workout_exercise_id').map(String)
  const names = formData.getAll('workout_exercise_name').map(String)
  const setsValues = formData.getAll('workout_exercise_sets').map(String)
  const repsValues = formData.getAll('workout_exercise_reps').map(String)
  const weightValues = formData.getAll('workout_exercise_weight_target').map(String)

  return names
    .map((name, index) => {
      const sets = parseInt(setsValues[index] || '', 10)
      const reps = parseInt(repsValues[index] || '', 10)
      const weightTarget = parseFloat(weightValues[index] || '')

      return {
        id: ids[index] || null,
        exercise_name: name.trim(),
        sets,
        reps,
        weight_target: Number.isFinite(weightTarget) ? weightTarget : null,
        order_index: index,
      }
    })
    .filter((exercise) => exercise.exercise_name && exercise.sets > 0 && exercise.reps > 0)
}

async function replaceWorkoutExercises(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workoutId: string,
  exercises: ReturnType<typeof parseWorkoutExercises>
) {
  const { error: deleteError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId)

  if (deleteError) return deleteError
  if (exercises.length === 0) return null

  const { error } = await supabase
    .from('workout_exercises')
    .insert(exercises.map(({ exercise_name, sets, reps, weight_target, order_index }) => ({
      workout_id: workoutId,
      exercise_name,
      sets,
      reps,
      weight_target,
      order_index,
    })))

  return error
}

async function syncWorkoutParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workoutId: string,
  clientId: string
) {
  if (!clientId || clientId === 'open') return null

  const { error: deleteError } = await supabase
    .from('workout_participants')
    .delete()
    .eq('workout_id', workoutId)

  if (deleteError) return deleteError

  const { error } = await supabase.from('workout_participants').upsert({
    workout_id: workoutId,
    client_id: clientId,
    status: 'accepted',
  }, { onConflict: 'workout_id,client_id' })

  return error
}

export async function addWorkout(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const client_id = formData.get('client_id') as string
  const title = formData.get('title') as string
  const duration_min = parseInt(formData.get('duration_min') as string, 10)
  const capacity = parseInt(formData.get('capacity') as string, 10) || 1
  
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string
  const workoutExercises = parseWorkoutExercises(formData)

  if (!title || isNaN(duration_min) || !date || !time) {
    return { error: 'Minden kötelező mezőt ki kell tölteni' }
  }
  
  const starts_at = new Date(`${date}T${time}`).toISOString()

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      trainer_id: user.id,
      client_id: client_id === 'open' ? null : client_id,
      title,
      duration_min,
      capacity,
      starts_at,
      location: location || null,
      notes: notes || null,
      status: client_id === 'open' ? 'available' : 'scheduled',
    })
    .select('id')
    .single()

  if (error) {
    console.error("Hiba az edzés mentésekor:", error)
    return { error: error.message }
  }

  if (workout) {
    const participantError = await syncWorkoutParticipant(supabase, workout.id, client_id)
    if (participantError) return { error: participantError.message }

    const exerciseError = await replaceWorkoutExercises(supabase, workout.id, workoutExercises)
    if (exerciseError) return { error: exerciseError.message }
  }

  revalidatePath('/coach/workouts')
  revalidatePath('/coach')
  revalidatePath('/client/workouts')
  return { success: true }
}

export async function updateWorkout(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const client_id = formData.get('client_id') as string
  const title = formData.get('title') as string
  const duration_min = parseInt(formData.get('duration_min') as string, 10)
  const capacity = parseInt(formData.get('capacity') as string, 10) || 1
  
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string
  const workoutExercises = parseWorkoutExercises(formData)

  if (!id || !title || isNaN(duration_min) || !date || !time) {
    return { error: 'Minden kötelező mezőt ki kell tölteni' }
  }
  
  const starts_at = new Date(`${date}T${time}`).toISOString()

  const { data: existingWorkout, error: ownershipError } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()

  if (ownershipError || !existingWorkout) {
    return { error: 'Nincs jogosultsĂˇgod az edzĂ©s mĂłdosĂ­tĂˇsĂˇhoz' }
  }

  const { error } = await supabase
    .from('workouts')
    .update({
      title,
      client_id: client_id === 'open' ? null : client_id,
      duration_min,
      capacity,
      starts_at,
      location: location || null,
      notes: notes || null,
      status: client_id === 'open' ? 'available' : 'scheduled',
    })
    .eq('id', id)
    .eq('trainer_id', user.id) // Security check

  if (error) {
    console.error("Hiba a szerkesztéskor:", error)
    return { error: error.message }
  }

  if (client_id && client_id !== 'open') {
    const participantError = await syncWorkoutParticipant(supabase, id, client_id)
    if (participantError) return { error: participantError.message }
  }

  const exerciseError = await replaceWorkoutExercises(supabase, id, workoutExercises)
  if (exerciseError) return { error: exerciseError.message }

  revalidatePath('/coach/workouts')
  revalidatePath('/coach')
  revalidatePath('/client/workouts')
  return { success: true }
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)
    .eq('trainer_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/workouts')
  revalidatePath('/coach')
  revalidatePath('/client/workouts')
  return { success: true }
}

export async function updateParticipantStatus(participantId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // We could verify trainer ownership, but RLS handles it.
  const { error } = await supabase
    .from('workout_participants')
    .update({ status })
    .eq('id', participantId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/workouts')
  revalidatePath('/coach')
  revalidatePath('/client/workouts')
  return { success: true }
}

export async function addWorkoutExercise(workoutId: string, exerciseName: string, sets: number, reps: number, weightTarget?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get current max order_index
  const { data: existing } = await supabase
    .from('workout_exercises')
    .select('order_index')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrder = (existing && existing.length > 0) ? (existing[0].order_index + 1) : 0

  const { error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      exercise_name: exerciseName,
      sets,
      reps,
      weight_target: weightTarget || null,
      order_index: nextOrder,
    })

  if (error) return { error: error.message }

  revalidatePath('/coach/workouts')
  revalidatePath('/client/workouts')
  return { success: true }
}

export async function removeWorkoutExercise(exerciseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId)

  if (error) return { error: error.message }

  revalidatePath('/coach/workouts')
  revalidatePath('/client/workouts')
  return { success: true }
}
