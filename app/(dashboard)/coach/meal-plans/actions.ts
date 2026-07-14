'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { calcMacros } from '@/types/meal-planner'
import type {
  CreateMealPlanPayload,
  AddMealPayload,
  AddMealItemPayload,
  SaveTrainerFoodPayload,
  UpdateTrainerFoodPayload,
  UpdateMealPlanPayload,
} from '@/types/meal-planner'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function requireTrainer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    throw new Error('Forbidden: trainer role required')
  }

  return { supabase, user }
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export async function createMealPlan(payload: CreateMealPlanPayload) {
  const { supabase, user } = await requireTrainer()

  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      trainer_id: user.id,
      client_id: payload.client_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      is_template: payload.is_template ?? false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function updateMealPlan(planId: string, fields: UpdateMealPlanPayload) {
  const { supabase, user } = await requireTrainer()

  const { data, error } = await supabase
    .from('meal_plans')
    .update({
      ...(fields.title !== undefined && { title: fields.title }),
      ...(fields.description !== undefined && { description: fields.description }),
      ...(fields.start_date !== undefined && { start_date: fields.start_date }),
      ...(fields.end_date !== undefined && { end_date: fields.end_date }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('trainer_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function deleteMealPlan(mealPlanId: string) {
  const { supabase, user } = await requireTrainer()

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', mealPlanId)
    .eq('trainer_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
}

// ─── Template Actions ─────────────────────────────────────────────────────────

/**
 * Creates a standalone template plan (no client assigned).
 */
export async function createTemplatePlan(title: string, description?: string) {
  return createMealPlan({ title, description, is_template: true, client_id: null })
}

/**
 * Deep-copies an existing plan (client or template) as a new template.
 * Copies: plan metadata, all meals, all meal_items.
 */
export async function saveAsTemplate(sourcePlanId: string, newTitle: string) {
  const { supabase, user } = await requireTrainer()

  // 1. Fetch source plan with full nested data
  const { data: source, error: srcErr } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*))`)
    .eq('id', sourcePlanId)
    .eq('trainer_id', user.id)
    .single()

  if (srcErr || !source) throw new Error('Source plan not found')

  // 2. Create new template plan
  const { data: newPlan, error: planErr } = await supabase
    .from('meal_plans')
    .insert({
      trainer_id: user.id,
      client_id: null,
      title: newTitle,
      description: source.description,
      is_template: true,
    })
    .select()
    .single()

  if (planErr || !newPlan) throw new Error(planErr?.message ?? 'Failed to create template')

  // 3. Copy meals + items
  const meals = (source.meals ?? []) as Array<{
    name: string; order_index: number;
    meal_items: Array<{
      food_source: string; global_food_id: string | null; trainer_food_id: string | null;
      food_name: string; brand: string | null; amount_grams: number;
      calories: number; protein: number; carbs: number; fat: number;
    }>
  }>

  for (const meal of meals) {
    const { data: newMeal, error: mealErr } = await supabase
      .from('meals')
      .insert({ meal_plan_id: (newPlan as { id: string }).id, name: meal.name, order_index: meal.order_index })
      .select()
      .single()

    if (mealErr || !newMeal) continue

    const items = (meal.meal_items ?? []).map(item => ({
      meal_id: (newMeal as { id: string }).id,
      food_source: item.food_source,
      global_food_id: item.global_food_id,
      trainer_food_id: item.trainer_food_id,
      food_name: item.food_name,
      brand: item.brand,
      amount_grams: item.amount_grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }))

    if (items.length > 0) {
      await supabase.from('meal_items').insert(items)
    }
  }

  revalidatePath('/coach/meal-plans')
  return newPlan
}

/**
 * Deep-copies a template plan to a client (creates a new client-specific meal plan).
 */
export async function assignTemplateToClient(templateId: string, clientId: string) {
  const { supabase, user } = await requireTrainer()

  // 1. Fetch template
  const { data: template, error: tplErr } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*))`)
    .eq('id', templateId)
    .eq('trainer_id', user.id)
    .eq('is_template', true)
    .single()

  if (tplErr || !template) throw new Error('Template not found')

  // 2. Create client plan
  const { data: newPlan, error: planErr } = await supabase
    .from('meal_plans')
    .insert({
      trainer_id: user.id,
      client_id: clientId,
      title: template.title,
      description: template.description,
      is_template: false,
    })
    .select()
    .single()

  if (planErr || !newPlan) throw new Error(planErr?.message ?? 'Failed to create plan')

  // 3. Copy meals + items
  const meals = (template.meals ?? []) as Array<{
    name: string; order_index: number;
    meal_items: Array<{
      food_source: string; global_food_id: string | null; trainer_food_id: string | null;
      food_name: string; brand: string | null; amount_grams: number;
      calories: number; protein: number; carbs: number; fat: number;
    }>
  }>

  for (const meal of meals) {
    const { data: newMeal, error: mealErr } = await supabase
      .from('meals')
      .insert({ meal_plan_id: (newPlan as { id: string }).id, name: meal.name, order_index: meal.order_index })
      .select()
      .single()

    if (mealErr || !newMeal) continue

    const items = (meal.meal_items ?? []).map(item => ({
      meal_id: (newMeal as { id: string }).id,
      food_source: item.food_source,
      global_food_id: item.global_food_id,
      trainer_food_id: item.trainer_food_id,
      food_name: item.food_name,
      brand: item.brand,
      amount_grams: item.amount_grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }))

    if (items.length > 0) {
      await supabase.from('meal_items').insert(items)
    }
  }

  revalidatePath('/coach/meal-plans')
  return newPlan
}

// ─── Meals ────────────────────────────────────────────────────────────────────

export async function addMeal(payload: AddMealPayload) {
  const { supabase, user } = await requireTrainer()

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', payload.meal_plan_id)
    .eq('trainer_id', user.id)
    .single()

  if (!plan) throw new Error('Meal plan not found or access denied')

  const { data, error } = await supabase
    .from('meals')
    .insert({
      meal_plan_id: payload.meal_plan_id,
      name: payload.name,
      order_index: payload.order_index,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function deleteMeal(mealId: string) {
  const { supabase, user } = await requireTrainer()

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('trainer_id', user.id)

  const planIds = (plans ?? []).map((p: { id: string }) => p.id)
  if (planIds.length === 0) return

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)
    .in('meal_plan_id', planIds)

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
}

// ─── Meal Items ───────────────────────────────────────────────────────────────

export async function addMealItem(payload: AddMealItemPayload) {
  const { supabase } = await requireTrainer()

  const macros = calcMacros(payload.food, payload.amount_grams)

  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      meal_id: payload.meal_id,
      food_source: payload.food.source,
      global_food_id: payload.food.global_food_id ?? null,
      trainer_food_id: payload.food.trainer_food_id ?? null,
      food_name: payload.food.name,
      brand: payload.food.brand ?? null,
      amount_grams: payload.amount_grams,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function removeMealItem(mealItemId: string) {
  const { supabase } = await requireTrainer()

  const { error } = await supabase
    .from('meal_items')
    .delete()
    .eq('id', mealItemId)

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
}

// ─── Trainer Foods ────────────────────────────────────────────────────────────

export async function saveTrainerFood(payload: SaveTrainerFoodPayload) {
  const { supabase, user } = await requireTrainer()

  const { data, error } = await supabase
    .from('trainer_foods')
    .insert({
      trainer_id: user.id,
      name: payload.name,
      calories: payload.calories,
      protein: payload.protein,
      carbs: payload.carbs,
      fat: payload.fat,
      serving_size: payload.serving_size ?? null,
      brand: payload.brand ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function updateTrainerFood(foodId: string, fields: UpdateTrainerFoodPayload) {
  const { supabase, user } = await requireTrainer()

  const { data, error } = await supabase
    .from('trainer_foods')
    .update({
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.calories !== undefined && { calories: fields.calories }),
      ...(fields.protein !== undefined && { protein: fields.protein }),
      ...(fields.carbs !== undefined && { carbs: fields.carbs }),
      ...(fields.fat !== undefined && { fat: fields.fat }),
      ...(fields.serving_size !== undefined && { serving_size: fields.serving_size }),
      ...(fields.brand !== undefined && { brand: fields.brand }),
    })
    .eq('id', foodId)
    .eq('trainer_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
  return data
}

export async function deleteTrainerFood(foodId: string) {
  const { supabase, user } = await requireTrainer()

  const { error } = await supabase
    .from('trainer_foods')
    .delete()
    .eq('id', foodId)
    .eq('trainer_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/coach/meal-plans')
}
