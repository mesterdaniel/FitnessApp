'use server'

import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(trainerId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  // 1. Create active connection with trainer using admin client (bypasses RLS)
  const adminClient = createServiceRoleClient()
  const { error: connectionError } = await adminClient
    .from('trainer_clients')
    .insert({
      trainer_id: trainerId,
      client_id: user.id,
      status: 'active'
    })

  if (connectionError && connectionError.code !== '23505') { // Ignore unique violation if exists
    return { error: 'Hiba a kapcsolat létrehozásakor: ' + connectionError.message }
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
