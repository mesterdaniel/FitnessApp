import Link from 'next/link'
import { Activity, CalendarCheck, ShieldAlert, Users, ArrowRight, Shield, Zap } from 'lucide-react'
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
    { count: pendingUsersCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('workouts').select('*', { count: 'exact', head: true }),
    supabase.from('workout_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'pending'),
  ])

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, account_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: pendingUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, account_status, created_at')
    .eq('account_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-24 relative">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
            <Shield className="w-4 h-4 mr-2" /> Rendszer Adminisztráció
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Irányítópult</h1>
          <p className="text-muted-foreground text-lg">Átfogó rálátás a platform működésére és aktivitására.</p>
        </div>
        <Button asChild className="w-fit rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-6 shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95">
          <Link href="/admin/users">Felhasználók kezelése <ArrowRight className="w-4 h-4 ml-2" /></Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in zoom-in-95 duration-700 delay-100 fill-mode-both">
        <MetricCard title="Összes Felhasználó" value={usersCount || 0} icon={Users} tone="primary" />
        <MetricCard title="Regisztrált Edzők" value={trainersCount || 0} icon={Activity} />
        <MetricCard title="Összes Edzés" value={workoutsCount || 0} icon={CalendarCheck} />
        <MetricCard title="Várakozó Foglalás" value={pendingBookingsCount || 0} icon={Clock} highlight={pendingBookingsCount! > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
        {/* Várakozó Felhasználók Szekció */}
        <Card className="rounded-[2rem] border border-white/5 bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-500">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Jóváhagyásra vár</CardTitle>
                <p className="text-sm text-muted-foreground">{pendingUsersCount || 0} fiók vár aktiválásra.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {((pendingUsers || []) as RecentUser[]).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-zinc-700" />
                  <p>Minden fiók jóváhagyva.</p>
                </div>
              ) : (
                ((pendingUsers || []) as RecentUser[]).map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{profile.full_name || 'Névtelen'}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{profile.role}</p>
                    </div>
                    <Button asChild size="sm" className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-8 px-4">
                      <Link href={`/admin/users?q=${profile.id}`}>Kezelés</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legújabb Regisztrációk */}
        <Card className="rounded-[2rem] border border-white/5 bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Legújabb Regisztrációk</CardTitle>
                  <p className="text-sm text-muted-foreground">Ebben a hónapban {newUsersCount || 0} új fiók jött létre.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/10 bg-black/50 hover:bg-white/10">
                <Link href="/admin/users">Összes mutatása</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
            {((recentUsers || []) as RecentUser[]).map((profile, i) => (
              <div 
                key={profile.id} 
                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/40 p-4 hover:bg-white/5 hover:border-white/10 transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{profile.full_name || 'Névtelen'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      profile.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      profile.role === 'trainer' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-zinc-800 text-muted-foreground'
                    }`}>
                      {profile.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
  const isPrimary = tone === 'primary'
  return (
    <Card className={`relative overflow-hidden rounded-[2rem] border ${
      isPrimary ? 'border-primary/50 bg-primary/20' : highlight ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/5 bg-background/50'
    } backdrop-blur-xl shadow-xl transition-transform hover:scale-[1.02] duration-300`}>
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isPrimary ? 'bg-primary' : highlight ? 'bg-yellow-500' : 'bg-white'
      }`} />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-semibold tracking-wide uppercase ${
            isPrimary ? 'text-primary-foreground/90' : highlight ? 'text-yellow-500/90' : 'text-muted-foreground'
          }`}>{title}</p>
          <div className={`p-2.5 rounded-lg ${
            isPrimary ? 'bg-primary/20 text-primary-foreground' : highlight ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-muted-foreground'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className={`text-5xl font-black tracking-tighter ${
            isPrimary ? 'text-white drop-shadow-md' : highlight ? 'text-yellow-500' : 'text-foreground'
          }`}>
            {value}
          </h2>
        </div>
      </CardContent>
    </Card>
  )
}

// Ensure ShieldCheck and Clock are imported
import { ShieldCheck, Clock } from 'lucide-react'
