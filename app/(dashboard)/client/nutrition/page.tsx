import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { NutritionView } from '@/components/client/nutrition-view'
import type { MealPlan } from '@/types/meal-planner'

export const metadata = {
  title: 'Étrendem | FitnessApp',
  description: 'Az edződ által összeállított étrend-tervek',
}

export default async function ClientNutritionPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Fetch all meal plans assigned to this client (non-template)
  const { data } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*))`)
    .eq('client_id', user.id)
    .eq('is_template', false)
    .order('created_at', { ascending: false })

  const plans: MealPlan[] = (data ?? []).map(plan => ({
    ...plan,
    is_template: false,
    meals: (plan.meals ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
    ),
  })) as MealPlan[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Étrendem</h1>
        <p className="text-sm text-muted-foreground">
          Az edződ által összeállított étrend-tervek és napi makróid.
        </p>
      </div>

      <NutritionView plans={plans} />
    </div>
  )
}
