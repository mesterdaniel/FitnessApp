'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sellPass(clientId: string, occasions: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  // Check if current user is a coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    return { error: 'Nincs jogosultságod bérletet eladni.' }
  }

  // Since the UI determines clients based on workout history, we bypass the strict `trainer_clients` check here.
  // The coach should be able to sell passes to any client they have worked with.

  const { error } = await supabase
    .from('client_passes')
    .insert({
      client_id: clientId,
      total_occasions: occasions,
      used_occasions: 0
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/passes')
  revalidatePath('/coach/clients')
  revalidatePath(`/coach/clients/${clientId}`)
  return { success: true }
}

export async function deletePass(passId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    return { error: 'Nincs jogosultságod.' }
  }
  
  const { error } = await supabase
    .from('client_passes')
    .delete()
    .eq('id', passId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/passes')
  revalidatePath('/coach/clients')
  return { success: true }
}
