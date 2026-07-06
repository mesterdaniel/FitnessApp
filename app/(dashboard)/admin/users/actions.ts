'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction, createServiceRoleClient } from '@/utils/supabase/admin'
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

export async function deleteUser(userId: string) {
  const { supabase, user, error: authError } = await requireAdminAction()
  if (authError || !user) return { error: authError || 'Nem vagy bejelentkezve.' }

  if (user.id === userId) {
    return { error: 'A sajat fiokodat nem torolheted.' }
  }

  const adminClient = createServiceRoleClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    return { error: error.message }
  }

  await writeAuditLog(supabase, user.id, userId, 'user.deleted', {})

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/reports')
  return { success: true }
}

export async function updateUserProfileByAdmin(userId: string, data: { full_name?: string, role?: UserRole, account_status?: AccountStatus }) {
  const { supabase, user, error: authError } = await requireAdminAction()
  if (authError || !user) return { error: authError || 'Nem vagy bejelentkezve.' }

  if (user.id === userId && ((data.role && data.role !== 'admin') || (data.account_status && data.account_status === 'suspended'))) {
    return { error: 'A sajat admin fiokodat nem korlatozhatod.' }
  }

  if (data.role && !isUserRole(data.role)) {
    return { error: 'Ervenytelen szerepkor.' }
  }
  if (data.account_status && !isAccountStatus(data.account_status)) {
    return { error: 'Ervenytelen fiokstatusz.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  await writeAuditLog(supabase, user.id, userId, 'user.profile_updated', { changes: data })

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: true }
}
