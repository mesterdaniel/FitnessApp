'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(trainerId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  // 1. Create active connection with trainer
  const { error: connectionError } = await supabase
    .from('trainer_clients')
    .insert({
      trainer_id: trainerId,
      client_id: user.id,
      status: 'active'
    })

  if (connectionError && connectionError.code !== '23505') { // Ignore unique violation if exists
    return { error: 'Hiba a kapcsolat létrehozásakor: ' + connectionError.message }
  }

  // 2. Grant a 1-occasion starter pass
  const { error: passError } = await supabase
    .from('client_passes')
    .insert({
      client_id: user.id,
      total_occasions: 1,
      used_occasions: 0
    })

  if (passError) {
    return { error: 'Hiba a bérlet kiállításakor: ' + passError.message }
  }

  // 3. Mark onboarding as completed
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Hiba a profil frissítésekor: ' + profileError.message }
  }

  revalidatePath('/client')
  return { success: true }
}
