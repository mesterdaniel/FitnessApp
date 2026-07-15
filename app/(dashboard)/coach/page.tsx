import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarDays, ClipboardList, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CoachDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch clients from workout history to count actual clients
  const { data: participantData } = await supabase
    .from('workout_participants')
    .select(`
      client_id,
      workouts!inner(trainer_id)
    `)
    .eq('workouts.trainer_id', user.id)

  // Fetch clients from explicit connection table
  const { data: explicitConnections } = await supabase
    .from('trainer_clients')
    .select('client_id')
    .eq('trainer_id', user.id)
    .eq('status', 'active')

  const clientIdsFromWorkouts = participantData?.map((p) => p.client_id) || []
  const clientIdsFromConnections = explicitConnections?.map((c) => c.client_id) || []
  const clientIds = [...new Set([...clientIdsFromWorkouts, ...clientIdsFromConnections])]
  const clientsCount = clientIds.length

  // Upcoming workouts with participants
  const { data: upcomingWorkouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_participants(
        id,
        status,
        modification_status,
        profiles!workout_participants_client_id_fkey(full_name)
      )
    `)
    .eq('trainer_id', user.id)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  // Count pending participants across all workouts
  const { count: pendingCount } = await supabase
    .from('workout_participants')
    .select('*, workouts!inner(trainer_id)', { count: 'exact', head: true })
    .eq('workouts.trainer_id', user.id)
    .or('status.eq.pending,modification_status.eq.pending')

  // Unread messages count
  const { data: myConversations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', user.id)
  
  let unreadCount = 0
  if (myConversations && myConversations.length > 0) {
    const convIds = myConversations.map(c => c.conversation_id)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null)
    unreadCount = count || 0
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edzői Áttekintés</h1>
        <p className="text-muted-foreground">Kezeld az ügyfeleidet és a közelgő edzéseket egy helyen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/coach/workouts">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer neon-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Közelgő edzések</CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-foreground">
                {upcomingWorkouts?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Betáblázva az elkövetkező napokra</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/coach/clients">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ügyfelek száma</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-foreground">{clientsCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Összes regisztrált kliens</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/coach/workouts">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Várakozó kérések</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-yellow-500">{pendingCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Elfogadásra váró jelentkezők</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chat">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Új üzenetek</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-red-400">{unreadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Olvasatlan üzenet</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-xl font-bold tracking-tight mt-8 mb-4">Következő edzéseim</h2>
      <div className="space-y-4">
        {upcomingWorkouts && upcomingWorkouts.length > 0 ? (
          upcomingWorkouts.map((workout: any) => {
            const accepted = workout.workout_participants?.filter((p: any) => p.status === 'accepted') || []
            const pending = workout.workout_participants?.filter((p: any) => p.status === 'pending' || p.modification_status === 'pending') || []
            const participantNames = accepted.map((p: any) => p.profiles?.full_name).filter(Boolean).join(', ')
            
            return (
            <Card key={workout.id} className="bg-card border-none shadow-md rounded-lg overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mr-4 shrink-0">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="break-words font-semibold leading-tight text-foreground">{workout.title}</h3>
                  <p className="break-words text-sm text-muted-foreground">
                    {new Date(workout.starts_at).toLocaleString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {participantNames ? ` • ${participantNames}` : ' • Nyitott edzés'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {pending.length > 0 && (
                    <div className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-500">
                      {pending.length} függőben
                    </div>
                  )}
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    workout.status === 'available' ? 'bg-primary/20 text-primary' : 'bg-background text-muted-foreground'
                  }`}>
                    {accepted.length}/{workout.capacity || 1} fő
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })
        ) : (
          <Card className="bg-card border-none border-dashed rounded-lg">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nincs betervezett edzésed a közeljövőben.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
