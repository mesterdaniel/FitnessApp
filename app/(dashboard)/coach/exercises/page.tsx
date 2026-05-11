import { createClient } from '@/utils/supabase/server'
import { ExercisesView } from '@/components/coach/exercises-view'

export default async function CoachExercisesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('trainer_id', user.id)
    .order('created_at', { ascending: false })

  return <ExercisesView exercises={exercises || []} />
}
