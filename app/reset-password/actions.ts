'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || !confirmPassword) {
    redirect('/reset-password?error=Kérjük+töltsd+ki+mindkét+mezőt')
  }

  if (password !== confirmPassword) {
    redirect('/reset-password?error=A+jelszavak+nem+egyeznek')
  }

  if (password.length < 6) {
    redirect('/reset-password?error=A+jelszónak+legalább+6+karakter+hosszúnak+kell+lennie')
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?success=password_updated')
}
