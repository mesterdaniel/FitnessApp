'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateServiceRequestStatus(
  requestId: string,
  status: 'accepted' | 'completed' | 'rejected',
  coachNotes: string
) {
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

  // Check if request exists and belongs to the trainer
  const { data: existing } = await supabase
    .from('service_requests')
    .select('id, client_id')
    .eq('id', requestId)
    .eq('trainer_id', user.id)
    .single()

  if (!existing && profile?.role !== 'admin') {
    return { error: 'A kérelem nem található, vagy nincs jogosultságod kezelni.' }
  }

  const { error } = await supabase
    .from('service_requests')
    .update({
      status,
      coach_notes: coachNotes || null,
    })
    .eq('id', requestId)

  if (error) {
    return { error: error.message }
  }

  // Create notification for the client
  if (existing?.client_id) {
    const statusText = status === 'accepted' ? 'elfogadta' : status === 'rejected' ? 'elutasította' : 'teljesítette'
    await supabase.from('notifications').insert({
      user_id: existing.client_id,
      created_by: user.id,
      title: 'Kérelem státusza frissült',
      message: `Az edző ${statusText} a kérelmedet.`,
      type: 'request_update'
    })
  }

  // If accepted, add client to coach's active clients if not already
  if (status === 'accepted' && existing?.client_id) {
    const clientId = existing.client_id
    const { data: conn } = await supabase
      .from('trainer_clients')
      .select('id')
      .eq('trainer_id', user.id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (conn) {
      // Update to active if it was rejected
      await supabase
        .from('trainer_clients')
        .update({ status: 'active' })
        .eq('id', conn.id)
    } else {
      // Insert new connection
      await supabase
        .from('trainer_clients')
        .insert({
          trainer_id: user.id,
          client_id: clientId,
          status: 'active'
        })
    }
    
    // Also revalidate clients page
    revalidatePath('/coach/clients')
  }

  revalidatePath('/coach/requests')
  return { success: true }
}
