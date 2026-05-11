import { createClient } from '@/utils/supabase/server'
import { ClientDetailView } from '@/components/coach/client-detail-view'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch client's workouts with this coach
  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_participants!inner(status, client_id)
    `)
    .eq('trainer_id', user.id)
    .eq('workout_participants.client_id', id)
    .order('starts_at', { ascending: false })
    .limit(20)

  if (!workouts || workouts.length === 0) return notFound()

  // Fetch client profile after access has been established through shared workouts.
  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  // Fetch client's exercise logs
  const { data: exerciseLogs } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('client_id', id)
    .order('logged_at', { ascending: false })
    .limit(50)

  // Fetch client's weight logs
  const { data: weightLogs } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('client_id', id)
    .order('logged_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <ClientDetailView 
        client={client} 
        workouts={workouts || []} 
        exerciseLogs={exerciseLogs || []}
        weightLogs={weightLogs || []}
      />
    </div>
  )
}
