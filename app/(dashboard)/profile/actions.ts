'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  const currentPassword = formData.get('current_password') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('password_confirm') as string

  if (!currentPassword) {
    return { error: 'A jelenlegi jelszó megadása kötelező!' }
  }

  if (!password || password.length < 6) {
    return { error: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie.' }
  }

  if (password !== passwordConfirm) {
    return { error: 'A két új jelszó nem egyezik!' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Nincs bejelentkezett felhasználó.' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword
  })

  if (signInError) {
    return { error: 'A megadott jelenlegi jelszó helytelen!' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezett felhasználó.' }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  
  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  
  // It's a server action, so we can't redirect directly from here if called from startTransition or hook safely without error bubbling
  // We'll return success and handle redirect on the client side.
  return { success: true }
}
