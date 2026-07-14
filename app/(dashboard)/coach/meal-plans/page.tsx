import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { MealPlanEditor } from '@/components/coach/meal-planner/meal-plan-editor'
import { ClientSelector } from '@/components/coach/meal-planner/client-selector'
import type { MealPlan, TrainerFood } from '@/types/meal-planner'

export const metadata = {
  title: 'Étrendek | FitnessApp',
  description: 'Kliensek étrend-terveinek összeállítása és kezelése',
}

interface PageProps {
  searchParams: Promise<{ client?: string }>
}

export default async function MealPlansPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    redirect('/client')
  }

  // Fetch clients from workout history
  const { data: participantData } = await supabase
    .from('workout_participants')
    .select('client_id, workouts!inner(trainer_id)')
    .eq('workouts.trainer_id', user.id)

  // Fetch clients from explicit connection table
  const { data: explicitConnections } = await supabase
    .from('trainer_clients')
    .select('client_id, status')
    .eq('trainer_id', user.id)

  const clientIdsFromWorkouts = participantData?.map((p) => p.client_id) || []
  const clientIdsFromConnections = explicitConnections?.filter(c => c.status === 'active').map((c) => c.client_id) || []
  const rejectedClientIds = new Set(explicitConnections?.filter(c => c.status === 'rejected').map((c) => c.client_id) || [])

  const allClientIds = [...new Set([...clientIdsFromWorkouts, ...clientIdsFromConnections])]
  const activeClientIds = allClientIds.filter(id => !rejectedClientIds.has(id))

  let clients: { id: string; full_name: string; avatar_url?: string }[] = []
  if (activeClientIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', activeClientIds)
      .order('full_name', { ascending: true })
    if (data) {
      clients = data as { id: string; full_name: string; avatar_url?: string }[]
    }
  }

  // Determine selected client
  const selectedClientId = params.client ?? clients[0]?.id ?? null
  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null

  // Fetch client-specific meal plans
  let clientPlans: MealPlan[] = []
  if (selectedClientId) {
    const { data } = await supabase
      .from('meal_plans')
      .select(`*, meals(*, meal_items(*))`)
      .eq('trainer_id', user.id)
      .eq('client_id', selectedClientId)
      .eq('is_template', false)
      .order('created_at', { ascending: false })

    if (data) {
      clientPlans = data.map(plan => ({
        ...plan,
        is_template: false,
        meals: (plan.meals ?? []).sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
      })) as MealPlan[]
    }
  }

  // Fetch trainer's own templates (no client_id)
  const { data: templateData } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*))`)
    .eq('trainer_id', user.id)
    .eq('is_template', true)
    .order('created_at', { ascending: false })

  const templates: MealPlan[] = (templateData ?? []).map(plan => ({
    ...plan,
    is_template: true,
    client_id: null,
    meals: (plan.meals ?? []).sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
  })) as MealPlan[]

  // Fetch trainer's custom foods
  const { data: trainerFoodsData } = await supabase
    .from('trainer_foods')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name', { ascending: true })

  const trainerFoods: TrainerFood[] = trainerFoodsData ?? []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Étrend-összeállító</h1>
        <p className="text-sm text-muted-foreground">
          Klienseid számára személyre szabott étrend-tervek készítése, sablon-rendszerrel.
        </p>
      </div>

      {/* Client selector */}
      {clients.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Kiválasztott kliens:</span>
          <ClientSelector clients={clients} selectedClientId={selectedClientId} />
        </div>
      )}

      <MealPlanEditor
        key={selectedClient?.id ?? 'no-client'}
        clientId={selectedClient?.id}
        clientName={selectedClient?.full_name}
        initialPlans={clientPlans}
        initialTemplates={templates}
        initialTrainerFoods={trainerFoods}
        clients={clients}
      />
    </div>
  )
}
