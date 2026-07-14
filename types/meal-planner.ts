// ─── Core Food Types ──────────────────────────────────────────────────────────

export interface GlobalFood {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at?: string
}

export interface TrainerFood {
  id: string
  trainer_id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving_size?: string | null
  brand?: string | null
  created_at?: string
}

// Unified search result – normalised from any source
export type FoodSource = 'global' | 'trainer' | 'external'

export interface FoodSearchResult {
  /** Unique identifier within source (UUID for DB rows, barcode/slug for external) */
  id: string
  source: FoodSource
  name: string
  brand?: string | null
  /** Per 100 g */
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Only present for trainer_foods */
  serving_size?: string | null
  /** Raw global_food_id – only when source === 'global' */
  global_food_id?: string
  /** Raw trainer_food_id – only when source === 'trainer' */
  trainer_food_id?: string
}

// ─── Meal Plan Structure ──────────────────────────────────────────────────────

export interface MealPlan {
  id: string
  trainer_id: string
  /** null when is_template = true */
  client_id: string | null
  title: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  is_template: boolean
  created_at: string
  updated_at: string
  meals?: Meal[]
}

export interface Meal {
  id: string
  meal_plan_id: string
  name: string
  order_index: number
  created_at: string
  meal_items?: MealItem[]
}

export interface MealItem {
  id: string
  meal_id: string
  food_source: FoodSource
  global_food_id?: string | null
  trainer_food_id?: string | null
  food_name: string
  brand?: string | null
  amount_grams: number
  /** Pre-calculated at insertion time */
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

// ─── Macro Totals Helper ──────────────────────────────────────────────────────

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function calcMacros(food: Pick<FoodSearchResult, 'calories' | 'protein' | 'carbs' | 'fat'>, grams: number): MacroTotals {
  const ratio = grams / 100
  return {
    calories: Math.round(food.calories * ratio * 10) / 10,
    protein:  Math.round(food.protein  * ratio * 10) / 10,
    carbs:    Math.round(food.carbs    * ratio * 10) / 10,
    fat:      Math.round(food.fat      * ratio * 10) / 10,
  }
}

export function sumMacros(items: Pick<MealItem, 'calories' | 'protein' | 'carbs' | 'fat'>[]): MacroTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein:  acc.protein  + item.protein,
      carbs:    acc.carbs    + item.carbs,
      fat:      acc.fat      + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface AddMealItemPayload {
  meal_id: string
  food: FoodSearchResult
  amount_grams: number
}

export interface CreateMealPlanPayload {
  /** null when creating a template */
  client_id?: string | null
  title: string
  description?: string
  start_date?: string
  end_date?: string
  is_template?: boolean
}

export interface SaveTrainerFoodPayload {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving_size?: string
  brand?: string
}

export interface UpdateTrainerFoodPayload {
  name?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  serving_size?: string | null
  brand?: string | null
}

export interface AddMealPayload {
  meal_plan_id: string
  name: string
  order_index: number
}

export interface UpdateMealPlanPayload {
  title?: string
  description?: string
  start_date?: string | null
  end_date?: string | null
}
