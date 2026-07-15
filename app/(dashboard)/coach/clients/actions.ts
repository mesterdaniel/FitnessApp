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

  // Get current active clients
  const { data: participantData } = await supabase
    .from('workout_participants')
    .select('client_id, workouts!inner(trainer_id)')
    .eq('workouts.trainer_id', user.id)

  const { data: explicitConnections } = await supabase
    .from('trainer_clients')
    .select('client_id')
    .eq('trainer_id', user.id)
    .eq('status', 'active')

  const { data: rejectedConnections } = await supabase
    .from('trainer_clients')
    .select('client_id')
    .eq('trainer_id', user.id)
    .eq('status', 'rejected')

  const clientIdsFromWorkouts = participantData?.map((p) => p.client_id) || []
  const clientIdsFromConnections = explicitConnections?.map((c) => c.client_id) || []
  const rejectedClientIds = new Set(rejectedConnections?.map((c) => c.client_id) || [])

  const allClientIds = [...new Set([...clientIdsFromWorkouts, ...clientIdsFromConnections])]
  const activeClientIds = allClientIds.filter(id => !rejectedClientIds.has(id))

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'client')
    .ilike('full_name', `%${query}%`)
    .limit(50)

  if (error) {
    return { error: error.message }
  }

  const filteredData = (data || []).filter(c => !activeClientIds.includes(c.id)).slice(0, 10)

  return { data: filteredData }
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

export async function removeClientConnection(clientId: string) {
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
    const { error: updateError } = await supabase
      .from('trainer_clients')
      .update({ status: 'rejected' })
      .eq('id', existing.id)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    // Insert new connection as rejected to override workout_participants
    const { error: insertError } = await supabase
      .from('trainer_clients')
      .insert({
        trainer_id: user.id,
        client_id: clientId,
        status: 'rejected'
      })

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/coach/clients')
  revalidatePath('/coach/passes')
  return { success: true }
}

export async function inviteClient(email: string) {
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

  const { createServiceRoleClient } = await import('@/utils/supabase/admin')
  const adminClient = createServiceRoleClient()

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/onboarding`,
  })

  if (error) {
    if (error.status === 422 || error.message.includes('already exists') || error.message.includes('already registered')) {
      return { error: 'Ez az e-mail cím már regisztrálva van. Kérjük, keresd meg a felhasználót név alapján!' }
    }
    return { error: error.message }
  }

  // Link the new user to the trainer
  if (data?.user?.id) {
    const { error: insertError } = await adminClient
      .from('trainer_clients')
      .insert({
        trainer_id: user.id,
        client_id: data.user.id,
        status: 'active'
      })

    if (insertError) {
      console.error('Error linking invited client:', insertError)
    }
  }

  revalidatePath('/coach/clients')
  return { success: true }
}

export async function updateClientMetrics(clientId: string, formData: FormData) {
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

  const bodyFat = formData.get('body_fat_pct') as string
  const muscleMass = formData.get('muscle_mass_kg') as string
  const visceralFat = formData.get('visceral_fat_level') as string
  const calorieLimit = formData.get('calorie_limit') as string

  const updates = {
    body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
    muscle_mass_kg: muscleMass ? parseFloat(muscleMass) : null,
    visceral_fat_level: visceralFat ? parseFloat(visceralFat) : null,
    calorie_limit: calorieLimit ? parseInt(calorieLimit, 10) : null
  }

  const { error } = await supabase.rpc('update_client_metrics', {
    p_client_id: clientId,
    p_body_fat_pct: updates.body_fat_pct,
    p_muscle_mass_kg: updates.muscle_mass_kg,
    p_visceral_fat_level: updates.visceral_fat_level,
    p_calorie_limit: updates.calorie_limit
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/coach/clients/${clientId}`)
  revalidatePath('/client/progress')

  return { success: true }
}

