'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addExercise(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const muscle_group = formData.get('muscle_group') as string

  if (!name) {
    return { error: 'A gyakorlat neve kötelező!' }
  }

  const { error } = await supabase
    .from('exercises')
    .insert({
      trainer_id: user.id,
      name,
      category: category || null,
      description: description || null,
      muscle_group: muscle_group || null,
    })

  if (error) {
    console.error("Hiba a gyakorlat mentésekor:", error)
    return { error: error.message }
  }

  revalidatePath('/coach/exercises')
  return { success: true }
}

export async function updateExercise(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const muscle_group = formData.get('muscle_group') as string

  if (!id || !name) {
    return { error: 'Hiányzó adatok' }
  }

  const { error } = await supabase
    .from('exercises')
    .update({
      name,
      category: category || null,
      description: description || null,
      muscle_group: muscle_group || null,
    })
    .eq('id', id)
    .eq('trainer_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/exercises')
  return { success: true }
}

export async function deleteExercise(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('trainer_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/exercises')
  return { success: true }
}
