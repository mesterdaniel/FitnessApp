import { createClient } from '@/utils/supabase/server'
import { CoachClientsView } from '@/components/coach/clients-view'

export default async function CoachClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch clients from workout history
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

  let clients: any[] = []
  if (clientIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds)
      .order('full_name', { ascending: true })
    clients = data || []
  }

  const clientsWithStats = await Promise.all(
    clients.map(async (client) => {
      const { count: workoutCount } = await supabase
        .from('workout_participants')
        .select('*, workouts!inner(trainer_id)', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('workouts.trainer_id', user.id)
        .eq('status', 'accepted')

      const { data: passes } = await supabase
        .from('client_passes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true })

      const activePass = passes?.find(p => p.used_occasions < p.total_occasions) || null

      return {
        ...client,
        workoutCount: workoutCount || 0,
        activePass: activePass || null,
      }
    })
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kliensek kezelése</h1>
        <p className="text-zinc-400">A hozzád tartozó ügyfelek, akik foglaltak nálad edzést.</p>
      </div>

      <CoachClientsView clients={clientsWithStats} />
    </div>
  )
}
