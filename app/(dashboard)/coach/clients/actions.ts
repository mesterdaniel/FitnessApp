'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchClients(query: string) {
  if (!query || query.length < 2) return { data: [] }
  
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
    return { error: 'Nincs jogosultságod.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'client')
    .ilike('full_name', `%${query}%`)
    .limit(10)

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function addClientConnection(clientId: string) {
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

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('trainer_clients')
    .select('id')
    .eq('trainer_id', user.id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (existing) {
    // If exists but not active, update it
    const { error: updateError } = await supabase
      .from('trainer_clients')
      .update({ status: 'active' })
      .eq('id', existing.id)

    if (updateError) return { error: updateError.message }
  } else {
    // Insert new connection
    const { error: insertError } = await supabase
      .from('trainer_clients')
      .insert({
        trainer_id: user.id,
        client_id: clientId,
        status: 'active'
      })

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/coach/clients')
  revalidatePath('/coach/passes')
  return { success: true }
}
