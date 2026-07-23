'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createServiceRequest(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  const requestType = formData.get('request_type') as string
  const message = formData.get('message') as string
  const trainerId = formData.get('trainer_id') as string

  if (!requestType) {
    return { error: 'A kérelem típusa kötelező.' }
  }

  if (!trainerId) {
    return { error: 'Kérlek válassz edzőt a listából.' }
  }

  const { error } = await supabase
    .from('service_requests')
    .insert({
      client_id: user.id,
      trainer_id: trainerId,
      request_type: requestType,
      message: message || null,
      status: 'pending'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/client/requests')
  return { success: true }
}

export async function cancelServiceRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  // Check if request exists and belongs to client
  const { data: existing } = await supabase
    .from('service_requests')
    .select('id, status')
    .eq('id', requestId)
    .eq('client_id', user.id)
    .single()

  if (!existing) {
    return { error: 'A kérelem nem található.' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Csak függőben lévő kérelmet lehet törölni.' }
  }

  const { error } = await supabase
    .from('service_requests')
    .delete()
    .eq('id', requestId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/client/requests')
  return { success: true }
}
