'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const full_name = formData.get('full_name') as string
  const weight_kg = formData.get('weight_kg') as string
  const height_cm = formData.get('height_cm') as string
  const birth_date = formData.get('birth_date') as string
  const gender = formData.get('gender') as string
  const fitness_level = formData.get('fitness_level') as string

  if (!full_name) {
    return { error: 'Név megadása kötelező' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name,
      weight_kg: weight_kg ? parseFloat(weight_kg) : null,
      height_cm: height_cm ? parseInt(height_cm, 10) : null,
      birth_date: birth_date || null,
      gender: gender || null,
      fitness_level: fitness_level || null
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/coach')
  revalidatePath('/client')
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const passwordConfirm = formData.get('password_confirm') as string

  if (!password || password.length < 6) {
    return { error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.' }
  }

  if (password !== passwordConfirm) {
    return { error: 'A két jelszó nem egyezik!' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
