import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import type { FoodSearchResult } from '@/types/meal-planner'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  // Verify the caller is an authenticated trainer
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pattern = `%${query}%`

  // Fire both queries in parallel
  const [globalResult, trainerResult] = await Promise.all([
    supabase
      .from('global_foods')
      .select('id, name, calories, protein, carbs, fat')
      .ilike('name', pattern)
      .limit(10),

    supabase
      .from('trainer_foods')
      .select('id, trainer_id, name, calories, protein, carbs, fat, serving_size, brand')
      .eq('trainer_id', user.id)
      .ilike('name', pattern)
      .limit(10),
  ])

  const globalFoods: FoodSearchResult[] = (globalResult.data ?? []).map(f => ({
    id: f.id,
    source: 'global' as const,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    global_food_id: f.id,
  }))

  const trainerFoods: FoodSearchResult[] = (trainerResult.data ?? []).map(f => ({
    id: f.id,
    source: 'trainer' as const,
    name: f.name,
    brand: f.brand,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    serving_size: f.serving_size,
    trainer_food_id: f.id,
  }))

  // Trainers own foods appear first, then global
  const results: FoodSearchResult[] = [...trainerFoods, ...globalFoods]

  return NextResponse.json({ results })
}
