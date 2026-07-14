'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, UtensilsCrossed, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MacrosSummaryBar } from '@/components/coach/meal-planner/macros-summary-bar'
import type { MealPlan, Meal, MacroTotals } from '@/types/meal-planner'
import { sumMacros } from '@/types/meal-planner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mealTotals(meal: Meal): MacroTotals {
  return sumMacros(meal.meal_items ?? [])
}
function planTotals(plan: MealPlan): MacroTotals {
  return sumMacros((plan.meals ?? []).flatMap(m => m.meal_items ?? []))
}

const sourceLabel: Record<string, string> = {
  global: 'Alap', trainer: 'Egyedi', external: 'Bolti',
}
const sourceColor: Record<string, string> = {
  global: 'text-violet-400', trainer: 'text-emerald-400', external: 'text-amber-400',
}

// ─── Meal Card (read-only) ────────────────────────────────────────────────────

function ReadonlyMealCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(true)
  const items = meal.meal_items ?? []
  const totals = mealTotals(meal)

  return (
    <Card className="bg-card border border-border shadow-sm overflow-hidden">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30 select-none"
        onClick={() => setOpen(p => !p)}
      >
        <UtensilsCrossed className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-foreground">{meal.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {items.length} tétel · {totals.calories.toFixed(0)} kcal
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </div>

      {open && (
        <div className="border-t border-border">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground italic">Üres étkezés.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground break-words">{item.food_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {item.brand && (
                        <span className="text-[10px] text-muted-foreground">{item.brand}</span>
                      )}
                      <span className={`text-[10px] font-medium ${sourceColor[item.food_source] ?? ''}`}>
                        {sourceLabel[item.food_source]}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">{item.amount_grams} g</p>
                    <p className="text-[11px] text-amber-400">{item.calories.toFixed(0)} kcal</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.protein.toFixed(1)}F · {item.carbs.toFixed(1)}SZH · {item.fat.toFixed(1)}Zs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="border-t border-border px-3 py-3">
              <MacrosSummaryBar totals={totals} />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NutritionView({ plans }: { plans: MealPlan[] }) {
  const [activePlanId, setActivePlanId] = useState<string | null>(plans[0]?.id ?? null)
  const activePlan = plans.find(p => p.id === activePlanId) ?? null

  if (plans.length === 0) {
    return (
      <Card className="border-dashed border-border">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-muted-foreground">Még nincs étrend-terved</p>
          <p className="text-sm text-muted-foreground max-w-xs text-center">
            Az edződ hozzárendelt étrendjei itt fognak megjelenni.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totals = activePlan ? planTotals(activePlan) : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  return (
    <div className="space-y-5">
      {/* Plan selector pills */}
      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plans.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePlanId(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                p.id === activePlanId
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {activePlan && (
        <>
          {/* Plan meta */}
          {(activePlan.start_date || activePlan.description) && (
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="px-4 py-3">
                {activePlan.description && (
                  <p className="text-sm text-muted-foreground">{activePlan.description}</p>
                )}
                {activePlan.start_date && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    {new Date(activePlan.start_date).toLocaleDateString('hu-HU', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    {activePlan.end_date && ` – ${new Date(activePlan.end_date).toLocaleDateString('hu-HU', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Daily total */}
          <Card className="bg-card border border-primary/20 shadow-md shadow-primary/10">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Napi összesítő
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <MacrosSummaryBar totals={totals} />
            </CardContent>
          </Card>

          {/* Meals */}
          <div className="space-y-3">
            {(activePlan.meals ?? []).map(meal => (
              <ReadonlyMealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
