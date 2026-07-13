import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, CalendarCheck, MessageSquare, Ticket, Zap, Trophy, Medal } from 'lucide-react'
import Link from 'next/link'
import { bookWorkout } from '@/app/(dashboard)/client/workouts/actions'
import { Button } from '@/components/ui/button'

const getBadges = (count: number) => {
  const badges = []
  if (count >= 1) badges.push({ name: 'Első Lépés', color: 'bg-blue-500/20 text-blue-400', icon: Medal })
  if (count >= 10) badges.push({ name: 'Kitartó (10)', color: 'bg-purple-500/20 text-purple-400', icon: Trophy })
  if (count >= 50) badges.push({ name: 'Mester (50)', color: 'bg-yellow-500/20 text-yellow-500', icon: Trophy })
  return badges.reverse()
}

export default async function ClientDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Fetch upcoming workouts via workout_participants
  const { data: upcomingWorkouts } = await supabase
    .from('workouts')
    .select(`
      *,
      profiles!workouts_trainer_id_fkey(full_name),
      workout_participants!inner(status, client_id)
    `)
    .eq('workout_participants.client_id', user.id)
    .in('workout_participants.status', ['accepted', 'pending'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  // Unread messages count (only in user's conversations)
  const { data: myConversations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', user.id)
  
  let unreadMessagesCount = 0
  if (myConversations && myConversations.length > 0) {
    const convIds = myConversations.map(c => c.conversation_id)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null)
    unreadMessagesCount = count || 0
  }

  // Fetch active pass
  const { data: passes } = await supabase
    .from('client_passes')
    .select('total_occasions, used_occasions')
    .eq('client_id', user.id)
    .order('purchase_date', { ascending: true })

  const activePass = passes?.find(p => p.used_occasions < p.total_occasions) || null

  // Next available workout for quick rebook
  const { data: nextAvailableWorkout } = await supabase
    .from('workouts')
    .select('id, title, starts_at')
    .eq('status', 'available')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Fetch past workouts for gamification
  const { count: completedWorkoutsCount } = await supabase
    .from('workout_participants')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .eq('status', 'accepted')

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kliens Áttekintés</h1>
        <p className="text-muted-foreground">Szia! Itt látod a következő fontos teendőket és az edzéseidet.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/client/workouts">
          <Card className="bg-card border border-primary/20 text-foreground shadow-lg shadow-primary/20 rounded-lg hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Következő edzés</CardTitle>
              <Dumbbell className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-xl font-bold leading-tight sm:text-2xl">
                {upcomingWorkouts && upcomingWorkouts.length > 0 
                  ? new Date(upcomingWorkouts[0].starts_at).toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Nincs betervezve'}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {upcomingWorkouts && upcomingWorkouts.length > 0 ? upcomingWorkouts[0].title : 'Kattints ide a foglaláshoz'}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/workouts">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Összes edzésed</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-foreground">{upcomingWorkouts?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Közelgő edzés</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chat">
          <Card className="bg-card border-none rounded-lg shadow-md hover:scale-[1.02] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Új üzenetek</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-2xl font-bold text-red-400">{unreadMessagesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Olvasatlan üzenet</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-none shadow-md rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Aktív Bérlet</h3>
                {activePass ? (
                  <p className="text-sm text-muted-foreground">Még {activePass.total_occasions - activePass.used_occasions} alkalom felhasználható.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nincs aktív bérleted.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-md rounded-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-24 w-24 text-primary" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col h-full justify-between gap-4">
              <div>
                <h3 className="font-bold mb-1">Gyors Jelentkezés</h3>
                {nextAvailableWorkout ? (
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextAvailableWorkout.starts_at).toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {nextAvailableWorkout.title}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nincs elérhető edzés.</p>
                )}
              </div>
              {nextAvailableWorkout && (
                <form action={bookWorkout.bind(null, nextAvailableWorkout.id)}>
                  {activePass ? (
                    <Button type="submit" size="sm" className="w-fit rounded-full shadow-lg shadow-primary/20">
                      <Zap className="h-4 w-4 mr-2" /> 1-Kattintásos Foglalás
                    </Button>
                  ) : (
                    <Button type="button" disabled size="sm" className="w-fit rounded-full">
                      Nincs aktív bérlet
                    </Button>
                  )}
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-card border-none shadow-md rounded-lg">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Kitüntetéseid</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-zinc-800 w-28 text-center">
                <span className="text-2xl font-bold text-foreground">{completedWorkoutsCount || 0}</span>
                <span className="text-xs text-muted-foreground mt-1">Elvégzett edzés</span>
              </div>
              {getBadges(completedWorkoutsCount || 0).map((badge, idx) => {
                const Icon = badge.icon
                return (
                  <div key={idx} className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-zinc-800 w-28 text-center">
                    <div className={`p-2 rounded-full mb-2 ${badge.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{badge.name}</span>
                  </div>
                )
              })}
              {(!completedWorkoutsCount || completedWorkoutsCount === 0) && (
                <div className="flex flex-col justify-center text-sm text-muted-foreground italic p-4">
                  Végezz el egy edzést az első kitüntetéshez!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold tracking-tight mt-8 mb-4">Következő edzéseim</h2>
      <div className="space-y-4">
        {upcomingWorkouts && upcomingWorkouts.length > 0 ? (
          upcomingWorkouts.map((workout: any) => {
            const myStatus = workout.workout_participants?.[0]?.status || 'pending'
            return (
            <Card key={workout.id} className="bg-card border-none shadow-md rounded-lg overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mr-4 shrink-0">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="break-words font-semibold leading-tight text-foreground">{workout.title}</h3>
                  <p className="break-words text-sm text-muted-foreground">
                    {new Date(workout.starts_at).toLocaleString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Edző: {workout.profiles?.full_name || 'Ismeretlen'}
                  </p>
                </div>
                <div className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${
                  myStatus === 'accepted' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {myStatus === 'accepted' ? 'Jóváhagyva' : 'Függőben'}
                </div>
              </CardContent>
            </Card>
            )
          })
        ) : (
          <Card className="bg-card border-none border-dashed rounded-lg">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nincs még betervezett edzésed. Menj az Edzések menübe és jelentkezz egyre!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
