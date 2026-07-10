import { createClient } from '@/utils/supabase/server'
import { ProgressView } from '@/components/client/progress-view'

export const dynamic = 'force-dynamic'

export default async function ClientProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let logs: any[] = []
  let weightLogs: any[] = []

  let completedWorkoutsCount = 0

  if (user) {
    const { data: exerciseLogs } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('client_id', user.id)
      .order('logged_at', { ascending: false })
    
    if (exerciseLogs) logs = exerciseLogs

    const { data: wLogs } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', user.id)
      .order('logged_at', { ascending: false })
    
    if (wLogs) weightLogs = wLogs

    const { count } = await supabase
      .from('workout_participants')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('status', 'accepted')
      
    if (count) completedWorkoutsCount = count
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fejlődés & Statisztikák</h1>
        <p className="text-muted-foreground">Kövesd nyomon az eredményeidet és a testsúlyodat.</p>
      </div>

      <ProgressView logs={logs} weightLogs={weightLogs} completedWorkoutsCount={completedWorkoutsCount} />
    </div>
  )
}
