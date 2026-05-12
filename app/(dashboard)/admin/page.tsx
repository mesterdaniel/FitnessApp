import Link from 'next/link'
import { Activity, CalendarCheck, ShieldAlert, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { requireAdminPage } from '@/utils/supabase/admin'

type RecentUser = {
  id: string
  full_name: string | null
  role: string
  account_status: string | null
  created_at: string
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminPage()
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: usersCount },
    { count: trainersCount },
    { count: workoutsCount },
    { count: pendingBookingsCount },
    { count: newUsersCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('workouts').select('*', { count: 'exact', head: true }),
    supabase.from('workout_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, account_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adminisztracios kozpont</h1>
          <p className="text-zinc-400">Platform allapot, jogosultsagok es gyors admin teendok.</p>
        </div>
        <Button asChild className="w-fit rounded-full">
          <Link href="/admin/users">Felhasznalok kezelese</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Osszes felhasznalo" value={usersCount || 0} icon={Users} tone="primary" />
        <MetricCard title="Regisztralt edzok" value={trainersCount || 0} icon={Activity} />
        <MetricCard title="Osszes edzes" value={workoutsCount || 0} icon={CalendarCheck} />
        <MetricCard title="Varakozo foglalas" value={pendingBookingsCount || 0} icon={ShieldAlert} highlight />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-3xl border-none bg-card shadow-md">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Legujabb regisztraciok</h2>
              <p className="text-sm text-zinc-500">Ebben a honapban {newUsersCount || 0} uj fiok jott letre.</p>
            </div>
            <div className="space-y-2">
              {((recentUsers || []) as RecentUser[]).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">{profile.full_name || 'Nevtelen felhasznalo'}</p>
                    <p className="text-xs text-zinc-500">{profile.role} - {profile.account_status || 'active'}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(profile.created_at).toLocaleDateString('hu-HU')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-card shadow-md">
          <CardContent className="space-y-3 p-5">
            <h2 className="text-lg font-bold">Kovetkezo lepesek</h2>
            <QuickLink href="/admin/users" label="Role es statusz ellenorzes" />
            <QuickLink href="/admin/reports" label="Aktivitasi riportok" />
            <QuickLink href="/admin/settings" label="Platform beallitasok" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
  highlight,
}: {
  title: string
  value: number
  icon: typeof Users
  tone?: 'primary'
  highlight?: boolean
}) {
  return (
    <Card className={`${tone === 'primary' ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-card'} rounded-3xl border-none shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${tone === 'primary' ? '' : 'text-zinc-400'}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? 'text-yellow-500' : tone === 'primary' ? 'opacity-80' : 'text-zinc-400'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${tone === 'primary' ? '' : highlight ? 'text-yellow-500' : 'text-zinc-100'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-2xl bg-background px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-primary/10 hover:text-primary">
      {label}
    </Link>
  )
}
