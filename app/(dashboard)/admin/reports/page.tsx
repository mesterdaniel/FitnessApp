import { Activity, CalendarClock, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminPage } from '@/utils/supabase/admin'

type TrainerWorkout = {
  trainer_id: string
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
}

export default async function AdminReportsPage() {
  const { supabase } = await requireAdminPage()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: activeUsers },
    { count: suspendedUsers },
    { count: monthlyUsers },
    { count: upcomingWorkouts },
    { count: completedWorkouts },
    { count: cancelledWorkouts },
    { count: pendingBookings },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'suspended'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('workouts').select('*', { count: 'exact', head: true }).gte('starts_at', now.toISOString()).lte('starts_at', nextWeek),
    supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('starts_at', monthStart),
    supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('starts_at', monthStart),
    supabase.from('workout_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null),
  ])

  const { data: trainerLoad } = await supabase
    .from('workouts')
    .select('trainer_id, profiles!workouts_trainer_id_fkey(full_name)')
    .gte('starts_at', monthStart)

  const trainerCounts = new Map<string, { name: string; count: number }>()
  ;((trainerLoad || []) as unknown as TrainerWorkout[]).forEach((workout) => {
    const profile = Array.isArray(workout.profiles) ? workout.profiles[0] : workout.profiles
    const current = trainerCounts.get(workout.trainer_id) || {
      name: profile?.full_name || 'Ismeretlen edzo',
      count: 0,
    }
    trainerCounts.set(workout.trainer_id, { ...current, count: current.count + 1 })
  })

  const topTrainers = Array.from(trainerCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riportok es statisztikak</h1>
        <p className="text-zinc-400">Valos platform aktivitasi mutatok az admin dontesekhez.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportCard title="Aktiv fiokok" value={activeUsers || 0} icon={Users} />
        <ReportCard title="Uj fiok ebben a honapban" value={monthlyUsers || 0} icon={TrendingUp} />
        <ReportCard title="Kovetkezo 7 nap edzesei" value={upcomingWorkouts || 0} icon={CalendarClock} />
        <ReportCard title="Fuggo foglalasok" value={pendingBookings || 0} icon={Clock} highlight />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-none bg-card shadow-md">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Edzes allapotok</h2>
              <p className="text-sm text-zinc-500">Aktualis havi teljesites es lemorzsolodas.</p>
            </div>
            <StatusRow label="Teljesitett edzesek" value={completedWorkouts || 0} icon={CheckCircle2} />
            <StatusRow label="Lemondott edzesek" value={cancelledWorkouts || 0} icon={Activity} />
            <StatusRow label="Olvasatlan uzenetek" value={unreadMessages || 0} icon={Clock} />
            <StatusRow label="Felfuggesztett fiokok" value={suspendedUsers || 0} icon={Users} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-card shadow-md">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Legaktivabb edzok</h2>
              <p className="text-sm text-zinc-500">Havi edzesszam alapjan.</p>
            </div>
            <div className="space-y-2">
              {topTrainers.map((trainer) => (
                <div key={trainer.name} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold text-zinc-100">{trainer.name}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{trainer.count}</span>
                </div>
              ))}
              {topTrainers.length === 0 && (
                <div className="rounded-2xl bg-background px-4 py-6 text-center text-sm text-zinc-500">
                  Ebben a honapban meg nincs edzoi aktivitasi adat.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReportCard({
  title,
  value,
  icon: Icon,
  highlight,
}: {
  title: string
  value: number
  icon: typeof Users
  highlight?: boolean
}) {
  return (
    <Card className="rounded-3xl border-none bg-card shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? 'text-yellow-500' : 'text-zinc-400'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-yellow-500' : 'text-zinc-100'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusRow({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-semibold text-zinc-200">{label}</span>
      </div>
      <span className="text-sm font-bold text-zinc-100">{value}</span>
    </div>
  )
}
