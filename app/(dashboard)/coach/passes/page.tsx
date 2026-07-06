import { createClient } from '@/utils/supabase/server'
import { PassesView } from '@/components/coach/passes-view'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CoachPassesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch coach's clients based on workout history
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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds)
      .order('full_name', { ascending: true })
    
    clients = profiles || []
  }

  // Fetch all passes for these clients
  let passes: any[] = []
  if (clientIds.length > 0) {
    const { data: clientPasses } = await supabase
      .from('client_passes')
      .select('*')
      .in('client_id', clientIds)
      .order('purchase_date', { ascending: false })
    
    passes = clientPasses || []
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <PassesView clients={clients} passes={passes} />
    </div>
  )
}
