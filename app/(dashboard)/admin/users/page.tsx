import { AdminUsersView, type AdminUser } from '@/components/admin/users-view'
import { Card, CardContent } from '@/components/ui/card'
import { requireAdminPage } from '@/utils/supabase/admin'
import { isUserRole } from '@/utils/roles'

type AuditLog = {
  id: string
  target_user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const { supabase, user } = await requireAdminPage()
  const params = await searchParams
  const search = (params.q || '').trim()
  const role = params.role || 'all'

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (isUserRole(role)) {
    query = query.eq('role', role)
  }

  if (search) {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search)
    query = uuidLike
      ? query.or(`full_name.ilike.%${search}%,id.eq.${search}`)
      : query.ilike('full_name', `%${search}%`)
  }

  const [{ data: users }, { data: auditLogs }] = await Promise.all([
    query,
    supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Felhasznalok kezelese</h1>
        <p className="text-zinc-400">
          Szerepkorok, fiokstatuszok es admin muveletek kovetese egy helyen.
        </p>
      </div>

      <AdminUsersView
        users={(users || []) as AdminUser[]}
        search={search}
        role={role}
        currentUserId={user!.id}
      />

      <Card className="rounded-3xl border-none bg-card shadow-md">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold">Legutobbi admin muveletek</h2>
            <p className="text-sm text-zinc-500">Audit log a szerepkor es statusz valtoztatasokhoz.</p>
          </div>
          <div className="space-y-2">
            {((auditLogs || []) as AuditLog[]).map((log) => (
              <div key={log.id} className="rounded-2xl bg-background px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-200">{log.action}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(log.created_at).toLocaleString('hu-HU')}
                  </span>
                </div>
                <p className="mt-1 text-zinc-500">
                  Cel: {log.target_user_id?.slice(0, 8) || 'n/a'} - {JSON.stringify(log.metadata)}
                </p>
              </div>
            ))}
            {(!auditLogs || auditLogs.length === 0) && (
              <div className="rounded-2xl bg-background px-4 py-6 text-center text-sm text-zinc-500">
                Meg nincs audit bejegyzes.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
