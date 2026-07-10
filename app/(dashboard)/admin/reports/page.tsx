import { Activity, CalendarClock, CheckCircle2, Clock, TrendingUp, Users, ArrowRight, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { requireAdminPage } from '@/utils/supabase/admin'
import { AdminReportsCharts } from '@/components/admin/reports-charts'
import Link from 'next/link'

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

  const stats = {
    completedWorkouts: completedWorkouts || 0,
    cancelledWorkouts: cancelledWorkouts || 0,
    unreadMessages: unreadMessages || 0,
    suspendedUsers: suspendedUsers || 0,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-24 relative">
      {/* Decorative Gradients */}
      <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-2">
            <BarChart3 className="w-4 h-4 mr-2" /> Analitika
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Riportok és Statisztikák</h1>
          <p className="text-muted-foreground text-lg">Valós idejű platform aktivitási mutatók a vezetői döntésekhez.</p>
        </div>
        <Button asChild className="w-fit rounded-full bg-card border border-white/10 text-white hover:bg-zinc-800 font-bold px-6 shadow-xl transition-all">
          <Link href="/admin">Vissza a pultra</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in zoom-in-95 duration-700 delay-100 fill-mode-both">
        <ReportCard title="Aktív fiókok" value={activeUsers || 0} icon={Users} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
        <ReportCard title="Új fiók ebben a hónapban" value={monthlyUsers || 0} icon={TrendingUp} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
        <ReportCard title="Következő 7 nap edzései" value={upcomingWorkouts || 0} icon={CalendarClock} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" />
        <ReportCard title="Függő foglalások" value={pendingBookings || 0} icon={Clock} highlight />
      </div>

      <AdminReportsCharts topTrainers={topTrainers} stats={stats} />
    </div>
  )
}

function ReportCard({
  title,
  value,
  icon: Icon,
  highlight,
  color = 'text-muted-foreground',
  bg = 'bg-white/5',
  border = 'border-white/5'
}: {
  title: string
  value: number
  icon: typeof Users
  highlight?: boolean
  color?: string
  bg?: string
  border?: string
}) {
  return (
    <Card className={`relative overflow-hidden rounded-[2rem] border ${highlight ? 'border-yellow-500/50 bg-yellow-500/10' : `bg-background/50 ${border}`} backdrop-blur-xl shadow-xl transition-transform hover:scale-[1.02] duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${highlight ? 'text-yellow-500' : 'text-muted-foreground'}`}>{title}</CardTitle>
        <div className={`p-2 rounded-xl ${highlight ? 'bg-yellow-500/20 text-yellow-500' : `${bg} ${color}`}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-black ${highlight ? 'text-yellow-500' : 'text-white'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
