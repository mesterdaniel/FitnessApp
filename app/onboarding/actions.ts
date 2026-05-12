'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const weight_kg = formData.get('weight_kg') ? parseFloat(formData.get('weight_kg') as string) : null
  const height_cm = formData.get('height_cm') ? parseInt(formData.get('height_cm') as string) : null
  const birth_date = formData.get('birth_date') as string || null
  const gender = formData.get('gender') as string || null
  const fitness_level = formData.get('fitness_level') as string || null
  const bio = formData.get('bio') as string || null

  const { error } = await supabase
    .from('profiles')
    .update({
      weight_kg,
      height_cm,
      birth_date,
      gender,
      fitness_level,
      bio,
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Onboarding update error:', error)
    redirect('/onboarding?error=' + encodeURIComponent(error.message))
  }

  // Redirect to client dashboard
  redirect('/client')
}
