'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/utils/supabase/admin'

const numericSettings = new Set([
  'booking_min_cancel_hours',
  'default_workout_duration_min',
])

const booleanSettings = new Set([
  'onboarding_required',
  'trainer_approval_required',
])

export async function updatePlatformSettings(formData: FormData) {
  const { supabase, user, error: authError } = await requireAdminAction()
  if (authError || !user) return { error: authError || 'Nem vagy bejelentkezve.' }

  const updates = Array.from(new Set(formData.getAll('setting_key').map(String)))

  for (const key of updates) {
    const rawValue = formData.get(key)
    let value: unknown = rawValue

    if (numericSettings.has(key)) {
      const parsed = Number(rawValue)
      if (!Number.isFinite(parsed) || parsed < 0) {
        return { error: `Ervenytelen szam: ${key}` }
      }
      value = parsed
    }

    if (booleanSettings.has(key)) {
      value = rawValue === 'true'
    }

    const { error } = await supabase
      .from('platform_settings')
      .update({
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)

    if (error) return { error: error.message }

    await supabase.from('admin_audit_logs').insert({
      actor_id: user.id,
      action: 'settings.updated',
      metadata: { key, value },
    })
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

