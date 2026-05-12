'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/utils/supabase/admin'
import { isAccountStatus, isUserRole, type AccountStatus, type UserRole } from '@/utils/roles'

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof requireAdminAction>>['supabase'],
  actorId: string,
  targetUserId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  await supabase.from('admin_audit_logs').insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    metadata,
  })
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  if (!isUserRole(newRole)) {
    return { error: 'Ervenytelen szerepkor.' }
  }

  const { supabase, user, error: authError } = await requireAdminAction()
  if (authError || !user) return { error: authError || 'Nem vagy bejelentkezve.' }

  if (user.id === userId && newRole !== 'admin') {
    return { error: 'A sajat admin szerepkorodet nem veheted el innen.' }
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  await writeAuditLog(supabase, user.id, userId, 'user.role_updated', {
    old_role: target?.role || null,
    new_role: newRole,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/reports')
  return { success: true }
}

export async function updateUserStatus(userId: string, newStatus: AccountStatus) {
  if (!isAccountStatus(newStatus)) {
    return { error: 'Ervenytelen fiokstatusz.' }
  }

  const { supabase, user, error: authError } = await requireAdminAction()
  if (authError || !user) return { error: authError || 'Nem vagy bejelentkezve.' }

  if (user.id === userId && newStatus === 'suspended') {
    return { error: 'A sajat admin fiokodat nem fuggaszthatod fel innen.' }
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ account_status: newStatus })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  await writeAuditLog(supabase, user.id, userId, 'user.status_updated', {
    old_status: target?.account_status || null,
    new_status: newStatus,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/reports')
  return { success: true }
}
