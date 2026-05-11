import { createClient } from '@/utils/supabase/server'
import { CoachClientsView } from '@/components/coach/clients-view'

export default async function CoachClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: participantData } = await supabase
    .from('workout_participants')
    .select(`
      client_id,
      workouts!inner(trainer_id)
    `)
    .eq('workouts.trainer_id', user.id)

  const clientIds = [...new Set(participantData?.map((participant) => participant.client_id) || [])]

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

      return {
        ...client,
        workoutCount: workoutCount || 0,
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
