import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarCheck, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch basic platform stats
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: coachesCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'coach')

  const { count: workoutsCount } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Adminisztrációs Központ</h1>
        <p className="text-zinc-400">Platform szintű statisztikák és kezelés.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary border-none text-primary-foreground shadow-lg shadow-primary/20 rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Összes Felhasználó</CardTitle>
            <Users className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
            <p className="text-xs opacity-80 mt-1">Kliensek és Edzők együtt</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Regisztrált Edzők</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{coachesCount || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Aktív edzők a platformon</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Összes Edzés</CardTitle>
            <CalendarCheck className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{workoutsCount || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Létrehozott időpontok</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
